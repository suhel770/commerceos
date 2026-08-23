import { db } from "@/lib/db";
import {
  applyAdjustment,
  applyAllocate,
  applyConsume,
  applyDamage,
  applyDeallocate,
  applyFulfillAllocation,
  applyInbound,
  applyOutbound,
  applyQuarantine,
  applyRelease,
  applyReserve,
  applyScrap,
  applyTransferIn,
  applyTransferOut,
  applyUnquarantine,
  calculateATS,
  InventoryEngineError,
} from "./engine";
import { channelAllocationEngine } from "./channel-allocation.engine";
import { inventoryReconciliationEngine } from "./reconciliation-engine";
import { inventoryRepository } from "./repository";
import type {
  AvailableToSellDetails,
  ChannelAllocationResult,
  ReconciliationReport,
  Reservation,
  SellerComplexityMode,
  StockBalance,
  StockBuckets,
  StockMovement,
  StockMovementType,
} from "./types";
import {
  DEFAULT_WAREHOUSE_ID,
  emptyBuckets,
  pickBuckets,
} from "./types";

export class InventoryNotFoundError extends Error {
  readonly code = "INVENTORY_NOT_FOUND";

  constructor(productId: string, warehouseId: string) {
    super(
      `Inventory for product ${productId} at warehouse ${warehouseId} was not found.`,
    );
    this.name = "InventoryNotFoundError";
  }
}

function movementRecord(input: {
  organizationId: string;
  workspaceId: string;
  productId: string;
  sku?: string;
  warehouseId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  reference?: string;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  bucketsBefore: StockBuckets;
  bucketsAfter: StockBuckets;
  actorId?: string;
  actorName?: string;
  metadata?: Record<string, unknown>;
  intent?: string;
}): StockMovement {
  return {
    id: crypto.randomUUID(),
    organizationId: input.organizationId,
    workspaceId: input.workspaceId,
    productId: input.productId,
    sku: input.sku,
    warehouseId: input.warehouseId,
    type: input.type,
    quantity: input.quantity,
    reason: input.reason,
    reference: input.reference,
    fromWarehouseId: input.fromWarehouseId,
    toWarehouseId: input.toWarehouseId,
    bucketsBefore: input.bucketsBefore,
    bucketsAfter: input.bucketsAfter,
    createdAt: new Date().toISOString(),
    actorId: input.actorId,
    actorName: input.actorName,
    metadata: input.metadata,
    intent: input.intent,
  };
}

async function requireBalance(
  productId: string,
  warehouseId: string,
): Promise<StockBalance> {
  const balance = await inventoryRepository.getBalance(
    productId,
    warehouseId,
  );
  if (!balance) {
    throw new InventoryNotFoundError(productId, warehouseId);
  }
  return balance;
}

export class InventoryService {
  listBalances(filter: {
    organizationId: string;
    workspaceId: string;
    productId?: string;
    warehouseId?: string;
  }) {
    return inventoryRepository.listBalances(filter);
  }

  async getBalance(productId: string, warehouseId: string = DEFAULT_WAREHOUSE_ID) {
    return inventoryRepository.getBalance(productId, warehouseId);
  }

  listMovements(filter: {
    organizationId: string;
    workspaceId: string;
    productId?: string;
    limit?: number;
  }) {
    return inventoryRepository.listMovements(filter);
  }

  listReservations(filter: {
    organizationId: string;
    workspaceId: string;
    productId?: string;
    status?: Reservation["status"];
  }) {
    return inventoryRepository.listReservations(filter);
  }

  async getProductSnapshot(
    organizationId: string,
    workspaceId: string,
    productId: string,
  ) {
    const balances = await inventoryRepository.listBalances({
      organizationId,
      workspaceId,
      productId,
    });

    if (balances.length === 0) {
      throw new InventoryNotFoundError(productId, DEFAULT_WAREHOUSE_ID);
    }

    const totals = balances.reduce(
      (acc, balance) => {
        acc.available += balance.available ?? 0;
        acc.reserved += balance.reserved ?? 0;
        acc.allocated = (acc.allocated ?? 0) + (balance.allocated ?? 0);
        acc.incoming += balance.incoming ?? 0;
        acc.damaged += balance.damaged ?? 0;
        acc.inTransit += balance.inTransit ?? 0;
        acc.consumed = (acc.consumed ?? 0) + (balance.consumed ?? 0);
        acc.scrapped = (acc.scrapped ?? 0) + (balance.scrapped ?? 0);
        return acc;
      },
      emptyBuckets(),
    );

    const primaryBalance = balances[0]!;
    const atsDetails = calculateATS(primaryBalance);

    const [movements, reservations] = await Promise.all([
      inventoryRepository.listMovements({
        organizationId,
        workspaceId,
        productId,
        limit: 30,
      }),
      inventoryRepository.listReservations({
        organizationId,
        workspaceId,
        productId,
      }),
    ]);

    return {
      productId,
      sku: primaryBalance.sku ?? "",
      productName: primaryBalance.productName ?? "",
      totals,
      atsDetails,
      balances,
      movements,
      reservations,
    };
  }

  /**
   * Authoritative Available-to-Sell
   */
  async getATS(
    organizationId: string,
    workspaceId: string,
    productId: string,
    warehouseId: string = DEFAULT_WAREHOUSE_ID,
  ): Promise<AvailableToSellDetails> {
    const balance = await requireBalance(productId, warehouseId);
    return calculateATS(balance);
  }

  async adjust(input: {
    organizationId: string;
    workspaceId: string;
    productId: string;
    warehouseId?: string;
    delta: number;
    bucket?: keyof StockBuckets;
    reason: string;
    actorId?: string;
    actorName?: string;
  }) {
    const warehouseId = input.warehouseId ?? DEFAULT_WAREHOUSE_ID;
    const balance = await requireBalance(input.productId, warehouseId);
    const result = applyAdjustment(
      balance,
      input.delta,
      input.bucket ?? "available",
    );
    const saved = await inventoryRepository.saveBalance(result.balance);
    const movement = await inventoryRepository.appendMovement(
      movementRecord({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        productId: input.productId,
        sku: balance.sku,
        warehouseId,
        type: "Adjustment",
        quantity: input.delta,
        reason: input.reason,
        bucketsBefore: result.bucketsBefore,
        bucketsAfter: result.bucketsAfter,
        actorId: input.actorId,
        actorName: input.actorName,
        intent: balance.intent,
      }),
    );

    return { balance: saved, movement };
  }

  async inbound(input: {
    organizationId: string;
    workspaceId: string;
    productId: string;
    warehouseId?: string;
    quantity: number;
    reason?: string;
    reference?: string;
    actorId?: string;
    actorName?: string;
  }) {
    const warehouseId = input.warehouseId ?? DEFAULT_WAREHOUSE_ID;
    const balance = await requireBalance(input.productId, warehouseId);
    const result = applyInbound(balance, input.quantity);
    const saved = await inventoryRepository.saveBalance(result.balance);
    const movement = await inventoryRepository.appendMovement(
      movementRecord({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        productId: input.productId,
        sku: balance.sku,
        warehouseId,
        type: "Inbound",
        quantity: input.quantity,
        reason: input.reason ?? "Physical storage putaway receipt",
        reference: input.reference,
        bucketsBefore: result.bucketsBefore,
        bucketsAfter: result.bucketsAfter,
        actorId: input.actorId,
        actorName: input.actorName,
        intent: balance.intent,
      }),
    );
    return { balance: saved, movement };
  }

  async outbound(input: {
    organizationId: string;
    workspaceId: string;
    productId: string;
    warehouseId?: string;
    quantity: number;
    reason?: string;
    reference?: string;
    actorId?: string;
    actorName?: string;
  }) {
    const warehouseId = input.warehouseId ?? DEFAULT_WAREHOUSE_ID;
    const balance = await requireBalance(input.productId, warehouseId);
    const result = applyOutbound(balance, input.quantity);
    const saved = await inventoryRepository.saveBalance(result.balance);
    const movement = await inventoryRepository.appendMovement(
      movementRecord({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        productId: input.productId,
        sku: balance.sku,
        warehouseId,
        type: "Outbound",
        quantity: -input.quantity,
        reason: input.reason,
        reference: input.reference,
        bucketsBefore: result.bucketsBefore,
        bucketsAfter: result.bucketsAfter,
        actorId: input.actorId,
        actorName: input.actorName,
        intent: balance.intent,
      }),
    );
    return { balance: saved, movement };
  }

  async damage(input: {
    organizationId: string;
    workspaceId: string;
    productId: string;
    warehouseId?: string;
    quantity: number;
    reason?: string;
    actorId?: string;
    actorName?: string;
  }) {
    const warehouseId = input.warehouseId ?? DEFAULT_WAREHOUSE_ID;
    const balance = await requireBalance(input.productId, warehouseId);
    const result = applyDamage(balance, input.quantity);
    const saved = await inventoryRepository.saveBalance(result.balance);
    const movement = await inventoryRepository.appendMovement(
      movementRecord({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        productId: input.productId,
        sku: balance.sku,
        warehouseId,
        type: "Damage",
        quantity: -input.quantity,
        reason: input.reason,
        bucketsBefore: result.bucketsBefore,
        bucketsAfter: result.bucketsAfter,
        actorId: input.actorId,
        actorName: input.actorName,
        intent: balance.intent,
      }),
    );
    return { balance: saved, movement };
  }

  async quarantine(input: {
    organizationId: string;
    workspaceId: string;
    productId: string;
    warehouseId?: string;
    quantity: number;
    reason?: string;
    actorId?: string;
  }) {
    const warehouseId = input.warehouseId ?? DEFAULT_WAREHOUSE_ID;
    const balance = await requireBalance(input.productId, warehouseId);
    const result = applyQuarantine(balance, input.quantity);
    const saved = await inventoryRepository.saveBalance(result.balance);
    const movement = await inventoryRepository.appendMovement(
      movementRecord({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        productId: input.productId,
        sku: balance.sku,
        warehouseId,
        type: "Quarantine",
        quantity: -input.quantity,
        reason: `QC Quarantine: ${input.reason || "Under Inspection"}`,
        bucketsBefore: result.bucketsBefore,
        bucketsAfter: result.bucketsAfter,
        actorId: input.actorId,
        intent: balance.intent,
      }),
    );
    return { balance: saved, movement };
  }

  async unquarantine(input: {
    organizationId: string;
    workspaceId: string;
    productId: string;
    warehouseId?: string;
    quantity: number;
    reason?: string;
    actorId?: string;
  }) {
    const warehouseId = input.warehouseId ?? DEFAULT_WAREHOUSE_ID;
    const balance = await requireBalance(input.productId, warehouseId);
    const result = applyUnquarantine(balance, input.quantity);
    const saved = await inventoryRepository.saveBalance(result.balance);
    const movement = await inventoryRepository.appendMovement(
      movementRecord({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        productId: input.productId,
        sku: balance.sku,
        warehouseId,
        type: "Unquarantine",
        quantity: input.quantity,
        reason: `QC Passed / Released: ${input.reason || "Passed Inspection"}`,
        bucketsBefore: result.bucketsBefore,
        bucketsAfter: result.bucketsAfter,
        actorId: input.actorId,
        intent: balance.intent,
      }),
    );
    return { balance: saved, movement };
  }

  /**
   * Order Reservation Hold
   */
  async reserve(input: {
    organizationId: string;
    workspaceId: string;
    productId: string;
    warehouseId?: string;
    quantity: number;
    channel?: string;
    orderId?: string;
    reference?: string;
    expiresAt?: string;
    actorId?: string;
    actorName?: string;
  }) {
    const warehouseId = input.warehouseId ?? DEFAULT_WAREHOUSE_ID;
    const balance = await requireBalance(input.productId, warehouseId);
    if (balance.intent && balance.intent !== "sellable") {
      throw new InventoryEngineError(
        "INVALID_CLASSIFICATION",
        "Only sellable items can be reserved."
      );
    }
    const result = applyReserve(balance, input.quantity);
    const saved = await inventoryRepository.saveBalance(result.balance);

    const reservation = await inventoryRepository.createReservation({
      id: crypto.randomUUID(),
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      productId: input.productId,
      sku: balance.sku,
      warehouseId,
      quantity: input.quantity,
      status: "open",
      channel: input.channel,
      orderId: input.orderId,
      reference: input.reference || input.orderId,
      expiresAt: input.expiresAt,
      createdAt: new Date().toISOString(),
    });

    const movement = await inventoryRepository.appendMovement(
      movementRecord({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        productId: input.productId,
        sku: balance.sku,
        warehouseId,
        type: "Reservation",
        quantity: input.quantity,
        reason: `Order Reservation Hold (${input.channel || "Direct"})`,
        reference: reservation.id,
        bucketsBefore: result.bucketsBefore,
        bucketsAfter: result.bucketsAfter,
        actorId: input.actorId,
        actorName: input.actorName,
        intent: balance.intent,
      }),
    );

    return { balance: saved, reservation, movement };
  }

  /**
   * Order Reservation Release
   */
  async releaseReservation(input: {
    organizationId: string;
    workspaceId: string;
    reservationId: string;
    expired?: boolean;
    reason?: string;
    actorId?: string;
    actorName?: string;
  }) {
    const reservation = await inventoryRepository.getReservation(
      input.reservationId,
    );
    if (
      !reservation ||
      reservation.organizationId !== input.organizationId ||
      reservation.workspaceId !== input.workspaceId
    ) {
      throw new InventoryEngineError(
        "RESERVATION_NOT_FOUND",
        `Reservation ${input.reservationId} was not found.`,
      );
    }

    if (reservation.status !== "open") {
      throw new InventoryEngineError(
        "RESERVATION_NOT_OPEN",
        `Reservation ${input.reservationId} is already ${reservation.status}.`,
      );
    }

    const balance = await requireBalance(
      reservation.productId,
      reservation.warehouseId,
    );
    const result = applyRelease(balance, reservation.quantity);
    const saved = await inventoryRepository.saveBalance(result.balance);

    const nextReservation: Reservation = {
      ...reservation,
      status: input.expired ? "expired" : "released",
      releasedAt: new Date().toISOString(),
    };
    await inventoryRepository.saveReservation(nextReservation);

    const movement = await inventoryRepository.appendMovement(
      movementRecord({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        productId: reservation.productId,
        sku: balance.sku,
        warehouseId: reservation.warehouseId,
        type: "ReservationRelease",
        quantity: reservation.quantity,
        reason: input.expired
          ? "Reservation expired"
          : (input.reason || "Order cancelled / Reservation released"),
        reference: reservation.id,
        bucketsBefore: result.bucketsBefore,
        bucketsAfter: result.bucketsAfter,
        actorId: input.actorId,
        actorName: input.actorName,
        intent: balance.intent,
      }),
    );

    return {
      balance: saved,
      reservation: nextReservation,
      movement,
    };
  }

  /**
   * Order Allocation
   */
  async allocate(input: {
    organizationId: string;
    workspaceId: string;
    reservationId?: string;
    productId: string;
    warehouseId?: string;
    quantity: number;
    orderId: string;
    actorId?: string;
    actorName?: string;
  }) {
    const warehouseId = input.warehouseId ?? DEFAULT_WAREHOUSE_ID;
    const balance = await requireBalance(input.productId, warehouseId);
    if (balance.intent && balance.intent !== "sellable") {
      throw new InventoryEngineError(
        "INVALID_CLASSIFICATION",
        "Only sellable items may participate in allocations."
      );
    }
    const fromReserved = Boolean(input.reservationId);

    const result = applyAllocate(balance, input.quantity, fromReserved);
    const saved = await inventoryRepository.saveBalance(result.balance);

    if (input.reservationId) {
      const res = await inventoryRepository.getReservation(input.reservationId);
      if (res && res.status === "open") {
        await inventoryRepository.saveReservation({
          ...res,
          status: "allocated",
          allocatedAt: new Date().toISOString(),
        });
      }
    }

    const movement = await inventoryRepository.appendMovement(
      movementRecord({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        productId: input.productId,
        sku: balance.sku,
        warehouseId,
        type: "Allocation",
        quantity: input.quantity,
        reason: `Allocated to Order #${input.orderId}`,
        reference: input.orderId,
        bucketsBefore: result.bucketsBefore,
        bucketsAfter: result.bucketsAfter,
        actorId: input.actorId,
        actorName: input.actorName,
        intent: balance.intent,
      }),
    );

    return { balance: saved, movement };
  }

  /**
   * Order Fulfillment / Final Stock Deduction
   */
  async fulfillOrder(input: {
    organizationId: string;
    workspaceId: string;
    productId: string;
    warehouseId?: string;
    quantity: number;
    orderId: string;
    actorId?: string;
    actorName?: string;
  }) {
    const warehouseId = input.warehouseId ?? DEFAULT_WAREHOUSE_ID;
    const balance = await requireBalance(input.productId, warehouseId);
    const result = applyFulfillAllocation(balance, input.quantity);
    const saved = await inventoryRepository.saveBalance(result.balance);

    const movement = await inventoryRepository.appendMovement(
      movementRecord({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        productId: input.productId,
        sku: balance.sku,
        warehouseId,
        type: "Outbound",
        quantity: -input.quantity,
        reason: `Order Fulfilled & Shipped #${input.orderId}`,
        reference: input.orderId,
        bucketsBefore: result.bucketsBefore,
        bucketsAfter: result.bucketsAfter,
        actorId: input.actorId,
        actorName: input.actorName,
        intent: balance.intent,
      }),
    );

    return { balance: saved, movement };
  }

  /**
   * Consumable Usage
   */
  async consume(input: {
    organizationId: string;
    workspaceId: string;
    productId: string;
    warehouseId?: string;
    quantity: number;
    reason: string;
    reference?: string;
    actorId?: string;
    actorName?: string;
  }) {
    const warehouseId = input.warehouseId ?? DEFAULT_WAREHOUSE_ID;
    const balance = await requireBalance(input.productId, warehouseId);
    const result = applyConsume(balance, input.quantity);
    const saved = await inventoryRepository.saveBalance(result.balance);

    const movement = await inventoryRepository.appendMovement(
      movementRecord({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        productId: input.productId,
        sku: balance.sku,
        warehouseId,
        type: "Consumption",
        quantity: -input.quantity,
        reason: input.reason,
        reference: input.reference,
        bucketsBefore: result.bucketsBefore,
        bucketsAfter: result.bucketsAfter,
        actorId: input.actorId,
        actorName: input.actorName,
        intent: balance.intent,
      }),
    );

    return { balance: saved, movement };
  }

  /**
   * Damaged Stock Scrap & Finance Write-off
   */
  async scrapDamaged(input: {
    organizationId: string;
    workspaceId: string;
    productId: string;
    warehouseId?: string;
    quantity: number;
    reason: string;
    sourceBillId?: string;
    actorId?: string;
    actorName?: string;
  }) {
    const warehouseId = input.warehouseId ?? DEFAULT_WAREHOUSE_ID;
    const balance = await requireBalance(input.productId, warehouseId);
    const result = applyScrap(balance, input.quantity);
    const saved = await inventoryRepository.saveBalance(result.balance);

    const movement = await inventoryRepository.appendMovement(
      movementRecord({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        productId: input.productId,
        sku: balance.sku,
        warehouseId,
        type: "Scrap",
        quantity: -input.quantity,
        reason: `SCRAP / WRITE-OFF: ${input.reason}`,
        reference: input.sourceBillId,
        bucketsBefore: result.bucketsBefore,
        bucketsAfter: result.bucketsAfter,
        actorId: input.actorId,
        actorName: input.actorName,
        intent: balance.intent,
        metadata: {
          costPrice: balance.costPrice ?? 0,
          totalWriteOffAmount: (balance.costPrice ?? 0) * input.quantity,
        },
      }),
    );

    return { balance: saved, movement };
  }

  /**
   * Inter-Warehouse Transfer
   */
  async transfer(input: {
    organizationId: string;
    workspaceId: string;
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    reason?: string;
    actorId?: string;
    actorName?: string;
  }) {
    if (input.fromWarehouseId === input.toWarehouseId) {
      throw new InventoryEngineError(
        "INVALID_TRANSFER",
        "Source and destination warehouses must differ.",
      );
    }

    const from = await requireBalance(
      input.productId,
      input.fromWarehouseId,
    );
    let to = await inventoryRepository.getBalance(
      input.productId,
      input.toWarehouseId,
    );

    if (!to) {
      to = {
        id: `${input.productId}:${input.toWarehouseId}`,
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        productId: input.productId,
        sku: from.sku,
        productName: from.productName,
        warehouseId: input.toWarehouseId,
        ...emptyBuckets(),
        updatedAt: new Date().toISOString(),
      };
    }

    const outResult = applyTransferOut(from, input.quantity);
    const inResult = applyTransferIn(to, input.quantity);

    // Clears in-transit once accepted at destination
    outResult.balance.inTransit = Math.max(
      0,
      (outResult.balance.inTransit ?? 0) - input.quantity,
    );

    const savedFrom = await inventoryRepository.saveBalance(
      outResult.balance,
    );
    const savedTo = await inventoryRepository.saveBalance(inResult.balance);

    const movement = await inventoryRepository.appendMovement(
      movementRecord({
        organizationId: input.organizationId,
        workspaceId: input.workspaceId,
        productId: input.productId,
        sku: from.sku,
        warehouseId: input.fromWarehouseId,
        type: "Transfer",
        quantity: input.quantity,
        reason: input.reason ?? `Transfer from ${input.fromWarehouseId} to ${input.toWarehouseId}`,
        fromWarehouseId: input.fromWarehouseId,
        toWarehouseId: input.toWarehouseId,
        bucketsBefore: outResult.bucketsBefore,
        bucketsAfter: pickBuckets(savedFrom),
        actorId: input.actorId,
        actorName: input.actorName,
        intent: from.intent,
      }),
    );

    return {
      from: savedFrom,
      to: savedTo,
      movement,
    };
  }

  /**
   * Multi-Channel Allocation
   */
  async getChannelAllocations(
    organizationId: string,
    workspaceId: string,
    productId: string,
    mode: SellerComplexityMode = "small",
  ): Promise<ChannelAllocationResult> {
    const balance = await requireBalance(productId, DEFAULT_WAREHOUSE_ID);
    if (balance.intent && balance.intent !== "sellable") {
      throw new InventoryEngineError(
        "INVALID_CLASSIFICATION",
        "Only sellable items may participate in channel allocation."
      );
    }

    const sku = balance.sku;
    try {
      const dbRules = await db.channelAllocationRule.findMany({
        where: { workspaceId, sku: { equals: sku, mode: "insensitive" } },
      });
      if (dbRules.length > 0) {
        channelAllocationEngine.setRulesForSku(
          sku,
          dbRules.map((r: any) => ({
            channel: r.channel,
            allocationPercent: r.allocationPercent || undefined,
            fixedCap: r.fixedCap || undefined,
            priority: r.priority || undefined,
            safetyBuffer: r.safetyBuffer || undefined,
            active: r.active,
          }))
        );
      }
    } catch (err) {
      console.warn("Failed to load channel allocation rules from DB:", err);
    }

    return channelAllocationEngine.calculateAllocations(balance, mode);
  }

  /**
   * Run Central Reconciliation Audit
   */
  async reconcile(organizationId: string, workspaceId: string): Promise<ReconciliationReport> {
    const balances = await inventoryRepository.listBalances({ organizationId, workspaceId });
    const reservations = await inventoryRepository.listReservations({ organizationId, workspaceId });

    const baseReport = inventoryReconciliationEngine.auditBalances({
      inventoryBalances: balances,
      activeReservations: reservations,
    });

    try {
      const { ledgerReconciliationService } = await import("./ledger-reconciliation");
      const ledgerReport = await ledgerReconciliationService.reconcile(organizationId, workspaceId);
      
      const mergedIssues = [...baseReport.issues, ...ledgerReport.issues];
      return {
        timestamp: baseReport.timestamp,
        totalSkusAudited: baseReport.totalSkusAudited,
        healthyCount: Math.max(0, baseReport.totalSkusAudited - mergedIssues.length),
        issueCount: mergedIssues.length,
        issues: mergedIssues,
        status: mergedIssues.length === 0 ? "CLEAN" : "DISCREPANCIES_DETECTED",
      };
    } catch {
      return baseReport;
    }
  }


  async totalAvailable(
    organizationId: string,
    workspaceId: string,
    productId: string,
  ) {
    const balances = await inventoryRepository.listBalances({
      organizationId,
      workspaceId,
      productId,
    });
    return balances.reduce((sum, row) => sum + (row.available ?? 0), 0);
  }
}

export const inventoryService = new InventoryService();
