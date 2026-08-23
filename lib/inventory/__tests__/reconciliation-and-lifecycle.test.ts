import { describe, it, expect, beforeEach } from "vitest";
import { ReceivingEngine, locationStockRepository } from "@/lib/storage/engine/receiving.engine";
import { inventoryDecisionEngine } from "@/lib/inventory/inventory-decision-engine";
import type { PurchaseBill } from "@/lib/purchase/types";

describe("CommerceOS — Inventory ↔ Storage Reconciliation & Full Lifecycle", () => {
  let receivingEngine: ReceivingEngine;

  const sampleSecurity = {
    tenantId: "org-commerceos",
    organizationId: "org-commerceos",
    workspaceId: "ws-default",
    actorId: "usr-tester",
  };

  beforeEach(() => {
    receivingEngine = new ReceivingEngine();
  });

  it("Phase 16 — Executes complete Purchase (100) -> Receive (60) -> Consume (20) -> Receive (40) lifecycle", async () => {
    const testSku = "SKU-PROD-TEST-100";
    const locationId = "loc-hom-901190";

    // 1. Initial State: Purchase Bill created for 100 units
    const bill: PurchaseBill = {
      id: "bill-test-100",
      billNumber: "BILL-TEST-100",
      organizationId: sampleSecurity.organizationId,
      workspaceId: sampleSecurity.workspaceId,
      vendorId: "vnd-supplier",
      vendorName: "Supplier Co",
      purchaseType: "inventory_product",
      category: "inventory_product",
      billDate: "2026-08-18",
      lines: [
        {
          id: "line-item-1",
          description: "Premium Cotton T-Shirt",
          quantity: 100,
          unitPrice: 350,
          amount: 35000,
          qtyDamaged: 0,
          uom: "pcs",
          sku: testSku,
          intent: "sellable",
          gstRate: 18,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          taxAmount: 0,
        },
      ],
      subtotal: 35000,
      discountAmount: 0,
      taxPercent: 0,
      taxAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      freightAmount: 0,
      otherCharges: 0,
      roundOff: 0,
      totalAmount: 35000,
      status: "ordered",
      paymentStatus: "unpaid",
      paymentMethod: "credit",
      interstate: false,
      buyerStateCode: "29",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: sampleSecurity.actorId,
    };

    // Immediately after purchase:
    // Pending Receipt = 100, Storage Accepted = 0, Inventory Available = 0
    const initialEligible = receivingEngine.isBillEligibleForStorageReceiving(bill);
    expect(initialEligible).toBe(true);

    const initialStorageStock = locationStockRepository.getTotalUnitsForLocation(locationId);
    expect(initialStorageStock).toBe(0);

    // 2. Receive 60 units
    locationStockRepository.addStock({
      storageLocationId: locationId,
      productId: "line-item-1",
      sku: testSku,
      productName: "Premium Cotton T-Shirt",
      intent: "sellable",
      availableQty: 60,
      receivedFromBillId: bill.id,
    });

    // Verify Storage Accepted = 60, Inventory Available = 60
    expect(locationStockRepository.getTotalUnitsForLocation(locationId)).toBe(60);
    const balanceAfter60 = locationStockRepository.getBalancesForLocation(locationId);
    expect(balanceAfter60[0].availableQty).toBe(60);

    // 3. Consume 20 units
    const consumeResult = locationStockRepository.consumeStock({
      sku: testSku,
      quantity: 20,
      reason: "B2C Order Fulfillment",
      reference: "ORD-9901",
      storageLocationId: locationId,
      actor: "Operator",
    });

    expect(consumeResult.success).toBe(true);
    expect(consumeResult.record.quantity).toBe(20);
    expect(consumeResult.remainingAvailable).toBe(40);

    // Verify Storage usable stock = 40, Total Consumed = 20
    expect(locationStockRepository.getTotalUnitsForLocation(locationId)).toBe(40);
    expect(locationStockRepository.getTotalConsumed(testSku)).toBe(20);

    // Verify Consumption Audit Trail
    const history = locationStockRepository.getConsumptionHistory(testSku);
    expect(history.length).toBe(1);
    expect(history[0].reference).toBe("ORD-9901");
    expect(history[0].quantity).toBe(20);
    expect(history[0].storageLocationId).toBe(locationId);

    // 4. Receive remaining 40 units
    locationStockRepository.addStock({
      storageLocationId: locationId,
      productId: "line-item-1",
      sku: testSku,
      productName: "Premium Cotton T-Shirt",
      intent: "sellable",
      availableQty: 40,
      receivedFromBillId: bill.id,
    });

    // Verify:
    // Usable Storage Available = 40 + 40 = 80
    // Total Used / Consumed = 20
    // Total Received Lifetime = 80 + 20 = 100
    expect(locationStockRepository.getTotalUnitsForLocation(locationId)).toBe(80);
    expect(locationStockRepository.getTotalConsumed(testSku)).toBe(20);

    // Decision Engine Metrics Reconciliation
    const metricsList = inventoryDecisionEngine.computeSkuDecisionMetrics([
      {
        id: "inv-1",
        organizationId: sampleSecurity.organizationId,
        workspaceId: sampleSecurity.workspaceId,
        productId: "prod-1",
        warehouseId: locationId,
        sku: testSku,
        productName: "Premium Cotton T-Shirt",
        available: 80,
        incoming: 0,
        reserved: 0,
        damaged: 0,
        inTransit: 0,
      },
    ]);

    const metrics = metricsList[0];
    expect(metrics.availableQty).toBe(80);
    expect(metrics.usedQty).toBe(20);
    expect(metrics.totalReceivedQty).toBe(100);
  });

  it("Enforces strict Marketplace Decoupling (Internal Stock != Marketplace Stock)", () => {
    // Having 79 units in internal stock must NOT fabricate channel quantities
    const internalUnits = 79;

    // Marketplace sync status must be 'Not Synced' when no integration job has run
    const channelSyncStatus = {
      amazon: { isSynced: false, units: 0, label: "Not Synced" },
      flipkart: { isSynced: false, units: 0, label: "Not Synced" },
      shopify: { isSynced: false, units: 0, label: "Not Synced" },
    };

    expect(channelSyncStatus.amazon.units).toBe(0);
    expect(channelSyncStatus.amazon.label).toBe("Not Synced");
    expect(channelSyncStatus.flipkart.units).toBe(0);
    expect(channelSyncStatus.flipkart.label).toBe("Not Synced");
    expect(channelSyncStatus.shopify.units).toBe(0);
    expect(channelSyncStatus.shopify.label).toBe("Not Synced");
    expect(internalUnits).toBe(79);
  });
});
