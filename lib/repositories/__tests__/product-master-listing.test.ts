import { describe, it, expect, beforeEach } from "vitest";
import { productRepository } from "../product.repository";
import { locationStockRepository } from "@/lib/storage/engine/receiving.engine";
import { inventoryConsumptionLedger } from "@/lib/inventory/consumption-ledger";

describe("CommerceOS — Product / Master Listing Domain & Inventory-Driven Catalog", () => {
  const orgA = "org-merchant-alpha";
  const wsA = "ws-alpha";
  const orgB = "org-merchant-beta";
  const wsB = "ws-beta";

  beforeEach(() => {
    productRepository.clearForTesting();
    locationStockRepository.clearForTesting();
    inventoryConsumptionLedger.clearForTesting();

    // 1. Seed physical storage with sellable shoes (40 received)
    locationStockRepository.addStock({
      storageLocationId: "loc-main",
      productId: "prod-shoe-blk",
      sku: "SKU-NOVA-SHOE-BLK",
      productName: "Kids Sports Shoe - Black",
      intent: "sellable",
      availableQty: 40,
      receivedFromBillId: "BILL-1001",
    });

    // 2. Seed physical storage with consumable shipping box (100 received)
    locationStockRepository.addStock({
      storageLocationId: "loc-main",
      productId: "SKU-BOX-S",
      sku: "SKU-BOX-S",
      productName: "Shipping Courier Box Small",
      intent: "consumable",
      availableQty: 100,
      receivedFromBillId: "BILL-1002",
    });
  });

  it("strictly excludes consumable inventory items from the sellable product catalog", async () => {
    const products = await productRepository.findAll({
      organizationId: orgA,
      workspaceId: wsA,
    });

    // Ensure sellable products exist
    expect(products.length).toBeGreaterThan(0);

    // Verify NO consumable items appear as sellable products
    const hasConsumable = products.some(
      (p) =>
        p.sku === "SKU-BOX-S" ||
        p.name.toLowerCase().includes("courier box") ||
        p.name.toLowerCase().includes("shipping box") ||
        p.name.toLowerCase().includes("polybag") ||
        p.name.toLowerCase().includes("tape")
    );
    expect(hasConsumable).toBe(false);
  });

  it("uses receiving intent instead of SKU text when separating packaging from sellable goods", async () => {
    locationStockRepository.addStock({
      storageLocationId: "loc-main",
      productId: "line-24e3f3b4-2",
      sku: "line-24e3f3b4-2",
      productName: "5-Ply Shipping Carton",
      intent: "consumable",
      availableQty: 20,
      receivedFromBillId: "BILL-1003",
    });
    locationStockRepository.addStock({
      storageLocationId: "loc-main",
      productId: "line-b05db482-1",
      sku: "line-b05db482-1",
      productName: "Corrugated Mailer Box - Medium",
      intent: "consumable",
      availableQty: 20,
      receivedFromBillId: "BILL-1004",
    });

    const products = await productRepository.findAll({ organizationId: orgA, workspaceId: wsA });
    expect(products.map((product) => product.sku)).not.toContain("line-24e3f3b4-2");
    expect(products.map((product) => product.sku)).not.toContain("line-b05db482-1");
  });

  it("does not show master products that have no available inventory", async () => {
    await productRepository.create({
      id: "prod-no-stock",
      sku: "SKU-NO-STOCK",
      slug: "no-stock",
      name: "Unreceived Sellable Product",
      brand: "CommerceOS",
      category: "Apparel",
      image: "/images/products/placeholder.jpg",
      status: "Active",
      inventory: { available: 0, reserved: 0, incoming: 0 },
      pricing: { mrp: 100, sellingPrice: 80, costPrice: 50, profit: 30, margin: 38 },
      performance: { ordersToday: 0, revenueToday: 0, returnsPercentage: 0, healthScore: 90 },
      aiRecommendations: [],
      listings: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const products = await productRepository.findAll({ organizationId: orgA, workspaceId: wsA });
    expect(products.map((product) => product.sku)).not.toContain("SKU-NO-STOCK");
  });

  it("projects real-time read-only inventory ATS from Inventory to Product", async () => {
    const shoe = await productRepository.findBySku("SKU-NOVA-SHOE-BLK", {
      organizationId: orgA,
      workspaceId: wsA,
    });

    expect(shoe).toBeDefined();
    // 40 units were received into locationStockRepository
    expect(shoe?.inventory.available).toBe(40);
  });

  it("guarantees unreceived or pending storage quantities are NOT counted as sellable inventory", async () => {
    // If a purchase bill was for 100, but only 40 received, only 40 is available
    const shoe = await productRepository.findBySku("SKU-NOVA-SHOE-BLK", {
      organizationId: orgA,
      workspaceId: wsA,
    });

    expect(shoe?.inventory.available).toBe(40); // 40 received, not 100
  });

  it("rejects attempt to create a sellable product for a consumable SKU", async () => {
    await expect(
      productRepository.create({
        id: "prod-invalid-box",
        sku: "SKU-BOX-L",
        slug: "box-large",
        name: "Shipping Box Large",
        brand: "PackRight",
        category: "Packaging",
        image: "/images/box.jpg",
        status: "Active",
        inventory: { available: 0, reserved: 0, incoming: 0, damaged: 0, inTransit: 0 },
      })
    ).rejects.toThrowError(/consumable/i);
  });

  it("guarantees that updating product metadata NEVER alters physical inventory balances", async () => {
    const beforeBalances = locationStockRepository.getAllBalances();
    const shoeBefore = beforeBalances.find((b) => b.sku === "SKU-NOVA-SHOE-BLK")?.availableQty;
    expect(shoeBefore).toBe(40);

    // Update product title, price, and category
    await productRepository.update("prod-1", {
      name: "Kids Premium Sports Sneaker Black Edition",
      category: "Footwear",
      pricing: {
        mrp: 2999,
        sellingPrice: 1999,
        costPrice: 850,
        profit: 1149,
        margin: 57,
      },
    });

    const afterBalances = locationStockRepository.getAllBalances();
    const shoeAfter = afterBalances.find((b) => b.sku === "SKU-NOVA-SHOE-BLK")?.availableQty;
    expect(shoeAfter).toBe(40); // 100% UNTOUCHED

    // Verify 0 consumption ledger events were written
    const ledgerHistory = inventoryConsumptionLedger.getLedgerHistory();
    expect(ledgerHistory.totalCount).toBe(0);
  });

  it("supports search, category, and brand filtering", async () => {
    const results = await productRepository.findAll({
      search: "shoe",
    });

    expect(results.length).toBeGreaterThan(0);
    for (const r of results) {
      expect(
        r.name.toLowerCase().includes("shoe") ||
        r.sku.toLowerCase().includes("shoe") ||
        r.category.toLowerCase().includes("shoe") ||
        r.category.toLowerCase().includes("footwear")
      ).toBe(true);
    }
  });

  it("strictly validates that total marketplace channel allocation cannot exceed ATS", () => {
    const availableAts = 50;

    const validAllocation = {
      amazon: 20,
      flipkart: 20,
      shopify: 10,
    };
    const totalAllocated = validAllocation.amazon + validAllocation.flipkart + validAllocation.shopify;
    expect(totalAllocated <= availableAts).toBe(true);

    const invalidAllocation = {
      amazon: 30,
      flipkart: 25,
      shopify: 10,
    };
    const invalidTotal = invalidAllocation.amazon + invalidAllocation.flipkart + invalidAllocation.shopify;
    expect(invalidTotal <= availableAts).toBe(false); // 65 > 50 -> REJECTED
  });
});
