import { db } from "@/lib/db";
import { inventoryRepository } from "./repository";
import type { ReconciliationIssue, ReconciliationReport, StockBalance, StockMovement } from "./types";

export class LedgerReconciliationService {
  public async reconcile(organizationId: string, workspaceId: string): Promise<ReconciliationReport> {
    const now = new Date().toISOString();
    const issues: ReconciliationIssue[] = [];

    let inventoryBalances: StockBalance[] = [];
    try {
      const rows = await db.inventory.findMany({
        where: { workspaceId },
        include: { product: true }
      });
      inventoryBalances = rows.map((r) => ({
        id: r.id,
        organizationId,
        workspaceId: r.workspaceId,
        productId: r.productId,
        sku: r.sku,
        productName: r.product?.name || r.sku,
        warehouseId: r.warehouseId,
        available: r.available,
        reserved: r.reserved,
        incoming: r.incoming,
        damaged: r.damaged,
        inTransit: r.inTransit,
        intent: r.intent,
      }));
    } catch {
      // Fallback
      inventoryBalances = await inventoryRepository.listBalances({ workspaceId, organizationId });
    }

    const skus = Array.from(new Set(inventoryBalances.map((b) => b.sku)));
    let sellableSkusCount = 0;
    let consumableSkusCount = 0;
    let assetSkusCount = 0;

    for (const sku of skus) {
      const invRecord = inventoryBalances.find((b) => b.sku === sku);
      const productId = invRecord?.productId;
      const warehouseId = invRecord?.warehouseId;
      const invQty = invRecord?.available ?? 0;
      const intent = invRecord?.intent || "sellable";

      if (intent === "consumable") consumableSkusCount++;
      else if (intent === "asset") assetSkusCount++;
      else sellableSkusCount++;

      // Check for missing classification
      if (!invRecord?.intent) {
        issues.push({
          id: `rec-missing-class-${sku}-${Date.now()}`,
          type: "INVALID_CLASSIFICATION",
          severity: "MEDIUM",
          sku,
          productId,
          warehouseId,
          description: `Inventory item ${sku} lacks an explicit classification intent.`,
          suggestedAction: "Set the classification to sellable, consumable, or asset.",
          detectedAt: now,
        });
      }

      // Check for conflict with Product intent
      try {
        if (productId) {
          const prod = await db.product.findUnique({
            where: { id: productId },
            select: { intent: true }
          });
          if (prod && prod.intent && invRecord?.intent && prod.intent !== invRecord.intent) {
            issues.push({
              id: `rec-class-conflict-${sku}-${Date.now()}`,
              type: "INVALID_CLASSIFICATION",
              severity: "HIGH",
              sku,
              productId,
              warehouseId,
              description: `Classification conflict: Inventory is '${invRecord.intent}' but Product master is '${prod.intent}'.`,
              suggestedAction: "Synchronize the Product and Inventory classification definitions.",
              detectedAt: now,
            });
          }
        }
      } catch {}

      let movements: StockMovement[] = [];
      try {
        const rows = await db.inventoryMovement.findMany({
          where: { workspaceId, sku }
        });
        movements = rows.map((r) => ({
          id: r.id,
          organizationId: r.organizationId,
          workspaceId: r.workspaceId,
          productId: r.productId,
          sku: r.sku,
          warehouseId: r.warehouseId || "",
          type: r.type as any,
          quantity: r.quantity,
          bucketsBefore: r.bucketsBefore ? (r.bucketsBefore as any) : undefined,
          bucketsAfter: r.bucketsAfter ? (r.bucketsAfter as any) : undefined,
          intent: r.intent,
          createdAt: r.createdAt.toISOString(),
        }));
      } catch {
        // Fallback
        movements = await inventoryRepository.listMovements({ workspaceId, organizationId, productId });
      }

      let expectedAvailable = 0;
      for (const m of movements) {
        if (m.type === "Inbound") {
          expectedAvailable += m.quantity;
        } else if (m.type === "Outbound") {
          expectedAvailable += m.quantity;
        } else if (m.type === "Adjustment") {
          expectedAvailable += m.quantity;
        } else if (m.type === "Transfer") {
          expectedAvailable += m.quantity;
        } else if (m.type === "Consumption") {
          expectedAvailable += m.quantity;
        } else if (m.type === "Scrap") {
          expectedAvailable += m.quantity;
        } else if (m.type === "Reservation") {
          expectedAvailable -= m.quantity;
        } else if (m.type === "ReservationRelease") {
          expectedAvailable += m.quantity;
        } else if (m.type === "Allocation") {
          const meta = m.metadata as any;
          if (meta?.fromReserved === false) {
            expectedAvailable -= m.quantity;
          }
        }
      }

      if (Math.abs(expectedAvailable - invQty) > 0) {
        issues.push({
          id: `rec-ledger-mismatch-${sku}-${Date.now()}`,
          type: "LEDGER_MISMATCH",
          severity: "HIGH",
          sku,
          productId,
          warehouseId,
          description: `Ledger played Available count (${expectedAvailable}) differs from projected Inventory available (${invQty}).`,
          inventoryQty: invQty,
          delta: expectedAvailable - invQty,
          suggestedAction: "Run ledger replay sync to update the derived inventory projection tables.",
          detectedAt: now,
        });
      }

      let storageQty = invQty;
      try {
        const storageStocks = await db.storageStock.findMany({
          where: { workspaceId, sku }
        });
        storageQty = storageStocks.reduce((sum, s) => sum + s.availableQty, 0);
      } catch {
        // Fallback: storage stock matches inventory in fallback mode
        storageQty = invQty;
      }

      if (Math.abs(storageQty - invQty) > 0) {
        issues.push({
          id: `rec-store-mismatch-${sku}-${Date.now()}`,
          type: "STORAGE_MISMATCH",
          severity: "MEDIUM",
          sku,
          productId,
          warehouseId,
          description: `Physical Storage bin count (${storageQty}) differs from projected Inventory available (${invQty}).`,
          storageQty,
          inventoryQty: invQty,
          delta: storageQty - invQty,
          suggestedAction: "Sync physical storage allocations with central central stock movements ledger.",
          detectedAt: now,
        });
      }
    }

    return {
      timestamp: now,
      totalSkusAudited: skus.length,
      healthyCount: Math.max(0, skus.length - issues.length),
      issueCount: issues.length,
      issues,
      status: issues.length === 0 ? "CLEAN" : "DISCREPANCIES_DETECTED",
      sellableSkusCount,
      consumableSkusCount,
      assetSkusCount,
    };
  }
}

export const ledgerReconciliationService = new LedgerReconciliationService();

