import { getMarketplaceAdapter } from "@/lib/marketplace/adapters/generic.adapter";
import { masterListingRepository } from "@/lib/repositories/masterListing.repository";
import {
  ListingStatus,
  MarketplaceName,
  MarketplacePublishStatus,
  ValidationSeverity,
  type MasterListing,
} from "@/lib/types/master-listing";

import { getMarketplaceConnector } from "./connectors/simulated.connector";
import { getMonitoringSnapshots } from "./monitoring/snapshots";
import { listingJobRepository } from "./queue/job-repository";
import { assertTransition } from "./queue/state-machine";
import {
  computePublishingReadinessScore,
  validateListingPipeline,
} from "./readiness/compute-readiness";
import {
  buildMarketplaceStatusCards,
  type MarketplaceStatusCard,
} from "./status/marketplace-status";
import type {
  ListingIndexItem,
  ListingJob,
  ListingValidationResult,
} from "./types";

async function patchMarketplace(
  listing: MasterListing,
  marketplace: MarketplaceName,
  patch: Partial<MasterListing["marketplaces"][number]>,
) {
  return masterListingRepository.update(listing.id, {
    marketplaces: listing.marketplaces.map((channel) =>
      channel.marketplace === marketplace
        ? { ...channel, ...patch }
        : channel,
    ),
  });
}

async function processPublishJob(job: ListingJob): Promise<ListingJob> {
  assertTransition(job.status, "publishing");
  let current =
    (await listingJobRepository.transition(job.id, "publishing", {
      attempts: job.attempts + 1,
    })) ?? job;

  const listing = await masterListingRepository.getById(job.productId);
  if (!listing) {
    return (
      (await listingJobRepository.transition(job.id, "failed", {
        error: {
          code: "PRODUCT_NOT_FOUND",
          message: `Product ${job.productId} was not found.`,
        },
      })) ?? current
    );
  }

  try {
    const adapter = getMarketplaceAdapter(job.marketplace);
    const payload = job.payload ?? adapter.transform(listing);
    const connector = getMarketplaceConnector(job.marketplace);
    const result = await connector.publish(payload);

    current =
      (await listingJobRepository.transition(job.id, "published", {
        payload,
        externalId: result.externalId,
        listingUrl: result.listingUrl,
        error: undefined,
      })) ?? current;

    const refreshed =
      (await masterListingRepository.getById(listing.id)) ?? listing;

    await patchMarketplace(refreshed, job.marketplace, {
      publishStatus: MarketplacePublishStatus.PUBLISHED,
      externalId: result.externalId,
      listingId: result.externalId,
      listingUrl: result.listingUrl,
      lastPublishedAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
      validationScore: adapter.readiness(refreshed).score,
      issues: [],
    });

    const after = await masterListingRepository.getById(listing.id);
    if (after) {
      const enabled = after.marketplaces.filter((item) => item.enabled);
      const published = enabled.filter(
        (item) =>
          item.publishStatus === MarketplacePublishStatus.PUBLISHED,
      );

      if (published.length === enabled.length && enabled.length > 0) {
        await masterListingRepository.publish(listing.id);
      } else if (published.length > 0) {
        await masterListingRepository.update(listing.id, {
          status: ListingStatus.PARTIALLY_PUBLISHED,
        });
      }
    }

    return current;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Marketplace publish failed.";

    const failed =
      (await listingJobRepository.transition(job.id, "failed", {
        error: {
          code: "MARKETPLACE_PUBLISH_FAILED",
          message,
        },
      })) ?? current;

    const refreshed =
      (await masterListingRepository.getById(listing.id)) ?? listing;

    await patchMarketplace(refreshed, job.marketplace, {
      publishStatus: MarketplacePublishStatus.FAILED,
      issues: [
        {
          id: `publish.${job.marketplace}.failed`,
          severity: ValidationSeverity.ERROR,
          title: "Publish failed",
          description: message,
          marketplaces: [job.marketplace],
        },
      ],
    });

    return failed;
  }
}

class ListingEngineService {
  async validate(productId: string): Promise<ListingValidationResult> {
    const listing = await masterListingRepository.getById(productId);
    if (!listing) {
      throw new Error(`Product ${productId} was not found.`);
    }

    const result = validateListingPipeline(listing);
    const channelIssues = result.channels.flatMap((channel) => [
      ...channel.blockers,
      ...channel.warnings,
    ]);

    await masterListingRepository.replaceValidationIssues(productId, [
      ...result.masterIssues,
      ...channelIssues,
    ]);

    await masterListingRepository.update(productId, {
      marketplaces: listing.marketplaces.map((connection) => {
        const channel = result.channels.find(
          (item) => item.marketplace === connection.marketplace,
        );

        return {
          ...connection,
          validationScore: channel?.score ?? connection.validationScore,
          issues: [
            ...(channel?.blockers ?? []),
            ...(channel?.warnings ?? []),
          ],
          publishStatus:
            connection.enabled && (channel?.blockers.length ?? 0) === 0
              ? connection.publishStatus ===
                  MarketplacePublishStatus.PUBLISHED
                ? connection.publishStatus
                : MarketplacePublishStatus.READY
              : connection.publishStatus,
        };
      }),
    });

    if (result.valid) {
      await masterListingRepository.markReady(productId);
    }

    return result;
  }

  async publish(
    productId: string,
    marketplace?: MarketplaceName,
  ): Promise<{
    listing: MasterListing;
    jobs: ListingJob[];
    validation: ListingValidationResult;
  }> {
    const validation = await this.validate(productId);
    const listing = await masterListingRepository.getById(productId);

    if (!listing) {
      throw new Error(`Product ${productId} was not found.`);
    }

    if (
      validation.masterIssues.some(
        (issue) => issue.severity === ValidationSeverity.ERROR,
      )
    ) {
      throw new Error("Listing contains master validation errors.");
    }

    const targets = listing.marketplaces.filter((channel) => {
      if (!channel.enabled) {
        return false;
      }

      if (marketplace && channel.marketplace !== marketplace) {
        return false;
      }

      return true;
    });

    if (targets.length === 0) {
      throw new Error("No enabled publishing channels selected.");
    }

    for (const channel of targets) {
      const readiness = validation.channels.find(
        (item) => item.marketplace === channel.marketplace,
      );

      if (readiness && readiness.blockers.length > 0) {
        throw new Error(
          `${channel.marketplace} adapter validation failed.`,
        );
      }
    }

    const jobs: ListingJob[] = [];

    for (const channel of targets) {
      const adapter = getMarketplaceAdapter(channel.marketplace);
      const payload = adapter.transform(listing);

      await patchMarketplace(listing, channel.marketplace, {
        publishStatus: MarketplacePublishStatus.PUBLISHING,
        validationScore: adapter.readiness(listing).score,
      });

      const job = await listingJobRepository.create({
        type: "publish",
        status: "queued",
        organizationId: listing.organizationId,
        workspaceId: listing.workspaceId,
        productId: listing.id,
        marketplace: channel.marketplace,
        payload,
        maxAttempts: 3,
      });

      const processed = await processPublishJob(job);
      jobs.push(processed);
    }

    const after = await masterListingRepository.getById(productId);
    if (!after) {
      throw new Error(`Product ${productId} was not found.`);
    }

    return {
      listing: after,
      jobs,
      validation: await this.validate(productId).catch(() => validation),
    };
  }

  async retryJob(jobId: string): Promise<ListingJob> {
    const job = await listingJobRepository.getById(jobId);
    if (!job) {
      throw new Error(`Listing job ${jobId} was not found.`);
    }

    if (job.attempts >= job.maxAttempts) {
      throw new Error("Maximum retry attempts exceeded.");
    }

    assertTransition(job.status, "queued");
    const queued =
      (await listingJobRepository.transition(jobId, "queued", {
        error: undefined,
      })) ?? job;

    if (job.type === "publish") {
      return processPublishJob(queued);
    }

    return this.processSyncJob(queued);
  }

  async sync(
    productId: string,
    type: "sync_price" | "sync_inventory" | "sync_status",
    marketplace?: MarketplaceName,
  ): Promise<ListingJob[]> {
    const listing = await masterListingRepository.getById(productId);
    if (!listing) {
      throw new Error(`Product ${productId} was not found.`);
    }

    const targets = listing.marketplaces.filter((channel) => {
      if (!channel.enabled || !channel.externalId) {
        return false;
      }

      if (marketplace && channel.marketplace !== marketplace) {
        return false;
      }

      return (
        channel.publishStatus === MarketplacePublishStatus.PUBLISHED
      );
    });

    if (targets.length === 0) {
      throw new Error(
        "No published channels available for sync.",
      );
    }

    const jobs: ListingJob[] = [];

    for (const channel of targets) {
      const job = await listingJobRepository.create({
        type,
        status: "queued",
        organizationId: listing.organizationId,
        workspaceId: listing.workspaceId,
        productId: listing.id,
        marketplace: channel.marketplace,
        externalId: channel.externalId,
        maxAttempts: 3,
      });

      jobs.push(await this.processSyncJob(job));
    }

    return jobs;
  }

  private async processSyncJob(job: ListingJob): Promise<ListingJob> {
    assertTransition(job.status, "publishing");
    let current =
      (await listingJobRepository.transition(job.id, "publishing", {
        attempts: job.attempts + 1,
      })) ?? job;

    const listing = await masterListingRepository.getById(job.productId);
    if (!listing || !job.externalId) {
      return (
        (await listingJobRepository.transition(job.id, "failed", {
          error: {
            code: "SYNC_TARGET_MISSING",
            message: "Published marketplace target missing.",
          },
        })) ?? current
      );
    }

    try {
      const connector = getMarketplaceConnector(job.marketplace);
      const now = new Date().toISOString();

      if (job.type === "sync_price") {
        const result = await connector.syncPrice(
          job.externalId,
          listing.pricing.sellingPrice,
        );
        if (!result.ok) {
          throw new Error(result.message ?? "Price sync failed.");
        }
      } else if (job.type === "sync_inventory") {
        const result = await connector.syncInventory(
          job.externalId,
          listing.inventory.available,
        );
        if (!result.ok) {
          throw new Error(result.message ?? "Inventory sync failed.");
        }
      }

      current =
        (await listingJobRepository.transition(job.id, "published", {
          error: undefined,
        })) ?? current;

      await patchMarketplace(listing, job.marketplace, {
        publishStatus: MarketplacePublishStatus.PUBLISHED,
        lastSyncedAt: now,
      });

      return current;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Sync failed.";

      const failed =
        (await listingJobRepository.transition(job.id, "failed", {
          error: {
            code: "MARKETPLACE_SYNC_FAILED",
            message,
          },
        })) ?? current;

      await patchMarketplace(listing, job.marketplace, {
        publishStatus: MarketplacePublishStatus.FAILED,
      });

      return failed;
    }
  }

  async listIndex(
    organizationId: string,
    workspaceId: string,
  ): Promise<ListingIndexItem[]> {
    const listings = await masterListingRepository.getAll();
    const scoped = listings.filter(
      (listing) =>
        listing.organizationId === organizationId &&
        listing.workspaceId === workspaceId,
    );

    const rows: ListingIndexItem[] = [];

    for (const listing of scoped) {
      const jobs = await listingJobRepository.listByProduct(listing.id);
      const openErrorsByMarketplace = Object.fromEntries(
        listing.marketplaces.map((channel) => [
          channel.marketplace,
          jobs.filter(
            (job) =>
              job.marketplace === channel.marketplace &&
              job.status === "failed",
          ).length,
        ]),
      ) as Partial<
        Record<MasterListing["marketplaces"][number]["marketplace"], number>
      >;

      const statusCards = buildMarketplaceStatusCards(
        listing,
        openErrorsByMarketplace,
      );

      for (const card of statusCards) {
        const channel = listing.marketplaces.find(
          (item) => item.marketplace === card.marketplace,
        );

        rows.push({
          id: `${listing.id}:${card.marketplace}`,
          productId: listing.id,
          marketplace: card.marketplace,
          title: listing.identity.productName,
          sku: listing.identity.sku,
          publishStatus: card.publishStatus,
          operationalStatus: card.operationalStatus,
          health: card.health,
          visibility: card.visibility,
          validationScore: card.readinessScore,
          stock: card.stock,
          externalId: card.platformId,
          listingUrl: channel?.listingUrl,
          lastSyncedAt: card.lastSyncAt,
          enabled: card.enabled,
          openErrors: card.openErrors,
        });
      }
    }

    return rows;
  }

  async getListingRecord(listingKey: string) {
    const [productId, marketplace] = listingKey.split(":");
    if (!productId || !marketplace) {
      return null;
    }

    const listing = await masterListingRepository.getById(productId);
    if (!listing) {
      return null;
    }

    const channel = listing.marketplaces.find(
      (item) => item.marketplace === marketplace,
    );

    if (!channel) {
      return null;
    }

    const jobs = await listingJobRepository.listByProduct(productId);
    const snapshots = await getMonitoringSnapshots(listing);
    const status = await this.statusTracking(productId);

    return {
      id: listingKey,
      product: listing,
      channel,
      jobs: jobs.filter((job) => job.marketplace === marketplace),
      monitor:
        snapshots.find((item) => item.marketplace === marketplace) ??
        null,
      status:
        status.find((item) => item.marketplace === marketplace) ?? null,
      readinessScore: computePublishingReadinessScore(listing),
    };
  }

  async listErrors() {
    return listingJobRepository.listErrors();
  }

  async monitor(productId: string) {
    const listing = await masterListingRepository.getById(productId);
    if (!listing) {
      throw new Error(`Product ${productId} was not found.`);
    }

    return getMonitoringSnapshots(listing);
  }

  /** Flowchart Step 7 — Marketplace Status Tracking */
  async statusTracking(
    productId: string,
  ): Promise<MarketplaceStatusCard[]> {
    const listing = await masterListingRepository.getById(productId);
    if (!listing) {
      throw new Error(`Product ${productId} was not found.`);
    }

    const jobs = await listingJobRepository.listByProduct(productId);
    const openErrorsByMarketplace = Object.fromEntries(
      listing.marketplaces.map((channel) => [
        channel.marketplace,
        jobs.filter(
          (job) =>
            job.marketplace === channel.marketplace &&
            job.status === "failed",
        ).length,
      ]),
    ) as Partial<
      Record<MasterListing["marketplaces"][number]["marketplace"], number>
    >;

    return buildMarketplaceStatusCards(listing, openErrorsByMarketplace);
  }
}

export const listingEngine = new ListingEngineService();
