import { describe, expect, it, vi } from "vitest";
import { purchaseService } from "./service";
import { purchaseRepository } from "./repository";
import { createPurchaseOrderSchema } from "../validation/purchase.schema";

describe("CommerceOS Purchase Order (PO) Architectural Separation Suite", () => {
  const testContext = {
    organizationId: "org-commerceos",
    workspaceId: "ws-default",
    actorId: "usr-amir-patel",
  };

  const sampleVendor = {
    id: "ven-nova-01",
    code: "VEN-00000001",
    organizationId: "org-commerceos",
    workspaceId: "ws-default",
    name: "Nova Footwear Industries",
    registrationType: "regular" as const,
    gstin: "27AAACN1234F1Z5",
    status: "active" as const,
    paymentTermsDays: 30,
    leadTimeDays: 7,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const sampleBlockedVendor = {
    ...sampleVendor,
    id: "ven-blocked-01",
    name: "Blocked Footwear Ltd",
    status: "blocked" as const,
  };

  it("TEST 1: PO Zod validation succeeds without invoice-specific fields (No Invoice #, No Bill Upload, No Due Date, No Payment Method)", () => {
    const validPOInput = {
      vendorId: "ven-nova-01",
      poDate: "2026-08-13",
      expectedDeliveryDate: "2026-08-25",
      deliveryWarehouseId: "wh-main",
      currency: "INR",
      paymentTerms: "Net 30",
      vendorReference: "QUOT-2026-99",
      purchaseType: "inventory_product",
      discountAmount: 100,
      freightAmount: 200,
      otherCharges: 50,
      lines: [
        {
          description: "Dino Clog - Kids Blue",
          quantity: 50,
          unitPrice: 300,
          uom: "pcs",
          sku: "SKU-DINO-CLOG-BLU",
          hsn: "6402",
          gstRate: 18,
          intent: "sellable",
        },
      ],
    };

    const parsed = createPurchaseOrderSchema.safeParse(validPOInput);
    expect(parsed.success).toBe(true);
  });

  it("TEST 2: PO Service creates Purchase Order with auto-generated PO Number and calculated totals", async () => {
    vi.spyOn(purchaseRepository, "getVendor").mockResolvedValue(sampleVendor as any);
    vi.spyOn(purchaseRepository, "listOrders").mockResolvedValue([]);

    const createdPO = await purchaseService.createOrder(
      testContext.organizationId,
      testContext.workspaceId,
      {
        vendorId: sampleVendor.id,
        poDate: "2026-08-13",
        expectedDeliveryDate: "2026-08-25",
        deliveryWarehouseId: "wh-main",
        paymentTerms: "Net 30",
        discountAmount: 0,
        freightAmount: 100,
        otherCharges: 0,
        lines: [
          {
            description: "Safety Boots",
            quantity: 10,
            unitPrice: 500,
            uom: "pair",
            sku: "SKU-BOOT-01",
            gstRate: 18,
          },
        ],
      },
    );

    expect(createdPO.poNumber).toContain("PO-2026-");
    expect(createdPO.vendorName).toBe("Nova Footwear Industries");
    expect(createdPO.status).toBe("DRAFT");
    expect(createdPO.subtotal).toBe(5000); // 10 * 500
    expect(createdPO.taxAmount).toBe(900); // 18% of 5000
    expect(createdPO.totalAmount).toBe(6000); // 5000 + 900 + 100 freight
  });

  it("TEST 3: PO creation for BLOCKED vendor is strictly rejected", async () => {
    vi.spyOn(purchaseRepository, "getVendor").mockResolvedValue(sampleBlockedVendor as any);

    await expect(
      purchaseService.createOrder(
        testContext.organizationId,
        testContext.workspaceId,
        {
          vendorId: sampleBlockedVendor.id,
          poDate: "2026-08-13",
          lines: [
            {
              description: "Items",
              quantity: 1,
              unitPrice: 100,
            },
          ],
        },
      ),
    ).rejects.toThrow("blocked and cannot be used for new Purchase Orders");
  });
});
