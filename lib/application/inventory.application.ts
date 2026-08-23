import { listingEngine } from "@/lib/listing-engine";
import { InventoryEngineError } from "@/lib/inventory/engine";
import { inventoryService, InventoryNotFoundError } from "@/lib/inventory/service";
import {
  buildHealthBundle,
  buildInsightsBundle,
  buildPlanningBundle,
  buildPurchaseSuggestion,
  purchaseSuggestionStore,
} from "@/lib/inventory/planning";
import { DEFAULT_WAREHOUSE_ID } from "@/lib/inventory/types";
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

async function pushAvailableToListings(
  context: CommerceContext,
  productId: string,
) {
  const available = await inventoryService.totalAvailable(
    context.organizationId,
    context.workspaceId,
    productId,
  );

  const listing = await masterListingRepository.getById(productId);
  if (!listing || listing.organizationId !== context.organizationId) {
    return { synced: false as const, available, jobs: [] as const };
  }

  assertWorkspaceAccess(context, listing.workspaceId);
  await masterListingRepository.updateInventory(productId, available);

  try {
    const jobs = await listingEngine.sync(productId, "sync_inventory");
    return { synced: true as const, available, jobs };
  } catch {
    // Sync is best-effort: core stock remains source of truth.
    return { synced: false as const, available, jobs: [] as const };
  }
}

class InventoryApplicationService {
  async list(context: CommerceContext, productId?: string) {
    authorize(context, "inventory.view");
    assertWorkspaceAccess(context, context.workspaceId);

    const balances = await inventoryService.listBalances({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId,
    });

    const movements = await inventoryService.listMovements({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId,
      limit: 30,
    });

    return { balances, movements };
  }

  async get(context: CommerceContext, productId: string) {
    authorize(context, "inventory.view");
    assertWorkspaceAccess(context, context.workspaceId);

    return inventoryService.getProductSnapshot(
      context.organizationId,
      context.workspaceId,
      productId,
    );
  }

  async adjust(
    context: CommerceContext,
    input: {
      productId: string;
      warehouseId?: string;
      delta: number;
      bucket?: "available" | "reserved" | "incoming" | "damaged" | "inTransit";
      reason: string;
    },
  ) {
    authorize(context, "inventory.adjust");
    assertWorkspaceAccess(context, context.workspaceId);

    const result = await inventoryService.adjust({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId: input.productId,
      warehouseId: input.warehouseId,
      delta: input.delta,
      bucket: input.bucket,
      reason: input.reason,
      actorId: context.actor.id,
    });

    const sync =
      !input.bucket || input.bucket === "available"
        ? await pushAvailableToListings(context, input.productId)
        : { synced: false as const, available: result.balance.available, jobs: [] as const };

    await auditRepository.append(
      createAuditEvent({
        context,
        entityId: input.productId,
        action: "inventory.adjusted",
        before: result.movement.bucketsBefore,
        after: result.movement.bucketsAfter,
        metadata: {
          warehouseId: result.balance.warehouseId,
          delta: input.delta,
          bucket: input.bucket ?? "available",
          reason: input.reason,
          movementId: result.movement.id,
          marketplaceSync: sync.synced,
        },
      }),
    );

    await domainEvents.publish({
      id: crypto.randomUUID(),
      type: "InventoryAdjusted",
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId: input.productId,
      occurredAt: new Date().toISOString(),
      payload: {
        delta: input.delta,
        warehouseId: result.balance.warehouseId,
        available: sync.available,
      },
    });

    return { ...result, sync };
  }

  async quarantine(
    context: CommerceContext,
    input: {
      productId: string;
      warehouseId?: string;
      quantity: number;
      reason?: string;
    },
  ) {
    authorize(context, "inventory.adjust");
    assertWorkspaceAccess(context, context.workspaceId);

    const result = await inventoryService.quarantine({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId: input.productId,
      warehouseId: input.warehouseId,
      quantity: input.quantity,
      reason: input.reason,
      actorId: context.actor.id,
    });

    const sync = await pushAvailableToListings(context, input.productId);
    return { ...result, sync };
  }

  async unquarantine(
    context: CommerceContext,
    input: {
      productId: string;
      warehouseId?: string;
      quantity: number;
      reason?: string;
    },
  ) {
    authorize(context, "inventory.adjust");
    assertWorkspaceAccess(context, context.workspaceId);

    const result = await inventoryService.unquarantine({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId: input.productId,
      warehouseId: input.warehouseId,
      quantity: input.quantity,
      reason: input.reason,
      actorId: context.actor.id,
    });

    const sync = await pushAvailableToListings(context, input.productId);
    return { ...result, sync };
  }

  async reserve(
    context: CommerceContext,
    input: {
      productId: string;
      warehouseId?: string;
      quantity: number;
      reference?: string;
      expiresAt?: string;
    },
  ) {
    authorize(context, "inventory.reserve");
    assertWorkspaceAccess(context, context.workspaceId);

    const result = await inventoryService.reserve({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId: input.productId,
      warehouseId: input.warehouseId ?? DEFAULT_WAREHOUSE_ID,
      quantity: input.quantity,
      reference: input.reference,
      expiresAt: input.expiresAt,
      actorId: context.actor.id,
    });

    const sync = await pushAvailableToListings(context, input.productId);

    await auditRepository.append(
      createAuditEvent({
        context,
        entityId: input.productId,
        action: "inventory.reserved",
        before: result.movement.bucketsBefore,
        after: result.movement.bucketsAfter,
        metadata: {
          reservationId: result.reservation.id,
          quantity: input.quantity,
          reference: input.reference,
          marketplaceSync: sync.synced,
        },
      }),
    );

    await domainEvents.publish({
      id: crypto.randomUUID(),
      type: "InventoryReserved",
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId: input.productId,
      occurredAt: new Date().toISOString(),
      payload: {
        reservationId: result.reservation.id,
        quantity: input.quantity,
      },
    });

    return { ...result, sync };
  }

  async release(
    context: CommerceContext,
    input: {
      reservationId: string;
      expired?: boolean;
    },
  ) {
    authorize(context, "inventory.reserve");
    assertWorkspaceAccess(context, context.workspaceId);

    const result = await inventoryService.releaseReservation({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      reservationId: input.reservationId,
      expired: input.expired,
      actorId: context.actor.id,
    });

    const sync = await pushAvailableToListings(
      context,
      result.reservation.productId,
    );

    await auditRepository.append(
      createAuditEvent({
        context,
        entityId: result.reservation.productId,
        action: "inventory.released",
        before: result.movement.bucketsBefore,
        after: result.movement.bucketsAfter,
        metadata: {
          reservationId: result.reservation.id,
          expired: Boolean(input.expired),
          marketplaceSync: sync.synced,
        },
      }),
    );

    await domainEvents.publish({
      id: crypto.randomUUID(),
      type: "InventoryReleased",
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId: result.reservation.productId,
      occurredAt: new Date().toISOString(),
      payload: {
        reservationId: result.reservation.id,
        expired: Boolean(input.expired),
      },
    });

    return { ...result, sync };
  }

  async transfer(
    context: CommerceContext,
    input: {
      productId: string;
      fromWarehouseId: string;
      toWarehouseId: string;
      quantity: number;
      reason?: string;
    },
  ) {
    authorize(context, "inventory.transfer");
    assertWorkspaceAccess(context, context.workspaceId);

    const result = await inventoryService.transfer({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId: input.productId,
      fromWarehouseId: input.fromWarehouseId,
      toWarehouseId: input.toWarehouseId,
      quantity: input.quantity,
      reason: input.reason,
      actorId: context.actor.id,
    });

    const sync = await pushAvailableToListings(context, input.productId);

    await auditRepository.append(
      createAuditEvent({
        context,
        entityId: input.productId,
        action: "inventory.transferred",
        before: result.movement.bucketsBefore,
        after: result.movement.bucketsAfter,
        metadata: {
          fromWarehouseId: input.fromWarehouseId,
          toWarehouseId: input.toWarehouseId,
          quantity: input.quantity,
          movementId: result.movement.id,
          marketplaceSync: sync.synced,
        },
      }),
    );

    await domainEvents.publish({
      id: crypto.randomUUID(),
      type: "InventoryTransferred",
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId: input.productId,
      occurredAt: new Date().toISOString(),
      payload: {
        fromWarehouseId: input.fromWarehouseId,
        toWarehouseId: input.toWarehouseId,
        quantity: input.quantity,
      },
    });

    return { ...result, sync };
  }

  async planning(context: CommerceContext, productId?: string) {
    authorize(context, "inventory.view");
    assertWorkspaceAccess(context, context.workspaceId);

    const bundle = await buildPlanningBundle({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId,
    });

    return {
      plans: bundle.plans,
      suggestions: bundle.suggestions,
      savedSuggestions: bundle.savedSuggestions,
      allocationHints: bundle.allocationHints,
    };
  }

  async health(context: CommerceContext, productId?: string) {
    authorize(context, "inventory.view");
    assertWorkspaceAccess(context, context.workspaceId);

    return buildHealthBundle({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId,
    });
  }

  async insights(context: CommerceContext) {
    authorize(context, "inventory.view");
    assertWorkspaceAccess(context, context.workspaceId);

    return buildInsightsBundle({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
    });
  }

  async allocate(
    context: CommerceContext,
    input: {
      productId: string;
      reservationId?: string;
      warehouseId?: string;
      quantity: number;
      orderId: string;
    },
  ) {
    authorize(context, "inventory.reserve");
    assertWorkspaceAccess(context, context.workspaceId);

    const result = await inventoryService.allocate({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId: input.productId,
      reservationId: input.reservationId,
      warehouseId: input.warehouseId,
      quantity: input.quantity,
      orderId: input.orderId,
      actorId: context.actor.id,
      actorName: context.actor.id || "Operator",
    });

    const sync = await pushAvailableToListings(context, input.productId);
    return { ...result, sync };
  }

  async fulfill(
    context: CommerceContext,
    input: {
      productId: string;
      warehouseId?: string;
      quantity: number;
      orderId: string;
    },
  ) {
    authorize(context, "inventory.adjust");
    assertWorkspaceAccess(context, context.workspaceId);

    const result = await inventoryService.fulfillOrder({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId: input.productId,
      warehouseId: input.warehouseId,
      quantity: input.quantity,
      orderId: input.orderId,
      actorId: context.actor.id,
      actorName: context.actor.id || "Operator",
    });

    const sync = await pushAvailableToListings(context, input.productId);
    return { ...result, sync };
  }

  async consume(
    context: CommerceContext,
    input: {
      productId: string;
      warehouseId?: string;
      quantity: number;
      reason: string;
      reference?: string;
    },
  ) {
    authorize(context, "inventory.adjust");
    assertWorkspaceAccess(context, context.workspaceId);

    const result = await inventoryService.consume({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId: input.productId,
      warehouseId: input.warehouseId,
      quantity: input.quantity,
      reason: input.reason,
      reference: input.reference,
      actorId: context.actor.id,
      actorName: context.actor.id || "Operator",
    });

    const sync = await pushAvailableToListings(context, input.productId);
    return { ...result, sync };
  }

  async scrap(
    context: CommerceContext,
    input: {
      productId: string;
      warehouseId?: string;
      quantity: number;
      reason: string;
      sourceBillId?: string;
    },
  ) {
    authorize(context, "inventory.adjust");
    assertWorkspaceAccess(context, context.workspaceId);

    const result = await inventoryService.scrapDamaged({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId: input.productId,
      warehouseId: input.warehouseId,
      quantity: input.quantity,
      reason: input.reason,
      sourceBillId: input.sourceBillId,
      actorId: context.actor.id,
      actorName: context.actor.id || "Operator",
    });

    return result;
  }

  async reconcile(context: CommerceContext) {
    authorize(context, "inventory.view");
    assertWorkspaceAccess(context, context.workspaceId);

    return inventoryService.reconcile(
      context.organizationId,
      context.workspaceId,
    );
  }

  async channelAllocations(
    context: CommerceContext,
    productId: string,
    mode: "small" | "growing" | "enterprise" = "small",
  ) {
    authorize(context, "inventory.view");
    assertWorkspaceAccess(context, context.workspaceId);

    return inventoryService.getChannelAllocations(
      context.organizationId,
      context.workspaceId,
      productId,
      mode,
    );
  }

  async savePurchaseSuggestion(
    context: CommerceContext,
    productId: string,
  ) {
    authorize(context, "inventory.adjust");
    assertWorkspaceAccess(context, context.workspaceId);

    const { plans } = await buildPlanningBundle({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId,
    });
    const plan = plans.find((row) => row.productId === productId);
    if (!plan) {
      throw new InventoryNotFoundError(productId, DEFAULT_WAREHOUSE_ID);
    }

    const draft = buildPurchaseSuggestion(plan);
    if (!draft) {
      throw new InventoryEngineError(
        "NO_PURCHASE_NEEDED",
        `No purchase quantity suggested for ${productId}.`,
      );
    }

    const saved = await purchaseSuggestionStore.save(draft);

    await auditRepository.append(
      createAuditEvent({
        context,
        entityId: productId,
        action: "inventory.po_suggested",
        metadata: {
          suggestionId: saved.id,
          quantity: saved.quantity,
          supplierName: saved.supplierName,
        },
      }),
    );

    return saved;
  }
}

export const inventoryApplication = new InventoryApplicationService();

export {
  InventoryEngineError,
  InventoryNotFoundError,
};
