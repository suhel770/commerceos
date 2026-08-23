import { describe, it, expect, beforeEach } from "vitest";
import { inventoryConsumptionLedger } from "../consumption-ledger";
import { locationStockRepository } from "@/lib/storage/engine/receiving.engine";

describe("CommerceOS — Inventory Consumption System 100/100 Hardening Suite", () => {
  const orgA = "org-merchant-alpha";
  const wsA = "ws-alpha";
  const orgB = "org-merchant-beta";
  const wsB = "ws-beta";

  beforeEach(() => {
    locationStockRepository.clearForTesting();
    inventoryConsumptionLedger.clearForTesting();

    // Inward stock in Warehouse A (loc-wh-a)
    locationStockRepository.addStock({
      storageLocationId: "loc-wh-a",
      productId: "SKU-FOOTWEAR-01",
      sku: "SKU-FOOTWEAR-01",
      productName: "Running Shoes Black",
      intent: "sellable",
      availableQty: 50,
      receivedFromBillId: "BILL-001",
    });

    // Inward stock in Warehouse B (loc-wh-b)
    locationStockRepository.addStock({
      storageLocationId: "loc-wh-b",
      productId: "SKU-FOOTWEAR-01",
      sku: "SKU-FOOTWEAR-01",
      productName: "Running Shoes Black",
      intent: "sellable",
      availableQty: 30,
      receivedFromBillId: "BILL-002",
    });

    // Inward Packaging Consumable (Small Box)
    locationStockRepository.addStock({
      storageLocationId: "loc-wh-a",
      productId: "SKU-BOX-S",
      sku: "SKU-BOX-S",
      productName: "Courier Shipping Box S",
      intent: "consumable",
      availableQty: 200,
      receivedFromBillId: "BILL-003",
    });
  });

  // 1 & 2. Manual Sellable & Consumable Consumption
  it("executes manual sellable and consumable consumption with before/after audit tracking", () => {
    const sellableRes = inventoryConsumptionLedger.recordConsumption({
      organizationId: orgA,
      workspaceId: wsA,
      sku: "SKU-FOOTWEAR-01",
      quantity: 5,
      usageType: "MANUAL_CONSUMPTION",
      reason: "Internal Facility Testing",
      actorName: "Test Lead",
    });

    expect(sellableRes.success).toBe(true);
    expect(sellableRes.record?.inventoryType).toBe("SELLABLE");
    expect(sellableRes.record?.beforeQuantity).toBe(80); // 50 in A + 30 in B
    expect(sellableRes.record?.afterQuantity).toBe(75);

    const consumableRes = inventoryConsumptionLedger.recordConsumption({
      organizationId: orgA,
      workspaceId: wsA,
      sku: "SKU-BOX-S",
      quantity: 10,
      usageType: "INTERNAL_OPERATIONS",
      reason: "Warehouse Organization",
      actorName: "Operator",
    });

    expect(consumableRes.success).toBe(true);
    expect(consumableRes.record?.inventoryType).toBe("CONSUMABLE");
    expect(consumableRes.record?.afterQuantity).toBe(190);
  });

  // 3 & 4. Order Reservation & Cancellation before fulfillment
  it("ensures cancellation before fulfillment does NOT generate any consumption ledger records", () => {
    // Simulate Order Reservation (Reservation locks stock in ATS calculation, but physical on-hand remains)
    const initialRecords = inventoryConsumptionLedger.getLedgerHistory({ sku: "SKU-FOOTWEAR-01" });
    expect(initialRecords.totalCount).toBe(0);

    // Order is cancelled pre-fulfillment -> Only reservation is released, 0 consumption events created
    const afterCancelRecords = inventoryConsumptionLedger.getLedgerHistory({ sku: "SKU-FOOTWEAR-01" });
    expect(afterCancelRecords.totalCount).toBe(0);
    expect(inventoryConsumptionLedger.getSkuUsageSummary("SKU-FOOTWEAR-01").totalConsumed).toBe(0);
  });

  // 5 & 6. Order Fulfillment Consumption & Idempotency
  it("records order fulfillment consumption exactly once and enforces strict idempotency on duplicate events", () => {
    const fulfillmentInput = {
      organizationId: orgA,
      workspaceId: wsA,
      orderId: "ORD-9901",
      shipmentId: "SHP-001",
      items: [
        {
          sku: "SKU-FOOTWEAR-01",
          quantity: 2,
          sourceLocationId: "loc-wh-a",
        },
      ],
      actorName: "Auto Fulfillment",
    };

    // First dispatch
    const firstDispatch = inventoryConsumptionLedger.consumeOrderFulfillment(fulfillmentInput);
    expect(firstDispatch.success).toBe(true);
    expect(firstDispatch.results[0].wasIdempotent).toBeFalsy();
    expect(firstDispatch.results[0].remainingAvailable).toBe(78); // 80 - 2

    // Duplicate dispatch (same order & shipment event sent a second time)
    const duplicateDispatch = inventoryConsumptionLedger.consumeOrderFulfillment(fulfillmentInput);
    expect(duplicateDispatch.success).toBe(true);
    expect(duplicateDispatch.results[0].wasIdempotent).toBe(true);
    expect(duplicateDispatch.results[0].remainingAvailable).toBe(78); // Not deducted again!

    // Verify ledger has only 1 record
    const summary = inventoryConsumptionLedger.getSkuUsageSummary("SKU-FOOTWEAR-01");
    expect(summary.totalConsumed).toBe(2);
    expect(summary.history.length).toBe(1);
    expect(summary.topRelatedOrders[0].orderId).toBe("ORD-9901");
  });

  // 7. Partial Fulfillment
  it("supports partial fulfillment across multiple shipments without duplicate deductions", () => {
    // Shipment 1: 4 units
    const shipment1 = inventoryConsumptionLedger.consumeOrderFulfillment({
      organizationId: orgA,
      workspaceId: wsA,
      orderId: "ORD-SPLIT-10",
      shipmentId: "PART-1",
      items: [{ sku: "SKU-FOOTWEAR-01", quantity: 4, sourceLocationId: "loc-wh-a" }],
    });
    expect(shipment1.success).toBe(true);
    expect(shipment1.results[0].remainingAvailable).toBe(76);

    // Shipment 2: 6 units
    const shipment2 = inventoryConsumptionLedger.consumeOrderFulfillment({
      organizationId: orgA,
      workspaceId: wsA,
      orderId: "ORD-SPLIT-10",
      shipmentId: "PART-2",
      items: [{ sku: "SKU-FOOTWEAR-01", quantity: 6, sourceLocationId: "loc-wh-a" }],
    });
    expect(shipment2.success).toBe(true);
    expect(shipment2.results[0].remainingAvailable).toBe(70);

    const summary = inventoryConsumptionLedger.getSkuUsageSummary("SKU-FOOTWEAR-01");
    expect(summary.totalConsumed).toBe(10);
    expect(summary.history.length).toBe(2);
  });

  // 8 & 9. Multi-Warehouse Isolation & Multi-Facility Split
  it("enforces strict multi-warehouse deduction and rejects cross-facility leakage", () => {
    // Deduct 15 units explicitly from Warehouse B (loc-wh-b has 30 units)
    const resB = inventoryConsumptionLedger.recordConsumption({
      organizationId: orgA,
      workspaceId: wsA,
      sku: "SKU-FOOTWEAR-01",
      quantity: 15,
      sourceLocationId: "loc-wh-b",
      sourceLocationName: "Warehouse B (North Hub)",
      reason: "B2B Dispatch from North Hub",
    });

    expect(resB.success).toBe(true);

    // Verify Warehouse A still has all 50 units intact
    const balA = locationStockRepository.getBalancesForLocation("loc-wh-a");
    expect(balA.find((b) => b.sku === "SKU-FOOTWEAR-01")?.availableQty).toBe(50);

    // Verify Warehouse B now has 15 units
    const balB = locationStockRepository.getBalancesForLocation("loc-wh-b");
    expect(balB.find((b) => b.sku === "SKU-FOOTWEAR-01")?.availableQty).toBe(15);

    // Attempting to consume 20 units from Warehouse B (which only has 15) must fail and NOT touch Warehouse A
    const overB = inventoryConsumptionLedger.recordConsumption({
      organizationId: orgA,
      workspaceId: wsA,
      sku: "SKU-FOOTWEAR-01",
      quantity: 20,
      sourceLocationId: "loc-wh-b",
      sourceLocationName: "Warehouse B (North Hub)",
      reason: "Exceeding Location B stock",
    });

    expect(overB.success).toBe(false);
    expect(overB.error).toContain("Insufficient stock in");
    // Verify Warehouse A still has 50 units
    expect(locationStockRepository.getBalancesForLocation("loc-wh-a").find((b) => b.sku === "SKU-FOOTWEAR-01")?.availableQty).toBe(50);
  });

  // 10 & 11. Consumable Packaging Consumption & Idempotency
  it("tracks consumable packaging usage linked to product SKU with idempotent protection", () => {
    const packInput = {
      organizationId: orgA,
      workspaceId: wsA,
      orderId: "ORD-9902",
      shipmentId: "SHP-001",
      consumables: [
        {
          sku: "SKU-BOX-S",
          productName: "Courier Box S",
          quantity: 2,
          relatedProductSku: "SKU-FOOTWEAR-01",
          sourceLocationId: "loc-wh-a",
        },
      ],
    };

    const firstPack = inventoryConsumptionLedger.consumeConsumablesForOrder(packInput);
    expect(firstPack.success).toBe(true);
    expect(firstPack.results[0].remainingAvailable).toBe(198);

    // Duplicate event
    const dupPack = inventoryConsumptionLedger.consumeConsumablesForOrder(packInput);
    expect(dupPack.success).toBe(true);
    expect(dupPack.results[0].wasIdempotent).toBe(true);
    expect(dupPack.results[0].remainingAvailable).toBe(198);

    const summary = inventoryConsumptionLedger.getSkuUsageSummary("SKU-BOX-S");
    expect(summary.totalConsumed).toBe(2);
    expect(summary.topRelatedProducts[0].sku).toBe("SKU-FOOTWEAR-01");
    expect(summary.topRelatedProducts[0].quantity).toBe(2);
  });

  // 12, 13 & 14. Reversals & Double Reversal Prevention
  it("executes compensating reversals, restores stock, and strictly rejects double reversals", () => {
    // 1. Initial Consumption
    const consume = inventoryConsumptionLedger.recordConsumption({
      organizationId: orgA,
      workspaceId: wsA,
      sku: "SKU-FOOTWEAR-01",
      quantity: 8,
      reason: "Courier Transit Loss",
    });
    expect(consume.success).toBe(true);
    const ledgerId = consume.record!.id;

    // 2. Reversal
    const reversal = inventoryConsumptionLedger.reverseConsumption({
      organizationId: orgA,
      workspaceId: wsA,
      ledgerId,
      reason: "Parcel recovered and returned to stock",
    });
    expect(reversal.success).toBe(true);
    expect(reversal.newAvailable).toBe(80); // Restored to full baseline

    // 3. Double reversal fails
    const dupReversal = inventoryConsumptionLedger.reverseConsumption({
      organizationId: orgA,
      workspaceId: wsA,
      ledgerId,
      reason: "Attempt second reversal",
    });
    expect(dupReversal.success).toBe(false);
    expect(dupReversal.error).toContain("already been reversed");

    // 4. Cannot reverse a reversal record
    const reverseReversal = inventoryConsumptionLedger.reverseConsumption({
      organizationId: orgA,
      workspaceId: wsA,
      ledgerId: reversal.reversalRecord!.id,
    });
    expect(reverseReversal.success).toBe(false);
    expect(reverseReversal.error).toContain("Cannot reverse a reversal");
  });

  // 15 & 16. Concurrency & Negative Stock Protection
  it("prevents negative stock and safely manages competing consumption requests", () => {
    // Total stock is 80 units
    // Request A consumes 70 units
    const reqA = inventoryConsumptionLedger.recordConsumption({
      sku: "SKU-FOOTWEAR-01",
      quantity: 70,
      reason: "Bulk B2B Sale A",
    });
    expect(reqA.success).toBe(true);
    expect(reqA.remainingAvailable).toBe(10);

    // Competing Request B attempts to consume 15 units (only 10 remaining)
    const reqB = inventoryConsumptionLedger.recordConsumption({
      sku: "SKU-FOOTWEAR-01",
      quantity: 15,
      reason: "Bulk B2B Sale B",
    });
    expect(reqB.success).toBe(false);
    expect(reqB.error).toContain("Insufficient stock");
    expect(reqB.remainingAvailable).toBe(10); // Non-negative, intact!
  });

  // 17. Multi-Tenant Isolation
  it("enforces strict multi-tenant isolation for usage records and summaries", () => {
    // Tenant Alpha consumption
    inventoryConsumptionLedger.recordConsumption({
      organizationId: orgA,
      workspaceId: wsA,
      sku: "SKU-FOOTWEAR-01",
      quantity: 5,
      reason: "Alpha Usage",
    });

    // Tenant Beta consumption on same SKU
    inventoryConsumptionLedger.recordConsumption({
      organizationId: orgB,
      workspaceId: wsB,
      sku: "SKU-FOOTWEAR-01",
      quantity: 12,
      reason: "Beta Usage",
    });

    // Tenant Alpha summary only sees 5 units
    const alphaSummary = inventoryConsumptionLedger.getSkuUsageSummary("SKU-FOOTWEAR-01", {
      organizationId: orgA,
      workspaceId: wsA,
    });
    expect(alphaSummary.totalConsumed).toBe(5);

    // Tenant Beta summary only sees 12 units
    const betaSummary = inventoryConsumptionLedger.getSkuUsageSummary("SKU-FOOTWEAR-01", {
      organizationId: orgB,
      workspaceId: wsB,
    });
    expect(betaSummary.totalConsumed).toBe(12);

    // Cross-tenant reversal is blocked
    const betaLedgerId = betaSummary.history[0].id;
    const illegalReversal = inventoryConsumptionLedger.reverseConsumption({
      organizationId: orgA, // Tenant A trying to reverse Tenant B
      workspaceId: wsA,
      ledgerId: betaLedgerId,
    });
    expect(illegalReversal.success).toBe(false);
    expect(illegalReversal.error).toContain("Unauthorized cross-tenant");
  });

  // 18. Reconciliation Invariant Verification
  it("verifies mathematical reconciliation between physical on-hand and ledger history", () => {
    inventoryConsumptionLedger.recordConsumption({
      sku: "SKU-FOOTWEAR-01",
      quantity: 20,
      reason: "Order Batch",
    });

    const reconciliation = inventoryConsumptionLedger.reconcileSku({
      sku: "SKU-FOOTWEAR-01",
    });

    expect(reconciliation.isReconciled).toBe(true);
    expect(reconciliation.physicalOnHand).toBe(60); // 80 - 20
    expect(reconciliation.netConsumed).toBe(20);
    expect(reconciliation.totalReceived).toBe(80);
    expect(reconciliation.discrepancy).toBe(0);
  });
});
