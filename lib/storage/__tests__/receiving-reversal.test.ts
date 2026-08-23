import { describe, it, expect } from "vitest";
import { isInternalLocationType, isExternalFulfillmentType, getStorageLocationScope } from "../domain/types";
import { LocationStockRepository } from "../engine/receiving.engine";

describe("Internal vs External Storage Location Classification", () => {
  it("correctly identifies internal physical storage location types", () => {
    expect(isInternalLocationType("home_storage")).toBe(true);
    expect(isInternalLocationType("warehouse")).toBe(true);
    expect(isInternalLocationType("factory")).toBe(true);
    expect(isInternalLocationType("retail_store")).toBe(true);
    expect(isInternalLocationType("returns_area")).toBe(true);
    expect(isInternalLocationType("temporary_storage")).toBe(true);
    expect(isInternalLocationType("custom")).toBe(true);

    expect(isInternalLocationType("amazon_fba")).toBe(false);
    expect(isInternalLocationType("flipkart_fulfillment")).toBe(false);
    expect(isInternalLocationType("3pl")).toBe(false);
  });

  it("correctly identifies external fulfillment location types", () => {
    expect(isExternalFulfillmentType("amazon_fba")).toBe(true);
    expect(isExternalFulfillmentType("flipkart_fulfillment")).toBe(true);
    expect(isExternalFulfillmentType("3pl")).toBe(true);
    expect(isExternalFulfillmentType("transit")).toBe(true);

    expect(isExternalFulfillmentType("warehouse")).toBe(false);
    expect(isExternalFulfillmentType("home_storage")).toBe(false);
  });

  it("maps location types to the right scope", () => {
    expect(getStorageLocationScope("warehouse")).toBe("internal");
    expect(getStorageLocationScope("home_storage")).toBe("internal");
    expect(getStorageLocationScope("amazon_fba")).toBe("external_fulfillment");
    expect(getStorageLocationScope("flipkart_fulfillment")).toBe("external_fulfillment");
    expect(getStorageLocationScope("3pl")).toBe("external_fulfillment");
  });
});

describe("LocationStockRepository Receiving Reversal and Invariant Protection", () => {
  it("successfully adds stock and allows full reversal", () => {
    const repo = new LocationStockRepository();
    
    // Add 100 units
    repo.addStock({
      storageLocationId: "loc-wh-1",
      productId: "prod-test-sku",
      sku: "SKU-TEST-REV-001",
      productName: "Test Product",
      intent: "sellable",
      availableQty: 100,
      receivedFromBillId: "BILL-1001",
    });

    const balancesBefore = repo.getAllBalances().filter(b => b.sku === "SKU-TEST-REV-001");
    expect(balancesBefore[0]?.availableQty).toBe(100);

    // Full Reversal of 100 units
    const revResult = repo.reverseStock({
      sku: "SKU-TEST-REV-001",
      quantity: 100,
      storageLocationId: "loc-wh-1",
    });

    expect(revResult.success).toBe(true);
    expect(revResult.remainingAvailable).toBe(0);
  });

  it("allows partial reversal of received stock", () => {
    const repo = new LocationStockRepository();
    
    repo.addStock({
      storageLocationId: "loc-wh-2",
      productId: "prod-test-sku-2",
      sku: "SKU-TEST-REV-002",
      productName: "Test Product 2",
      intent: "sellable",
      availableQty: 100,
      receivedFromBillId: "BILL-1002",
    });

    // Partial reversal: reverse 20 units
    const revResult = repo.reverseStock({
      sku: "SKU-TEST-REV-002",
      quantity: 20,
      storageLocationId: "loc-wh-2",
    });

    expect(revResult.success).toBe(true);
    expect(revResult.remainingAvailable).toBe(80);
  });

  it("blocks reversal when units have already been consumed", () => {
    const repo = new LocationStockRepository();
    
    repo.addStock({
      storageLocationId: "loc-wh-3",
      productId: "prod-test-sku-3",
      sku: "SKU-TEST-REV-003",
      productName: "Test Product 3",
      intent: "sellable",
      availableQty: 100,
      receivedFromBillId: "BILL-1003",
    });

    // Consume 30 units
    const consumeRes = repo.consumeStock({
      sku: "SKU-TEST-REV-003",
      quantity: 30,
      reason: "Order Packaging",
      storageLocationId: "loc-wh-3",
    });
    expect(consumeRes.success).toBe(true);
    expect(consumeRes.remainingAvailable).toBe(70);

    // Attempt to reverse 100 units (must be blocked because only 70 units remain)
    const revResult = repo.reverseStock({
      sku: "SKU-TEST-REV-003",
      quantity: 100,
      storageLocationId: "loc-wh-3",
    });

    expect(revResult.success).toBe(false);
    expect(revResult.error).toContain("Insufficient stock to reverse");
    expect(revResult.remainingAvailable).toBe(70);
  });
});
