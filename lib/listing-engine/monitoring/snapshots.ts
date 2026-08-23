import type { MasterListing } from "@/lib/types/master-listing";

import { listingJobRepository } from "../queue/job-repository";
import { computeChannelReadiness } from "../readiness/compute-readiness";
import {
  buildMarketplaceStatusCards,
} from "../status/marketplace-status";
import type { ListingMonitorSnapshot } from "../types";

export async function getMonitoringSnapshots(
  listing: MasterListing,
): Promise<ListingMonitorSnapshot[]> {
  const jobs = await listingJobRepository.listByProduct(listing.id);
  const channels = computeChannelReadiness(listing);

  const openErrorsByMarketplace = Object.fromEntries(
    channels.map((channel) => {
      const openErrors = jobs.filter(
        (job) =>
          job.marketplace === channel.marketplace &&
          job.status === "failed",
      ).length;

      return [channel.marketplace, openErrors];
    }),
  ) as Partial<Record<MasterListing["marketplaces"][number]["marketplace"], number>>;

  const statusCards = buildMarketplaceStatusCards(
    listing,
    openErrorsByMarketplace,
  );

  return statusCards.map((card) => {
    const channel = channels.find(
      (item) => item.marketplace === card.marketplace,
    );
    const channelJobs = jobs.filter(
      (job) => job.marketplace === card.marketplace,
    );
    const latestSync = channelJobs.find(
      (job) =>
        job.type.startsWith("sync_") &&
        (job.status === "published" || job.status === "failed"),
    );
    const inventorySyncOk = !channelJobs.some(
      (job) =>
        job.type === "sync_inventory" && job.status === "failed",
    );
    const priceSyncOk = !channelJobs.some(
      (job) => job.type === "sync_price" && job.status === "failed",
    );
    const contentSyncOk =
      card.operationalStatus === "active" ||
      card.operationalStatus === "partial_active";

    return {
      productId: listing.id,
      marketplace: card.marketplace,
      healthScore: channel?.score ?? card.readinessScore,
      publishStatus: card.publishStatus,
      operationalStatus: card.operationalStatus,
      health: card.health,
      visibility: card.visibility,
      platformId: card.platformId,
      stock: card.stock,
      lastSyncAt:
        latestSync?.completedAt ??
        card.lastSyncAt,
      lastPublishedAt: channel?.lastPublishedAt,
      openErrors: card.openErrors,
      inventorySyncOk,
      priceSyncOk,
      contentSyncOk,
      suppressed:
        card.openErrors > 0 && card.readinessScore < 50,
      policyWatch:
        card.operationalStatus === "error" ||
        card.readinessScore < 70,
      buyBoxRisk:
        card.visibility === "low" &&
        card.operationalStatus === "active",
    };
  });
}
