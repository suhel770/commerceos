// @vitest-environment jsdom

import { describe, it, expect } from "vitest";
import {
  inventoryAdvisorEngine,
  type InventoryAdvisorAnalysisInput,
} from "../inventory-advisor-engine";
import type { StockBalance } from "../types";

describe("CommerceOS Inventory AI Advisor & Decision Intelligence Tests", () => {
  const createSampleBalance = (overrides?: Partial<StockBalance>): StockBalance => ({
    id: "prod-101:wh-default",
    organizationId: "org-test",
    workspaceId: "ws-test",
    productId: "prod-101",
    sku: "SKU-TEST-001",
    productName: "Performance Grip Socks",
    warehouseId: "wh-default",
    available: 100,
    reserved: 0,
    allocated: 0,
    incoming: 0,
    damaged: 0,
    inTransit: 0,
    consumed: 0,
    scrapped: 0,
    safetyStock: 10,
    costPrice: 200,
    sellingPrice: 500,
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  // TEST 1: Stockout Risk Detection
  it("TEST 1: Identifies stockout risk when ATS is at or below safety reorder threshold", () => {
    const input: InventoryAdvisorAnalysisInput = {
      balances: [
        createSampleBalance({
          sku: "SKU-LOW-STOCK",
          available: 12, // <= reorderPoint (20)
          safetyStock: 10,
          incoming: 0,
          inTransit: 0,
        }),
      ],
      recentOrders: [
        { sku: "SKU-LOW-STOCK", quantity: 60, createdAt: new Date().toISOString() }, // 2 units/day
      ],
    };

    const recs = inventoryAdvisorEngine.generateRecommendations(input);
    const stockoutRec = recs.find((r) => r.type === "STOCKOUT_RISK");

    expect(stockoutRec).toBeDefined();
    expect(stockoutRec?.sku).toBe("SKU-LOW-STOCK");
    expect(stockoutRec?.actionWorkflow).toBe("reorder");
    expect(stockoutRec?.actionRoute).toBe("/purchase");
    expect(stockoutRec?.evidence.daysOfCover).toBe(1); // ATS (2 units) / 2 units per day = 1 day
  });

  // TEST 2: Reorder Recommendation on Depleted Stock
  it("TEST 2: Triggers critical restock recommendation when ATS is zero", () => {
    const input: InventoryAdvisorAnalysisInput = {
      balances: [
        createSampleBalance({
          sku: "SKU-DEPLETED",
          available: 0,
          incoming: 0,
          safetyStock: 15,
        }),
      ],
    };

    const recs = inventoryAdvisorEngine.generateRecommendations(input);
    const reorderRec = recs.find((r) => r.type === "REORDER_RECOMMENDATION");

    expect(reorderRec).toBeDefined();
    expect(reorderRec?.severity).toBe("critical");
    expect(reorderRec?.recommendedAction).toContain("replenishment PO");
    expect(reorderRec?.requiresApproval).toBe(true);
  });

  // TEST 3: Insufficient Historical Data Handling
  it("TEST 3: Displays 'Insufficient data' instead of fabricating velocity numbers when no orders exist", () => {
    const input: InventoryAdvisorAnalysisInput = {
      balances: [
        createSampleBalance({
          sku: "SKU-NO-HISTORY",
          available: 15,
          safetyStock: 10,
          incoming: 0,
        }),
      ],
      recentOrders: [], // No history
    };

    const recs = inventoryAdvisorEngine.generateRecommendations(input);
    const rec = recs.find((r) => r.sku === "SKU-NO-HISTORY");

    expect(rec).toBeDefined();
    expect(rec?.evidence.daysOfCover).toBe("Insufficient data");
    expect(rec?.confidence).toBe("Insufficient data");
  });

  // TEST 4: Slow / Dead Stock Detection
  it("TEST 4: Identifies slow-moving inventory with locked working capital", () => {
    const input: InventoryAdvisorAnalysisInput = {
      balances: [
        createSampleBalance({
          sku: "SKU-SLOW-MOVER",
          available: 120,
          costPrice: 350,
        }),
      ],
      recentOrders: [],
    };

    const recs = inventoryAdvisorEngine.generateRecommendations(input);
    const deadRec = recs.find((r) => r.type === "SLOW_DEAD_STOCK");

    expect(deadRec).toBeDefined();
    expect(deadRec?.evidence.estimatedCapitalLockedInr).toBe(120 * 350);
    expect(deadRec?.recommendedAction).toContain("promotional bundle");
  });

  // TEST 5: Damaged / QC Disposition Intelligence
  it("TEST 5: Surfaces unresolved QC quarantine units and recommends vendor exchange or scrap", () => {
    const input: InventoryAdvisorAnalysisInput = {
      balances: [
        createSampleBalance({
          sku: "SKU-QC-DAMAGED",
          available: 40,
          damaged: 8,
        }),
      ],
    };

    const recs = inventoryAdvisorEngine.generateRecommendations(input);
    const damageRec = recs.find((r) => r.type === "DAMAGED_QC_DISPOSITION");

    expect(damageRec).toBeDefined();
    expect(damageRec?.evidence.damaged).toBe(8);
    expect(damageRec?.actionWorkflow).toBe("vendor_exchange");
  });

  // TEST 6: Reconciliation Anomaly Integration
  it("TEST 6: Integrates reconciliation engine variances as authoritative anomaly signals", () => {
    const input: InventoryAdvisorAnalysisInput = {
      balances: [
        createSampleBalance({
          sku: "SKU-MISMATCH",
          available: 100,
        }),
      ],
      storageLocations: [
        { storageLocationId: "loc-alpha", sku: "SKU-MISMATCH", availableQty: 65 }, // Variance of 35
      ],
    };

    const recs = inventoryAdvisorEngine.generateRecommendations(input);
    const anomalyRec = recs.find((r) => r.type === "INVENTORY_ANOMALY");

    expect(anomalyRec).toBeDefined();
    expect(anomalyRec?.confidence).toBe("Deterministic (100%)");
    expect(anomalyRec?.actionWorkflow).toBe("reconcile");
  });

  // TEST 7: Multi-Location Warehouse Transfer Rebalance
  it("TEST 7: Recommends inter-facility stock transfer when one facility has surplus and another has shortage", () => {
    const input: InventoryAdvisorAnalysisInput = {
      balances: [createSampleBalance({ sku: "SKU-MULTI-NODE" })],
      storageLocations: [
        { storageLocationId: "loc-main", locationName: "Main Warehouse", sku: "SKU-MULTI-NODE", availableQty: 100 },
        { storageLocationId: "loc-hub", locationName: "Bengaluru Hub", sku: "SKU-MULTI-NODE", availableQty: 3 },
      ],
    };

    const recs = inventoryAdvisorEngine.generateRecommendations(input);
    const transferRec = recs.find((r) => r.type === "WAREHOUSE_TRANSFER");

    expect(transferRec).toBeDefined();
    expect(transferRec?.actionWorkflow).toBe("transfer");
    expect(transferRec?.explanation).toContain("Main Warehouse has surplus stock");
    expect(transferRec?.recommendedAction).toContain("Transfer 30 units");
  });

  // TEST 8: Disconnected Marketplace Indicator
  it("TEST 8: Flags disconnected marketplace channels as NOT CONNECTED without fake stock", () => {
    const input: InventoryAdvisorAnalysisInput = {
      balances: [createSampleBalance()],
      connectedMarketplaces: [
        { channel: "Amazon SP-API", connected: false },
        { channel: "Flipkart FBF", connected: false },
      ],
    };

    const recs = inventoryAdvisorEngine.generateRecommendations(input);
    const mktRec = recs.find((r) => r.type === "MARKETPLACE_ALLOCATION");

    expect(mktRec).toBeDefined();
    expect(mktRec?.explanation).toContain("NOT CONNECTED");
  });

  // TEST 9: Invariant — AI recommendations NEVER mutate inventory balances
  it("TEST 9: AI recommendation generation does NOT alter original input balance objects", () => {
    const original = createSampleBalance({ available: 80, reserved: 20 });
    const originalCopy = JSON.parse(JSON.stringify(original));

    inventoryAdvisorEngine.generateRecommendations({
      balances: [original],
    });

    expect(original.available).toBe(originalCopy.available);
    expect(original.reserved).toBe(originalCopy.reserved);
    expect(original.damaged).toBe(originalCopy.damaged);
  });
});
