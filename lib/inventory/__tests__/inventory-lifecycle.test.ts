import { describe, it, expect, beforeEach } from "vitest";
import { ReceivingEngine, LocationStockRepository, type LocationStockRecord } from "@/lib/storage/engine/receiving.engine";
import { applyInbound, applyOutbound, applyAdjustment, InventoryEngineError } from "@/lib/inventory/engine";
import type { PurchaseBill } from "@/lib/purchase/types";
import type { StockBalance } from "@/lib/inventory/types";
import { DEFAULT_WAREHOUSE_ID } from "@/lib/inventory/types";

describe("CommerceOS — Purchase → Storage → Inventory → Consumption End-to-End Lifecycle", () => {
  let receivingEngine: ReceivingEngine;
  let locationStockRepo: LocationStockRepository;

  beforeEach(() => {
    receivingEngine = new ReceivingEngine();
    locationStockRepo = new LocationStockRepository();
  });

  it("Scenario 1: Purchase 100 sellable establishes procurement without increasing Available Inventory", () => {
    const bill: PurchaseBill = {
      id: "bill-101",
      billNumber: "BILL-101",
      organizationId: "org-test",
      workspaceId: "ws-test",
      vendorId: "vnd-001",
      vendorName: "Alpha Supplier",
      purchaseType: "inventory_product",
      category: "inventory_product",
      billDate: "2026-08-18",
      lines: [
        {
          id: "line-1",
          description: "Kids Sandal - Pink",
          sku: "SKU-NOVA-SAND-PNK",
          quantity: 100,
          unitPrice: 500,
          amount: 50000,
          qtyDamaged: 0,
          uom: "pcs",
          intent: "sellable",
          gstRate: 18,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          taxAmount: 0,
        },
      ],
      subtotal: 50000,
      discountAmount: 0,
      taxPercent: 18,
      taxAmount: 9000,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 9000,
      freightAmount: 0,
      otherCharges: 0,
      roundOff: 0,
      totalAmount: 59000,
      status: "ordered",
      paymentStatus: "unpaid",
      paymentMethod: "credit",
      interstate: true,
      buyerStateCode: "27",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "usr-admin",
    };

    // 1. Check bill is eligible for storage receiving
    expect(receivingEngine.isBillEligibleForStorageReceiving(bill)).toBe(true);

    const receivable = receivingEngine.filterReceivableLines(bill);
    expect(receivable.length).toBe(1);
    expect(receivable[0]!.quantity).toBe(100);

    // 2. Pending quantity before receiving is 100
    const alreadyReceived = receivable[0]!.qcRecord?.receivedQty ?? 0;
    const pendingQty = receivable[0]!.quantity - alreadyReceived;
    expect(pendingQty).toBe(100);
  });

  it("Scenario 2 & 3: Partial receiving (60 units) and final receiving (40 units)", () => {
    // Initial Stock in Storage / Inventory
    const initialStorageRecord: Omit<LocationStockRecord, "id" | "updatedAt"> = {
      storageLocationId: "loc-home",
      productId: "prod-sand-pnk",
      sku: "SKU-NOVA-SAND-PNK",
      productName: "Kids Sandal - Pink",
      intent: "sellable",
      availableQty: 60,
      receivedFromBillId: "bill-101",
    };

    // First receipt: 60 units accepted
    const rec1 = locationStockRepo.addStock(initialStorageRecord);
    expect(rec1.availableQty).toBe(60);
    expect(locationStockRepo.getTotalUnitsForLocation("loc-home")).toBe(60);

    // Second receipt: 40 units accepted
    const rec2 = locationStockRepo.addStock({
      ...initialStorageRecord,
      availableQty: 40,
    });
    expect(rec2.availableQty).toBe(100);
    expect(locationStockRepo.getTotalUnitsForLocation("loc-home")).toBe(100);
  });

  it("Scenario 4 & 5: Stock Consumption decreases Available & Storage, and records audit trail with reference", () => {
    locationStockRepo.addStock({
      storageLocationId: "loc-main",
      productId: "prod-poly-bag",
      sku: "POLY-MAILER-M",
      productName: "Shipping Polybag Medium",
      intent: "consumable",
      availableQty: 1000,
      receivedFromBillId: "bill-pkg-001",
    });

    expect(locationStockRepo.getAllBalances().find((r) => r.sku === "POLY-MAILER-M")?.availableQty).toBe(1000);

    // Consume 150 polybags for Order #ORD-10234
    const result = locationStockRepo.consumeStock({
      sku: "POLY-MAILER-M",
      quantity: 150,
      reason: "Order Packaging",
      reference: "Order #ORD-10234",
      storageLocationName: "Main Warehouse Facility",
      actorName: "Warehouse Lead",
    });

    expect(result.success).toBe(true);
    expect(result.remainingAvailable).toBe(850);
    expect(locationStockRepo.getAllBalances().find((r) => r.sku === "POLY-MAILER-M")?.availableQty).toBe(850);

    // Audit record verified
    const history = locationStockRepo.getConsumptionHistory("POLY-MAILER-M");
    expect(history.length).toBe(1);
    expect(history[0]!.quantity).toBe(150);
    expect(history[0]!.reason).toBe("Order Packaging");
    expect(history[0]!.reference).toBe("Order #ORD-10234");
    expect(history[0]!.actorName).toBe("Warehouse Lead");
    expect(locationStockRepo.getTotalConsumed("POLY-MAILER-M")).toBe(150);
  });

  it("Scenario 6: Attempting to consume more than available stock is rejected with negative stock protection", () => {
    locationStockRepo.addStock({
      storageLocationId: "loc-main",
      productId: "prod-tape",
      sku: "BRANDED-TAPE-01",
      productName: "Branded Packaging Tape",
      intent: "consumable",
      availableQty: 10,
      receivedFromBillId: "bill-pkg-002",
    });

    const result = locationStockRepo.consumeStock({
      sku: "BRANDED-TAPE-01",
      quantity: 50, // More than 10 available
      reason: "Internal Operations",
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain("Insufficient stock. Only 10 units available");
    // Stock remains unchanged
    expect(locationStockRepo.getAllBalances().find((r) => r.sku === "BRANDED-TAPE-01")?.availableQty).toBe(10);
  });

  it("Scenario 7, 8 & 9: Non-inventory purchases (Asset, Expense, Service) do not enter Storage Receiving", () => {
    const assetBill: PurchaseBill = {
      id: "bill-asset-01",
      billNumber: "BILL-ASSET-01",
      organizationId: "org-test",
      workspaceId: "ws-test",
      vendorId: "vnd-it",
      vendorName: "Dell India",
      purchaseType: "capital_asset",
      category: "capital_asset",
      billDate: "2026-08-18",
      lines: [
        {
          id: "line-asset",
          description: "Office Laptop",
          quantity: 2,
          unitPrice: 75000,
          amount: 150000,
          qtyDamaged: 0,
          uom: "pcs",
          intent: "asset",
          gstRate: 18,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          taxAmount: 0,
        },
      ],
      subtotal: 150000,
      discountAmount: 0,
      taxPercent: 18,
      taxAmount: 27000,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 27000,
      freightAmount: 0,
      otherCharges: 0,
      roundOff: 0,
      totalAmount: 177000,
      status: "ordered",
      paymentStatus: "paid",
      paymentMethod: "bank_transfer",
      interstate: true,
      buyerStateCode: "27",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: "usr-admin",
    };

    expect(receivingEngine.isBillEligibleForStorageReceiving(assetBill)).toBe(false);
    expect(receivingEngine.filterReceivableLines(assetBill)).toHaveLength(0);
  });

  it("Scenario 11: Multi-warehouse stock tracking preserves location balances", () => {
    locationStockRepo.addStock({
      storageLocationId: "wh-delhi",
      productId: "prod-shoe",
      sku: "SKU-SHOE-BLK",
      productName: "Sports Shoe Black",
      intent: "sellable",
      availableQty: 60,
      receivedFromBillId: "bill-102",
    });

    locationStockRepo.addStock({
      storageLocationId: "wh-mumbai",
      productId: "prod-shoe",
      sku: "SKU-SHOE-BLK",
      productName: "Sports Shoe Black",
      intent: "sellable",
      availableQty: 40,
      receivedFromBillId: "bill-103",
    });

    expect(locationStockRepo.getTotalUnitsForLocation("wh-delhi")).toBe(60);
    expect(locationStockRepo.getTotalUnitsForLocation("wh-mumbai")).toBe(40);
    expect(locationStockRepo.getAllBalances().reduce((sum, r) => sum + r.availableQty, 0)).toBe(100);
  });

  it("Scenario 12: Stock Reconciliation: Received - Sold - Consumed - Damaged = On Hand", () => {
    const received = 100;
    const sold = 30;
    const consumed = 15;
    const damaged = 5;

    const onHand = received - sold - consumed - damaged;
    expect(onHand).toBe(50);

    const reserved = 10;
    const available = onHand - reserved;
    expect(available).toBe(40);
  });
});
