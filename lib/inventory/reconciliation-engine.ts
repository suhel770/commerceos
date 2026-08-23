/**
 * CommerceOS — Centralized Inventory Reconciliation Engine
 * Automatically audits consistency between Storage Physical Bins, Inventory Balances,
 * Reservations, In-Transit Transfers, and Marketplace Allocations.
 */

import { calculateATS } from "./engine";
import type {
  ReconciliationIssue,
  ReconciliationReport,
  Reservation,
  StockBalance,
} from "./types";

export class InventoryReconciliationEngine {
  /**
   * Run comprehensive audit across inventory balances, physical storage records, and reservations.
   */
  auditBalances(input: {
    inventoryBalances: StockBalance[];
    storagePhysicalRecords?: Array<{
      storageLocationId: string;
      sku: string;
      availableQty: number;
    }>;
    activeReservations?: Reservation[];
  }): ReconciliationReport {
    const issues: ReconciliationIssue[] = [];
    const balances = input.inventoryBalances;
    const now = new Date().toISOString();

    for (const bal of balances) {
      const sku = bal.sku;

      // 1. Negative Stock Check
      if ((bal.available ?? 0) < 0) {
        issues.push({
          id: `rec-neg-${sku}-${Date.now()}`,
          type: "NEGATIVE_STOCK",
          severity: "CRITICAL",
          sku,
          productId: bal.productId,
          warehouseId: bal.warehouseId,
          description: `SKU ${sku} has negative available balance (${bal.available}).`,
          inventoryQty: bal.available,
          suggestedAction: "Perform immediate cycle count and post reconciliation adjustment.",
          detectedAt: now,
        });
      }

      if ((bal.reserved ?? 0) < 0 || (bal.allocated ?? 0) < 0 || (bal.damaged ?? 0) < 0) {
        issues.push({
          id: `rec-neg-bucket-${sku}-${Date.now()}`,
          type: "NEGATIVE_STOCK",
          severity: "HIGH",
          sku,
          productId: bal.productId,
          warehouseId: bal.warehouseId,
          description: `SKU ${sku} has negative reserved/allocated/damaged quantity.`,
          suggestedAction: "Audit recent order cancellations and reset corrupted bucket values.",
          detectedAt: now,
        });
      }

      // 2. Over-Reservation vs On-Hand Check
      if ((bal.reserved ?? 0) > (bal.available ?? 0)) {
        issues.push({
          id: `rec-overres-${sku}-${Date.now()}`,
          type: "OVER_RESERVATION",
          severity: "HIGH",
          sku,
          productId: bal.productId,
          warehouseId: bal.warehouseId,
          description: `Reserved units (${bal.reserved}) exceed total on-hand units (${bal.available}) for SKU ${sku}.`,
          delta: (bal.reserved ?? 0) - (bal.available ?? 0),
          suggestedAction: "Release orphaned reservations or replenish stock immediately.",
          detectedAt: now,
        });
      }

      // 3. Storage vs Inventory Physical Count Comparison
      if (input.storagePhysicalRecords && input.storagePhysicalRecords.length > 0) {
        const matchingStorage = input.storagePhysicalRecords.filter(
          (s) => s.sku.toLowerCase().trim() === sku.toLowerCase().trim(),
        );
        const totalStorageQty = matchingStorage.reduce((sum, s) => sum + s.availableQty, 0);

        // If storage physical records exist for this SKU, compare with Inventory on-hand
        if (matchingStorage.length > 0 && Math.abs(totalStorageQty - (bal.available ?? 0)) > 0) {
          issues.push({
            id: `rec-store-mismatch-${sku}-${Date.now()}`,
            type: "STORAGE_MISMATCH",
            severity: "MEDIUM",
            sku,
            productId: bal.productId,
            warehouseId: bal.warehouseId,
            description: `Physical Storage bin count (${totalStorageQty}) differs from Central Inventory (${bal.available}). Variance: ${totalStorageQty - (bal.available ?? 0)} units.`,
            storageQty: totalStorageQty,
            inventoryQty: bal.available,
            delta: totalStorageQty - (bal.available ?? 0),
            suggestedAction: "Sync storage bin putaway ledger with central stock ledger.",
            detectedAt: now,
          });
        }
      }

      // 4. ATS Sanity Check
      const atsDetails = calculateATS(bal);
      if (atsDetails.ats < 0) {
        issues.push({
          id: `rec-neg-ats-${sku}-${Date.now()}`,
          type: "OVER_ALLOCATION",
          severity: "HIGH",
          sku,
          productId: bal.productId,
          warehouseId: bal.warehouseId,
          description: `Calculated ATS is negative (${atsDetails.ats}).`,
          suggestedAction: "Recalculate safety stock buffer and active channel allocations.",
          detectedAt: now,
        });
      }
    }

    // 5. Active Reservations Audit
    if (input.activeReservations && input.activeReservations.length > 0) {
      for (const res of input.activeReservations) {
        if (res.status === "open" && res.expiresAt) {
          const expiresAtTime = new Date(res.expiresAt).getTime();
          if (expiresAtTime < Date.now()) {
            issues.push({
              id: `rec-orphaned-res-${res.id}`,
              type: "ORPHANED_RESERVATION",
              severity: "LOW",
              sku: res.sku || res.productId,
              productId: res.productId,
              warehouseId: res.warehouseId,
              description: `Reservation ${res.id} expired at ${res.expiresAt} but remains in 'open' status.`,
              suggestedAction: "Trigger automated reservation expiration release.",
              detectedAt: now,
            });
          }
        }
      }
    }

    return {
      timestamp: now,
      totalSkusAudited: balances.length,
      healthyCount: Math.max(0, balances.length - issues.length),
      issueCount: issues.length,
      issues,
      status: issues.length === 0 ? "CLEAN" : "DISCREPANCIES_DETECTED",
    };
  }
}

export const inventoryReconciliationEngine = new InventoryReconciliationEngine();
