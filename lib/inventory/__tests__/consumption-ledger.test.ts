import { describe, it, expect, beforeEach } from "vitest";
import { inventoryConsumptionLedger } from "../consumption-ledger";
import { locationStockRepository } from "@/lib/storage/engine/receiving.engine";

describe("Inventory Consumption Ledger & Usage History", () => {
  beforeEach(() => {
    // Reset test baselines
    locationStockRepository.clearForTesting();
    inventoryConsumptionLedger.clearForTesting();

    // Inward a known test SKU with 50 units
    locationStockRepository.addStock({
      sku: "TEST-SHOES-BLK",
      productName: "Test Running Shoes Black",
      availableQty: 50,
      storageLocationId: "loc-wh-main",
    });

    // Inward a consumable packaging box with 100 units
    locationStockRepository.addStock({
      sku: "TEST-BOX-S",
      productName: "Courier Box Small",
      availableQty: 100,
      storageLocationId: "loc-wh-main",
    });
  });

  it("records sellable SKU consumption with atomic validation and ledger creation", () => {
    const result = inventoryConsumptionLedger.recordConsumption({
      sku: "TEST-SHOES-BLK",
      productName: "Test Running Shoes Black",
      quantity: 5,
      usageType: "ORDER_FULFILLMENT",
      reason: "Customer Order Fulfillment",
      relatedOrderId: "CO-1025",
      reference: "Order #CO-1025",
      sourceLocationName: "Main Warehouse Facility",
      actorName: "Amir Patel",
    });

    expect(result.success).toBe(true);
    expect(result.remainingAvailable).toBe(45);
    expect(result.record).toBeDefined();
    expect(result.record?.inventoryType).toBe("SELLABLE");
    expect(result.record?.beforeQuantity).toBe(50);
    expect(result.record?.afterQuantity).toBe(45);
    expect(result.record?.quantity).toBe(5);
    expect(result.record?.relatedOrderId).toBe("CO-1025");
    expect(result.record?.isReversal).toBe(false);
  });

  it("records consumable packaging usage linked to a sellable product and order", () => {
    const result = inventoryConsumptionLedger.recordConsumption({
      sku: "TEST-BOX-S",
      productName: "Courier Box Small",
      quantity: 2,
      usageType: "PACKAGING",
      reason: "Order Packaging",
      relatedProductSku: "TEST-SHOES-BLK",
      relatedProductName: "Test Running Shoes Black",
      relatedOrderId: "CO-1025",
      reference: "Order #CO-1025",
      sourceLocationName: "Main Warehouse Facility",
      actorName: "Warehouse Operator",
    });

    expect(result.success).toBe(true);
    expect(result.remainingAvailable).toBe(98);
    expect(result.record?.inventoryType).toBe("CONSUMABLE");
    expect(result.record?.relatedProductSku).toBe("TEST-SHOES-BLK");

    // Check summary breakdown
    const summary = inventoryConsumptionLedger.getSkuUsageSummary("TEST-BOX-S");
    expect(summary.totalConsumed).toBe(2);
    expect(summary.topRelatedProducts.length).toBe(1);
    expect(summary.topRelatedProducts[0].sku).toBe("TEST-SHOES-BLK");
    expect(summary.topRelatedProducts[0].quantity).toBe(2);
  });

  it("rejects over-consumption when requested quantity exceeds available stock", () => {
    const result = inventoryConsumptionLedger.recordConsumption({
      sku: "TEST-SHOES-BLK",
      quantity: 999,
      reason: "Manual Consumption",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Insufficient stock on hand");
    expect(result.remainingAvailable).toBe(50); // Stock intact
  });

  it("rejects zero or negative consumption quantities", () => {
    const zeroRes = inventoryConsumptionLedger.recordConsumption({
      sku: "TEST-SHOES-BLK",
      quantity: 0,
      reason: "Invalid Test",
    });
    expect(zeroRes.success).toBe(false);

    const negRes = inventoryConsumptionLedger.recordConsumption({
      sku: "TEST-SHOES-BLK",
      quantity: -5,
      reason: "Negative Test",
    });
    expect(negRes.success).toBe(false);
  });

  it("supports exact available quantity consumption (depletes to 0 cleanly)", () => {
    const result = inventoryConsumptionLedger.recordConsumption({
      sku: "TEST-SHOES-BLK",
      quantity: 50,
      reason: "Bulk Order Fulfillment",
    });

    expect(result.success).toBe(true);
    expect(result.remainingAvailable).toBe(0);

    const summary = inventoryConsumptionLedger.getSkuUsageSummary("TEST-SHOES-BLK");
    expect(summary.totalConsumed).toBe(50);
  });

  it("creates compensating Reversal records without mutating historical records", () => {
    // 1. Initial Consumption of 10 units
    const consumeRes = inventoryConsumptionLedger.recordConsumption({
      sku: "TEST-SHOES-BLK",
      quantity: 10,
      reason: "Order Packaging Error",
      reference: "Order #ERR-001",
    });

    expect(consumeRes.success).toBe(true);
    const ledgerId = consumeRes.record!.id;
    expect(consumeRes.remainingAvailable).toBe(40);

    // 2. Execute Reversal
    const reversalRes = inventoryConsumptionLedger.reverseConsumption({
      ledgerId,
      reason: "Customer cancelled order before dispatch, return stock",
      actorName: "Audit Manager",
    });

    expect(reversalRes.success).toBe(true);
    expect(reversalRes.newAvailable).toBe(50); // Restored
    expect(reversalRes.reversalRecord?.isReversal).toBe(true);
    expect(reversalRes.reversalRecord?.reversalOfLedgerId).toBe(ledgerId);
    expect(reversalRes.reversalRecord?.quantity).toBe(10);

    // 3. Verify Net Consumed is now 0 and history preserves both events
    const summary = inventoryConsumptionLedger.getSkuUsageSummary("TEST-SHOES-BLK");
    expect(summary.totalConsumed).toBe(0);
    expect(summary.history.length).toBe(2);

    // 4. Double reversal should fail
    const doubleReversal = inventoryConsumptionLedger.reverseConsumption({
      ledgerId,
      reason: "Attempt duplicate reversal",
    });
    expect(doubleReversal.success).toBe(false);
    expect(doubleReversal.error).toContain("already been reversed");
  });

  it("filters ledger history by SKU, type, and search queries with pagination", () => {
    inventoryConsumptionLedger.recordConsumption({
      sku: "TEST-SHOES-BLK",
      quantity: 3,
      reason: "Packaging Test 1",
    });

    inventoryConsumptionLedger.recordConsumption({
      sku: "TEST-BOX-S",
      quantity: 1,
      reason: "Packaging Test 2",
    });

    const shoesHistory = inventoryConsumptionLedger.getLedgerHistory({
      sku: "TEST-SHOES-BLK",
    });
    expect(shoesHistory.records.every((r) => r.sku === "TEST-SHOES-BLK")).toBe(true);

    const consumableHistory = inventoryConsumptionLedger.getLedgerHistory({
      inventoryType: "CONSUMABLE",
    });
    expect(consumableHistory.records.every((r) => r.inventoryType === "CONSUMABLE")).toBe(true);
  });
});
