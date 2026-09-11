import "dotenv/config";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "@/lib/db";
import { productRepository } from "@/lib/repositories/product.repository";
import { purchaseRepository } from "@/lib/purchase/repository";
import {
  formatUniversalProductId,
  isValidUniversalProductId,
  generateNextUniversalProductId,
} from "@/lib/products/product-id-generator";
import { getProductSlug } from "@/lib/products/slug";

describe("Universal Product ID Foundation", () => {
  const testProductUuid = "test-prod-uuid-foundation-01";
  const testPrdId = "PRD-000999";
  const testSku = "SKU-TEST-FOUNDATION-01";

  beforeAll(async () => {
    await db.product.upsert({
      where: { id: testProductUuid },
      update: {},
      create: {
        id: testProductUuid,
        productId: testPrdId,
        productType: "SELLABLE",
        workspaceId: "ws-default",
        sku: testSku,
        name: "Test Foundation Product",
        slug: "test-foundation-product",
        category: "Test",
        status: "Active",
        intent: "sellable",
      },
    });
  });

  it("generates correctly formatted PRD- IDs for Sellable and Consumable types", async () => {
    expect(formatUniversalProductId("SELLABLE", 1)).toBe("PRD-000101");
    expect(formatUniversalProductId("SELLABLE", 24)).toBe("PRD-000124");
    expect(formatUniversalProductId("CONSUMABLE", 1)).toBe("PRD-000201");
    expect(formatUniversalProductId("CONSUMABLE", 15)).toBe("PRD-000215");

    expect(isValidUniversalProductId("PRD-000124")).toBe(true);
    expect(isValidUniversalProductId("PRD-000201")).toBe(true);
    expect(isValidUniversalProductId("2dafcfd0-7704-4f40-91e2-48c326442419")).toBe(false);
    expect(isValidUniversalProductId("kids-sports-shoe-black")).toBe(false);
  });

  it("retrieves real database products with PRD- IDs, SKU, Name, and Slug separated", async () => {
    const products = await productRepository.findAll();
    expect(products.length).toBeGreaterThan(0);

    for (const p of products) {
      expect(p.id).toBeDefined(); // DB UUID
      expect(p.sku).toBeDefined(); // SKU
      expect(p.name).toBeDefined(); // Name
      expect(p.slug).toBeDefined(); // URL slug
      expect(p.slug).not.toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i); // Slug is NEVER a raw UUID
      expect(p.productId).toBeDefined(); // Universal Product ID
      expect(isValidUniversalProductId(p.productId)).toBe(true);
    }
  });

  it("finds product by Universal Product ID (e.g. PRD-000101)", async () => {
    const firstProduct = (await productRepository.findAll())[0];
    expect(firstProduct).toBeDefined();
    expect(firstProduct.productId).toBeDefined();

    const foundById = await productRepository.findById(firstProduct.productId!);
    expect(foundById).toBeDefined();
    expect(foundById?.id).toBe(firstProduct.id);
    expect(foundById?.productId).toBe(firstProduct.productId);
  });

  it("filters product search by Universal Product ID", async () => {
    const products = await productRepository.findAll();
    const targetProduct = products[0];

    const searchResults = await productRepository.findAll({
      search: targetProduct.productId,
    });

    expect(searchResults.length).toBeGreaterThanOrEqual(1);
    expect(searchResults.some((p) => p.id === targetProduct.id)).toBe(true);
  });

  it("links existing product ID when creating a purchase bill for an existing product SKU", async () => {
    const existingProduct = (await productRepository.findAll())[0];
    const vendors = await purchaseRepository.listVendors("org-commerceos", "ws-default");
    const activeVendor = vendors[0] || (await purchaseRepository.createVendor("org-commerceos", "ws-default", {
      name: "Test Sole Vendor",
    }));

    const bill = await purchaseRepository.createBill(
      "org-commerceos",
      "ws-default",
      {
        vendorId: activeVendor.id,
        purchaseType: "inventory_product",
        billDate: "2026-08-29",
        lines: [
          {
            description: existingProduct.name,
            sku: existingProduct.sku,
            quantity: 5,
            unitPrice: 200,
            intent: "sellable",
          },
        ],
      },
      "TestRunner"
    );

    expect(bill.lines.length).toBe(1);
    expect(bill.lines[0].productId).toBe(existingProduct.id);
  });

  afterAll(async () => {
    try {
      await db.purchaseBillLine.deleteMany({
        where: { bill: { createdBy: "TestRunner" } },
      });
      await db.purchaseBill.deleteMany({
        where: { createdBy: "TestRunner" },
      });
      await db.vendor.deleteMany({
        where: { name: "Test Sole Vendor" },
      });
      await db.product.deleteMany({
        where: { id: testProductUuid },
      });
    } catch {
      // ignore
    }
  });
});
