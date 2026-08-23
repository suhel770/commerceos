import { describe, it, expect, beforeEach } from "vitest";
import { channelAllocationEngine } from "../channel-allocation.engine";
import type { StockBalance } from "../types";

describe("CommerceOS — Master Listing Marketplace Allocation Architecture Tests", () => {
  beforeEach(() => {
    channelAllocationEngine.clearQueue();
  });

  const sampleBalance: StockBalance = {
    id: "bal-sandals-001",
    organizationId: "org-1",
    workspaceId: "ws-1",
    productId: "prod-sandals-001",
    sku: "SKU-NOVA-SAND-PNK",
    productName: "Kids Sandal - Pink",
    warehouseId: "wh-main",
    available: 203,
    reserved: 0,
    allocated: 0,
    incoming: 0,
    damaged: 0,
    inTransit: 0,
    consumed: 0,
    scrapped: 0,
    safetyStock: 0,
    updatedAt: new Date().toISOString(),
  };

  // TEST 1: Fixed allocation configuration & ATS bounds check
  it("TEST 1: Product configures fixed allocation bounded by ATS (203 = 80 + 60 + 40 + 23 unallocated)", () => {
    const result = channelAllocationEngine.validateAndSaveRules({
      sku: "SKU-NOVA-SAND-PNK",
      totalAts: 203,
      rules: [
        { channel: "AMAZON", fixedCap: 80, active: true },
        { channel: "FLIPKART", fixedCap: 60, active: true },
        { channel: "SHOPIFY", fixedCap: 40, active: true },
      ],
      actorId: "usr-amir",
      actorName: "Amir Patel",
    });

    expect(result.success).toBe(true);
    expect(result.totalAllocated).toBe(180);
    expect(result.unallocated).toBe(23);
    expect(result.event).toBeDefined();
    expect(result.event?.actorId).toBe("usr-amir");
  });

  // TEST 2: Over-allocation rejection (prevents fake stock creation)
  it("TEST 2: System rejects allocation exceeding available ATS (Amazon 150 + Flipkart 100 + Shopify 100 = 350 vs 203 ATS)", () => {
    const result = channelAllocationEngine.validateAndSaveRules({
      sku: "SKU-NOVA-SAND-PNK",
      totalAts: 203,
      rules: [
        { channel: "AMAZON", fixedCap: 150, active: true },
        { channel: "FLIPKART", fixedCap: 100, active: true },
        { channel: "SHOPIFY", fixedCap: 100, active: true },
      ],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Allocation exceeds available ATS by 147 units.");
  });

  // TEST 3: Allocation is strictly SKU/Variant specific
  it("TEST 3: Different variants of the same product maintain independent channel allocations", () => {
    channelAllocationEngine.validateAndSaveRules({
      sku: "SKU-NOVA-SAND-PNK",
      totalAts: 100,
      rules: [
        { channel: "AMAZON", fixedCap: 40, active: true },
        { channel: "FLIPKART", fixedCap: 20, active: true },
        { channel: "SHOPIFY", fixedCap: 10, active: true },
      ],
    });

    channelAllocationEngine.validateAndSaveRules({
      sku: "SKU-NOVA-SAND-BLU",
      totalAts: 50,
      rules: [
        { channel: "AMAZON", fixedCap: 25, active: true },
        { channel: "FLIPKART", fixedCap: 15, active: true },
        { channel: "SHOPIFY", fixedCap: 5, active: true },
      ],
    });

    const pinkRules = channelAllocationEngine.getRulesForSku("SKU-NOVA-SAND-PNK");
    const blueRules = channelAllocationEngine.getRulesForSku("SKU-NOVA-SAND-BLU");

    expect(pinkRules.find((r) => r.channel === "AMAZON")?.fixedCap).toBe(40);
    expect(blueRules.find((r) => r.channel === "AMAZON")?.fixedCap).toBe(25);
  });

  // TEST 4: Percentage-based allocation calculation
  it("TEST 4: Percentage allocation converts to discrete units without exceeding 100%", () => {
    const result = channelAllocationEngine.validateAndSaveRules({
      sku: "SKU-NOVA-SAND-PNK",
      totalAts: 200,
      rules: [
        { channel: "AMAZON", percentage: 40, active: true },
        { channel: "FLIPKART", percentage: 30, active: true },
        { channel: "SHOPIFY", percentage: 20, active: true },
      ],
    });

    expect(result.success).toBe(true);

    const alloc = channelAllocationEngine.calculateAllocations(sampleBalance, "growing");
    const amazon = alloc.allocations.find((a) => a.channel === "AMAZON");
    const flipkart = alloc.allocations.find((a) => a.channel === "FLIPKART");
    const shopify = alloc.allocations.find((a) => a.channel === "SHOPIFY");

    expect(amazon?.allocatedQty).toBe(81); // Math.floor(203 * 0.40)
    expect(flipkart?.allocatedQty).toBe(60); // Math.floor(203 * 0.30)
    expect(shopify?.allocatedQty).toBe(40); // Math.floor(203 * 0.20)
    expect(alloc.unallocatedQty).toBe(22);
  });

  // TEST 5: Negative allocation rejection
  it("TEST 5: System rejects negative allocation quantities", () => {
    const result = channelAllocationEngine.validateAndSaveRules({
      sku: "SKU-NOVA-SAND-PNK",
      totalAts: 100,
      rules: [{ channel: "AMAZON", fixedCap: -15, active: true }],
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("cannot be negative");
  });

  // TEST 6: Physical stock separation (Allocation does NOT mutate Storage balance)
  it("TEST 6: Configuring marketplace allocation leaves physical storage balance 100% untouched", () => {
    const initialAvailable = sampleBalance.available;

    channelAllocationEngine.validateAndSaveRules({
      sku: sampleBalance.sku,
      totalAts: sampleBalance.available,
      rules: [
        { channel: "AMAZON", fixedCap: 50, active: true },
        { channel: "FLIPKART", fixedCap: 30, active: true },
      ],
    });

    // Balance object is never mutated
    expect(sampleBalance.available).toBe(initialAvailable);
    expect(sampleBalance.reserved).toBe(0);
    expect(sampleBalance.damaged).toBe(0);
  });

  // TEST 7: Idempotent sync job creation
  it("TEST 7: Sync queue registers jobs idempotently without duplicate pushes", () => {
    const job1 = channelAllocationEngine.queueSync({
      sku: "SKU-NOVA-SAND-PNK",
      channel: "AMAZON",
      quantity: 80,
      idempotencyKey: "sync-event-101",
    });

    const job2 = channelAllocationEngine.queueSync({
      sku: "SKU-NOVA-SAND-PNK",
      channel: "AMAZON",
      quantity: 80,
      idempotencyKey: "sync-event-101",
    });

    expect(job1.queued).toBe(true);
    expect(job2.queued).toBe(false);
    expect(job2.reason).toContain("Duplicate marketplace sync event");
    expect(channelAllocationEngine.getPendingSyncJobs().length).toBe(1);
  });

  // TEST 8: Audit event log retention
  it("TEST 8: System retains full audit log of allocation changes", () => {
    channelAllocationEngine.validateAndSaveRules({
      sku: "SKU-AUDIT-001",
      totalAts: 100,
      rules: [{ channel: "AMAZON", fixedCap: 20, active: true }],
      actorId: "usr-suhel",
      actorName: "Suhel",
    });

    const logs = channelAllocationEngine.getAuditLog("SKU-AUDIT-001");
    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0]?.actorId).toBe("usr-suhel");
    expect(logs[0]?.totalAllocated).toBe(20);
    expect(logs[0]?.unallocated).toBe(80);
  });
});
