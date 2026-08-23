import { listingEngine } from "@/lib/listing-engine";
import {
  assertWorkspaceAccess,
  authorize,
} from "@/lib/platform/authorization";
import {
  auditRepository,
  createAuditEvent,
} from "@/lib/platform/audit";
import type { CommerceContext } from "@/lib/platform/commerce-context";
import { domainEvents } from "@/lib/platform/events";
import { masterListingRepository } from "@/lib/repositories/masterListing.repository";
import type { MarketplaceName } from "@/lib/types/master-listing";
import { MasterProductNotFoundError } from "@/lib/application/master-product.application";

async function requireProduct(
  context: CommerceContext,
  productId: string,
) {
  const listing =
    await masterListingRepository.getById(productId);

  if (
    !listing ||
    listing.organizationId !== context.organizationId
  ) {
    throw new MasterProductNotFoundError(productId);
  }

  assertWorkspaceAccess(context, listing.workspaceId);
  return listing;
}

class ListingApplicationService {
  async list(context: CommerceContext) {
    authorize(context, "products.view");

    return listingEngine.listIndex(
      context.organizationId,
      context.workspaceId,
    );
  }

  async get(context: CommerceContext, listingKey: string) {
    authorize(context, "products.view");

    const record = await listingEngine.getListingRecord(listingKey);
    if (!record) {
      throw new MasterProductNotFoundError(listingKey);
    }

    assertWorkspaceAccess(
      context,
      record.product.workspaceId,
    );

    return record;
  }

  async validate(context: CommerceContext, productId: string) {
    authorize(context, "products.view");
    await requireProduct(context, productId);

    const result = await listingEngine.validate(productId);

    await auditRepository.append(
      createAuditEvent({
        context,
        entityId: productId,
        action: "listing.validated",
        metadata: {
          valid: result.valid,
          masterScore: result.masterScore,
          channelCount: result.channels.length,
        },
      }),
    );

    return result;
  }

  async publish(
    context: CommerceContext,
    productId: string,
    marketplace?: MarketplaceName,
  ) {
    authorize(context, "products.publish");
    await requireProduct(context, productId);

    const result = await listingEngine.publish(
      productId,
      marketplace,
    );

    await auditRepository.append(
      createAuditEvent({
        context,
        entityId: productId,
        action: "listing.published",
        after: result.listing,
        metadata: {
          marketplace: marketplace ?? "all",
          jobs: result.jobs.map((job) => ({
            id: job.id,
            marketplace: job.marketplace,
            status: job.status,
            externalId: job.externalId,
          })),
        },
      }),
    );

    await domainEvents.publish({
      id: crypto.randomUUID(),
      type: "ListingPublished",
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId,
      occurredAt: new Date().toISOString(),
      payload: {
        marketplace: marketplace ?? "all",
        jobIds: result.jobs.map((job) => job.id),
      },
    });

    return result;
  }

  async sync(
    context: CommerceContext,
    productId: string,
    type: "sync_price" | "sync_inventory" | "sync_status",
    marketplace?: MarketplaceName,
  ) {
    authorize(context, "products.edit");
    await requireProduct(context, productId);

    const jobs = await listingEngine.sync(
      productId,
      type,
      marketplace,
    );

    await auditRepository.append(
      createAuditEvent({
        context,
        entityId: productId,
        action: "listing.synced",
        metadata: {
          type,
          marketplace: marketplace ?? "all",
          jobs: jobs.map((job) => ({
            id: job.id,
            status: job.status,
          })),
        },
      }),
    );

    return jobs;
  }

  async errors(context: CommerceContext) {
    authorize(context, "products.view");

    const jobs = await listingEngine.listErrors();
    return jobs.filter(
      (job) =>
        job.organizationId === context.organizationId &&
        job.workspaceId === context.workspaceId,
    );
  }

  async retry(context: CommerceContext, jobId: string) {
    authorize(context, "products.publish");

    const errors = await this.errors(context);
    const owned = errors.find((job) => job.id === jobId);
    if (!owned) {
      // Allow retry of jobs still associated to workspace even if not failed list race
      const all = await listingEngine.listErrors();
      const match = all.find((job) => job.id === jobId);
      if (
        !match ||
        match.organizationId !== context.organizationId
      ) {
        throw new MasterProductNotFoundError(jobId);
      }
    }

    return listingEngine.retryJob(jobId);
  }

  async monitor(context: CommerceContext, productId: string) {
    authorize(context, "products.view");
    await requireProduct(context, productId);
    return listingEngine.monitor(productId);
  }

  async statusTracking(context: CommerceContext, productId: string) {
    authorize(context, "products.view");
    await requireProduct(context, productId);
    return listingEngine.statusTracking(productId);
  }
}

export const listingApplication = new ListingApplicationService();
