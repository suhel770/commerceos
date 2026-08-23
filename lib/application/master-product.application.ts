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
import {
  masterListingRepository,
} from "@/lib/repositories/masterListing.repository";
import { listingEngine } from "@/lib/listing-engine";
import masterListingService from "@/lib/services/masterListing.service";
import type {
  MarketplaceName,
  MasterListing,
} from "@/lib/types/master-listing";

export class MasterProductNotFoundError extends Error {
  readonly code = "NOT_FOUND";

  constructor(id: string) {
    super(
      `Master product ${id} was not found.`,
    );
    this.name =
      "MasterProductNotFoundError";
  }
}

async function requireListing(
  context: CommerceContext,
  id: string,
) {
  const listing =
    await masterListingRepository.getById(
      id,
    );

  if (
    !listing ||
    listing.organizationId !==
      context.organizationId
  ) {
    throw new MasterProductNotFoundError(
      id,
    );
  }

  assertWorkspaceAccess(
    context,
    listing.workspaceId,
  );

  return listing;
}

class MasterProductApplicationService {
  async create(
    context: CommerceContext,
    body: any,
  ) {
    authorize(
      context,
      "products.edit",
    );

    const product = await masterListingRepository.create({
      ...body,
      id: body.id || `prod-${Date.now()}`,
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      revision: 1,
    });

    return product;
  }

  async list(
    context: CommerceContext,
  ) {
    authorize(
      context,
      "products.view",
    );

    const listings =
      await masterListingRepository.getAll();

    return listings.filter(
      (listing) =>
        listing.organizationId ===
          context.organizationId &&
        listing.workspaceId ===
          context.workspaceId,
    );
  }

  async get(
    context: CommerceContext,
    id: string,
  ) {
    authorize(
      context,
      "products.view",
    );

    return requireListing(
      context,
      id,
    );
  }

  async update(
    context: CommerceContext,
    id: string,
    updates: Partial<MasterListing>,
    expectedRevision: number,
  ) {
    authorize(
      context,
      "products.edit",
    );

    const before =
      await requireListing(
        context,
        id,
      );

    const after =
      await masterListingRepository.updateWithRevision(
        id,
        updates,
        expectedRevision,
      );

    if (!after) {
      throw new MasterProductNotFoundError(
        id,
      );
    }

    await auditRepository.append(
      createAuditEvent({
        context,
        entityId: id,
        action: "product.updated",
        before,
        after,
      }),
    );

    await domainEvents.publish({
      id: crypto.randomUUID(),
      type: "ProductUpdated",
      organizationId:
        context.organizationId,
      workspaceId:
        context.workspaceId,
      productId: id,
      occurredAt:
        new Date().toISOString(),
      payload: {
        revision: after.revision,
      },
    });

    return after;
  }

  async validate(
    context: CommerceContext,
    id: string,
  ) {
    authorize(
      context,
      "products.view",
    );
    await requireListing(
      context,
      id,
    );

    await requireListing(context, id);

    const pipeline =
      await listingEngine.validate(id);

    const result = {
      valid: pipeline.valid,
      score: pipeline.masterScore,
      issues: [
        ...pipeline.masterIssues,
        ...pipeline.channels.flatMap(
          (channel) => [
            ...channel.blockers,
            ...channel.warnings,
          ],
        ),
      ],
      channels: pipeline.channels,
    };

    await auditRepository.append(
      createAuditEvent({
        context,
        entityId: id,
        action: "product.validated",
        metadata: {
          valid: result.valid,
          issueCount: result.issues.length,
          score: result.score,
        },
      }),
    );

    return result;
  }

  async publish(
    context: CommerceContext,
    id: string,
    marketplace?: MarketplaceName,
  ) {
    authorize(
      context,
      "products.publish",
    );

    const before =
      await requireListing(
        context,
        id,
      );

    // Façade: products publish delegates to listing engine pipeline.
    const published =
      await masterListingService.publish(
        id,
        marketplace,
      );

    if (!published) {
      throw new MasterProductNotFoundError(
        id,
      );
    }

    await auditRepository.append(
      createAuditEvent({
        context,
        entityId: id,
        action: "product.published",
        before,
        after: published,
        metadata: {
          marketplace:
            marketplace ?? "all",
        },
      }),
    );

    await domainEvents.publish({
      id: crypto.randomUUID(),
      type: "ListingPublished",
      organizationId:
        context.organizationId,
      workspaceId:
        context.workspaceId,
      productId: id,
      occurredAt:
        new Date().toISOString(),
      payload: {
        marketplace:
          marketplace ?? "all",
      },
    });

    return published;
  }
}

export const masterProductApplication =
  new MasterProductApplicationService();
