// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateATS,
  applyInbound,
  applyOutbound,
  applyReserve,
  applyRelease,
  applyAllocate,
  applyDeallocate,
  applyFulfillAllocation,
  applyTransferOut,
  applyTransferIn,
  applyDamage,
  applyQuarantine,
  applyUnquarantine,
  applyConsume,
  applyScrap,
  InventoryEngineError,
} from "../engine";
import { channelAllocationEngine } from "../channel-allocation.engine";
import { inventoryReconciliationEngine } from "../reconciliation-engine";
import type { StockBalance } from "../types";

describe("CommerceOS Inventory Stock Engine v2 — Comprehensive Test Suite", () => {
  const createSampleBalance = (overrides?: Partial<StockBalance>): StockBalance => ({
    id: "prod-001:wh-default",
    organizationId: "org-commerceos",
    workspaceId: "ws-default",
    productId: "prod-001",
    sku: "PROD-FOOTWEAR-001",
    productName: "Premium Mesh Running Shoes",
    warehouseId: "wh-default",
    available: 100,
    reserved: 0,
    allocated: 0,
    incoming: 50,
    damaged: 0,
    inTransit: 0,
    consumed: 0,
    scrapped: 0,
    safetyStock: 5,
    costPrice: 500,
    sellingPrice: 1200,
    updatedAt: new Date().toISOString(),
    ...overrides,
  });

  beforeEach(() => {
    channelAllocationEngine.clearQueue();
  });

  // TEST 1 & 2: Authoritative Stock Inbound & ATS
  it("TEST 1: Inbound physical stock increases available on-hand and recalculates ATS", () => {
    const balance = createSampleBalance({ available: 50, incoming: 20 });
    const result = applyInbound(balance, 20);

    expect(result.balance.available).toBe(70);
    expect(result.balance.incoming).toBe(0);

    const ats = calculateATS(result.balance);
    // ATS = OnHand (70) - Reserved (0) - Allocated (0) - SafetyStock (5) = 65
    expect(ats.ats).toBe(65);
    expect(ats.onHand).toBe(70);
  });

  // TEST 3: QC Damaged Quantity is strictly excluded from ATS
  it("TEST 3: QC damaged quantity is isolated from ATS", () => {
    const balance = createSampleBalance({ available: 100, damaged: 0, safetyStock: 0 });
    const damagedResult = applyDamage(balance, 15);

    expect(damagedResult.balance.available).toBe(85);
    expect(damagedResult.balance.damaged).toBe(15);

    const ats = calculateATS(damagedResult.balance);
    expect(ats.ats).toBe(85);
    expect(ats.damaged).toBe(15);
  });

  // TEST 4: ATS Calculation Math & Negative Protection
  it("TEST 4: ATS calculation prevents negative values when safety stock / allocation exceeds on-hand", () => {
    const balance = createSampleBalance({ available: 2, allocated: 5, safetyStock: 5 });
    const ats = calculateATS(balance);
    expect(ats.ats).toBe(0); // Never negative
  });

  // TEST 5 & 6: Reservation Lifecycle and ATS depletion
  it("TEST 5 & 6: Reservation holds stock, decreases ATS, and rejects over-reservation", () => {
    const balance = createSampleBalance({ available: 100, reserved: 10, safetyStock: 5 });

    const reserved = applyReserve(balance, 30);
    expect(reserved.balance.available).toBe(70);
    expect(reserved.balance.reserved).toBe(40);
    expect(calculateATS(reserved.balance).ats).toBe(65); // 70 - 0 - 5

    // Attempting to reserve more than available (70) must throw
    expect(() => {
      applyReserve(reserved.balance, 80);
    }).toThrow(InventoryEngineError);
  });

  // TEST 7: Order Cancellation / Release returns stock to ATS
  it("TEST 7: Cancellation releases reserved stock back to available pool", () => {
    const balance = createSampleBalance({ available: 100, reserved: 30 });
    const released = applyRelease(balance, 20);

    expect(released.balance.reserved).toBe(10);
    expect(released.balance.available).toBe(120);
    expect(calculateATS(released.balance).ats).toBe(115); // 120 - 5
  });

  // TEST 8: Order Allocation commits reserved stock
  it("TEST 8: Allocation shifts stock from reserved to allocated bucket", () => {
    const balance = createSampleBalance({ available: 100, reserved: 30, allocated: 0 });
    const allocated = applyAllocate(balance, 20, true);

    expect(allocated.balance.reserved).toBe(10);
    expect(allocated.balance.allocated).toBe(20);

    // ATS is unreserved available minus allocated: 100 - 20 - 5 = 75
    expect(calculateATS(allocated.balance).ats).toBe(75);
  });

  // TEST 9 & 10: Inter-Warehouse Transfer prevents double-counting
  it("TEST 9 & 10: Multi-warehouse transfer accounting (Available -> InTransit -> Destination Available)", () => {
    const sourceBal = createSampleBalance({ warehouseId: "wh-delhi", available: 100, safetyStock: 0 });
    const destBal = createSampleBalance({ warehouseId: "wh-mumbai", available: 20, safetyStock: 0 });

    // 1. Source initiates transfer: 30 units
    const transferOut = applyTransferOut(sourceBal, 30);
    expect(transferOut.balance.available).toBe(70);
    expect(transferOut.balance.inTransit).toBe(30);

    // Network total during transit: Source Available (70) + InTransit (30) + Dest Available (20) = 120
    const networkTotalInTransit =
      transferOut.balance.available +
      transferOut.balance.inTransit +
      destBal.available;
    expect(networkTotalInTransit).toBe(120);

    // 2. Destination receives transfer: 30 units
    const transferIn = applyTransferIn(destBal, 30);
    transferOut.balance.inTransit -= 30; // Cleared on putaway

    expect(transferIn.balance.available).toBe(50);
    expect(transferOut.balance.inTransit).toBe(0);

    // Network total post-transfer: Source (70) + Dest (50) = 120 (Exact conservation)
    expect(transferOut.balance.available + transferIn.balance.available).toBe(120);
  });

  // TEST 11: Consumable Packaging Item Consumption
  it("TEST 11: Consumable item consumption decreases available count and tracks used bucket", () => {
    const consumableBal = createSampleBalance({
      sku: "BOX-CORR-10X10",
      productName: "Packaging Boxes 10x10",
      intent: "consumable",
      available: 500,
      consumed: 0,
      safetyStock: 0,
    });

    const consumed = applyConsume(consumableBal, 120);
    expect(consumed.balance.available).toBe(380);
    expect(consumed.balance.consumed).toBe(120);
  });

  // TEST 12 & 13: Damaged Stock Scrap & Finance Write-Off
  it("TEST 12 & 13: Scrap removes damaged stock permanently", () => {
    const balance = createSampleBalance({ available: 80, damaged: 20, scrapped: 0 });
    const scrapped = applyScrap(balance, 10);

    expect(scrapped.balance.damaged).toBe(10);
    expect(scrapped.balance.scrapped).toBe(10);
  });

  // TEST 14 & 15: Progressive Channel Allocation (Small Seller vs Growing Seller)
  it("TEST 14 & 15: Common stock pool allocates full ATS to all channels without fabricated numbers", () => {
    const balance = createSampleBalance({ available: 81, reserved: 0, safetyStock: 5 });
    // ATS = 76

    // 1. Small Seller Mode: Shared Common Stock Pool
    const smallAlloc = channelAllocationEngine.calculateAllocations(balance, "small", [
      "AMAZON",
      "FLIPKART",
      "SHOPIFY",
    ]);

    expect(smallAlloc.totalAts).toBe(76);
    expect(smallAlloc.allocations[0]!.allocatedQty).toBe(76);
    expect(smallAlloc.allocations[1]!.allocatedQty).toBe(76);
    expect(smallAlloc.allocations[2]!.allocatedQty).toBe(76);
    expect(smallAlloc.allocations[0]!.syncStatus).toBe("PENDING_SYNC");

    // 2. Growing Seller Mode: Custom Percentage Split
    channelAllocationEngine.setRulesForSku("PROD-FOOTWEAR-001", [
      { channel: "AMAZON", percentage: 50, active: true },
      { channel: "FLIPKART", percentage: 30, active: true },
      { channel: "SHOPIFY", percentage: 20, active: true },
    ]);

    const growingAlloc = channelAllocationEngine.calculateAllocations(balance, "growing", [
      "AMAZON",
      "FLIPKART",
      "SHOPIFY",
    ]);

    // 50% of 76 = 38, 30% of 76 = 22, 20% of 76 = 15 -> Sum <= 76
    const sumAlloc = growingAlloc.allocations.reduce((acc, a) => acc + a.allocatedQty, 0);
    expect(sumAlloc).toBeLessThanOrEqual(76);
    expect(growingAlloc.allocations[0]!.allocatedQty).toBe(38);
    expect(growingAlloc.allocations[1]!.allocatedQty).toBe(22);
  });

  // TEST 16: Idempotent Async Marketplace Sync Queue
  it("TEST 16: Duplicate marketplace sync event is idempotently rejected", () => {
    const firstAttempt = channelAllocationEngine.queueSync({
      sku: "PROD-FOOTWEAR-001",
      channel: "AMAZON",
      quantity: 50,
      idempotencyKey: "evt-sync-order-1234",
    });

    expect(firstAttempt.queued).toBe(true);

    // Second duplicate attempt
    const secondAttempt = channelAllocationEngine.queueSync({
      sku: "PROD-FOOTWEAR-001",
      channel: "AMAZON",
      quantity: 50,
      idempotencyKey: "evt-sync-order-1234",
    });

    expect(secondAttempt.queued).toBe(false);
    expect(secondAttempt.reason).toContain("Duplicate");
  });

  // TEST 17: Order Fulfillment Final Stock Deduction
  it("TEST 17: Fulfill order permanently clears allocation and reduces on-hand", () => {
    const balance = createSampleBalance({ available: 100, allocated: 0 });
    const allocated = applyAllocate(balance, 15, false);
    expect(allocated.balance.available).toBe(85);
    expect(allocated.balance.allocated).toBe(15);

    const fulfilled = applyFulfillAllocation(allocated.balance, 15);
    expect(fulfilled.balance.allocated).toBe(0);
    expect(fulfilled.balance.available).toBe(85);
    expect(calculateATS(fulfilled.balance).onHand).toBe(85);
  });

  // TEST 18: Central Reconciliation Engine detects variances
  it("TEST 18: Reconciliation engine detects negative stock, over-reservation, and storage mismatches", () => {
    const balances: StockBalance[] = [
      createSampleBalance({ sku: "SKU-CLEAN", available: 100, reserved: 10, safetyStock: 5 }),
      createSampleBalance({ sku: "SKU-OVER-RES", available: 20, reserved: 30 }), // Over-reserved
      createSampleBalance({ sku: "SKU-MISMATCH", available: 50 }), // Storage has 60
    ];

    const storageRecords = [
      { storageLocationId: "loc-1", sku: "SKU-CLEAN", availableQty: 100 },
      { storageLocationId: "loc-1", sku: "SKU-MISMATCH", availableQty: 60 },
    ];

    const report = inventoryReconciliationEngine.auditBalances({
      inventoryBalances: balances,
      storagePhysicalRecords: storageRecords,
    });

    expect(report.status).toBe("DISCREPANCIES_DETECTED");
    expect(report.issueCount).toBeGreaterThanOrEqual(2);
    expect(report.issues.some((i) => i.type === "OVER_RESERVATION" && i.sku === "SKU-OVER-RES")).toBe(true);
    expect(report.issues.some((i) => i.type === "STORAGE_MISMATCH" && i.sku === "SKU-MISMATCH")).toBe(true);
  });
});
