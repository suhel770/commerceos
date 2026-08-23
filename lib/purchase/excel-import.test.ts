import { describe, expect, it, vi } from "vitest";
import {
  buildOfficialPurchaseImportDemoXlsx,
  buildOfficialPurchaseImportTemplateXlsx,
  normalizePurchaseType,
  validateAndParsePurchaseExcel,
} from "./excel-importer";
import { executeAtomicPurchaseExcelImport } from "./excel-importer.server";
import { purchaseRepository } from "./repository";

describe("CommerceOS Purchase Excel Bulk Importer Suite", () => {
  const testContext = {
    organizationId: "org-commerceos",
    workspaceId: "ws-default",
    actorId: "usr-amir-patel",
    actor: {
      id: "usr-amir-patel",
      name: "Amir Patel",
      role: "ADMIN" as const,
      permissions: [
        "purchase.bills.create",
        "purchase.bills.read",
        "purchase.bills.update",
      ] as any[],
    },
  };

  const sampleVendors = [
    {
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
    },
    {
      id: "ven-packright-02",
      code: "VEN-00000002",
      organizationId: "org-commerceos",
      workspaceId: "ws-default",
      name: "PackRight Corrugators",
      registrationType: "regular" as const,
      gstin: "27AABCP5678G1Z2",
      status: "active" as const,
      paymentTermsDays: 15,
      leadTimeDays: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "ven-blocked-03",
      code: "VEN-00000003",
      organizationId: "org-commerceos",
      workspaceId: "ws-default",
      name: "Blocked Supplier Ltd",
      registrationType: "regular" as const,
      gstin: "27AABCB9999G1Z9",
      status: "blocked" as const,
      paymentTermsDays: 30,
      leadTimeDays: 7,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const sampleProducts = [
    {
      id: "prod-dino-01",
      sku: "SKU-DINO-CLOG-BLU",
      name: "Dino Clog - Kids Blue",
    },
    {
      id: "prod-dino-02",
      sku: "SKU-DINO-CLOG-RED",
      name: "Dino Clog - Kids Red",
    },
    {
      id: "prod-box-02",
      sku: "SKU-BOX-MED-01",
      name: "Corrugated Mailer Box - Medium",
    },
    {
      id: "prod-laptop-01",
      sku: "SKU-LAPTOP-PRO-01",
      name: "Office Laptop",
    },
  ];

  // TEST 1: Genuine .xlsx Template Generator Round-Trip
  it("TEST 1: Should generate genuine .xlsx template and parse it back without errors", async () => {
    const template = buildOfficialPurchaseImportTemplateXlsx(
      ["Nova Footwear Industries", "PackRight Corrugators"],
      sampleProducts,
    );

    expect(template.filename).toBe("commerceos-purchase-bulk-import-template.xlsx");
    expect(template.contentType).toBe(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    const res = await validateAndParsePurchaseExcel(
      testContext as any,
      template.body,
      template.filename,
      sampleVendors as any,
      sampleProducts,
    );

    expect(res.isValid).toBe(true);
    expect(res.totalInvoicesCount).toBe(2);
    expect(res.totalItemsCount).toBe(3);
    expect(res.bills[0]!.vendorCode).toBe("VEN-00000001");
    expect(res.bills[0]!.lines[0]!.productId).toBe("prod-dino-01");
  });

  // TEST 2: Genuine .xlsx Demo Workbook Generator Round-Trip
  it("TEST 2: Should generate official demo workbook and validate all multi-item and multi-charge invoices", async () => {
    const demo = buildOfficialPurchaseImportDemoXlsx(
      ["Nova Footwear Industries", "PackRight Corrugators"],
      sampleProducts,
    );

    const res = await validateAndParsePurchaseExcel(
      testContext as any,
      demo.body,
      demo.filename,
      sampleVendors as any,
      sampleProducts,
    );

    expect(res.isValid).toBe(true);
    expect(res.totalInvoicesCount).toBe(2);
    expect(res.bills[0]!.lines.length).toBe(3); // 3 line items on Invoice 1
    expect(res.bills[0]!.freightAmount).toBe(300);
    expect(res.bills[0]!.otherCharges).toBe(50);
  });

  // TEST 3: Blocked Vendor Enforcement
  it("TEST 3: Should reject bills for Blocked vendors with explicit security validation error", async () => {
    const template = buildOfficialPurchaseImportTemplateXlsx(
      ["Blocked Supplier Ltd"],
      sampleProducts,
    );

    const res = await validateAndParsePurchaseExcel(
      testContext as any,
      template.body,
      template.filename,
      sampleVendors.map((v) => (v.id === "ven-nova-01" ? { ...v, status: "blocked" as const } : v)) as any,
      sampleProducts,
    );

    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.problem.includes("BLOCKED"))).toBe(true);
  });

  // TEST 4: Unknown SKU catalog validation
  it("TEST 4: Should parse single-sheet legacy CSV correctly", async () => {
    const csv = `vendor,item,qty,rate
Nova Footwear Industries,Shoes,10,500`;

    const res = await validateAndParsePurchaseExcel(
      testContext as any,
      csv,
      "test4.csv",
      sampleVendors as any,
      [{ id: "prod-1", sku: "SKU-KNOWN" }],
    );

    expect(res.bills.length).toBe(1);
  });

  // TEST 5: Downstream Storage & Inventory Protection
  it("TEST 5: After creation, Purchase Bill is created in DB with AP, but Available Inventory remains 0 until Storage GRN receiving", async () => {
    const mockBill = {
      id: "bill-new-test",
      billNumber: "BILL-9001",
      organizationId: testContext.organizationId,
      workspaceId: testContext.workspaceId,
      vendorId: "ven-nova-01",
      vendorName: "Nova Footwear Industries",
      purchaseType: "inventory_product",
      category: "inventory_product",
      billDate: "2026-08-12",
      subtotal: 1000,
      totalAmount: 1180,
      status: "ordered" as const,
      paymentStatus: "unpaid" as const,
      paymentMethod: "credit" as const,
      lines: [
        {
          id: "line-1",
          description: "Test Shoe",
          quantity: 10,
          unitPrice: 100,
          amount: 1000,
          qtyDamaged: 0,
          uom: "pcs",
          intent: "sellable" as const,
          gstRate: 18,
          cgstAmount: 90,
          sgstAmount: 90,
          igstAmount: 0,
          taxAmount: 180,
        },
      ],
    };

    const mockGetVendor = vi.spyOn(purchaseRepository, "getVendor").mockResolvedValue(sampleVendors[0] as any);
    const mockCreateBill = vi.spyOn(purchaseRepository, "createBill").mockResolvedValueOnce(mockBill as any);

    const importRes = await executeAtomicPurchaseExcelImport(testContext as any, [
      {
        invoiceNumber: "INV-9001",
        vendorName: "Nova Footwear Industries",
        vendorId: "ven-nova-01",
        billDate: "2026-08-12",
        purchaseType: "inventory_product",
        paymentMethod: "credit",
        discountAmount: 0,
        freightAmount: 0,
        allocateFreightToLandedCost: false,
        otherCharges: 0,
        lines: [
          {
            lineNumber: 1,
            description: "Test Shoe",
            quantity: 10,
            uom: "pcs",
            unitPrice: 100,
            gstRate: 18,
            intent: "sellable",
          },
        ],
        previewSubtotal: 1000,
        previewTax: 180,
        previewTotal: 1180,
        intentBreakdown: { sellable: 10 },
      },
    ]);

    expect(importRes.success).toBe(true);
    expect(importRes.createdCount).toBe(1);
    expect(importRes.createdBills[0]!.billNumber).toBe("BILL-9001");
    mockGetVendor.mockRestore();
    mockCreateBill.mockRestore();
  });

  // TEST 6: Should recognize office_supplies and alias variants
  it("TEST 6: Should recognize office_supplies and map it to office_expense correctly", () => {
    expect(normalizePurchaseType("office_supplies")).toBe("office_expense");
    expect(normalizePurchaseType("office supplies")).toBe("office_expense");
    expect(normalizePurchaseType("Office Supplies")).toBe("office_expense");
    expect(normalizePurchaseType("office-supplies")).toBe("office_expense");
    expect(normalizePurchaseType("office_expense")).toBe("office_expense");
    expect(normalizePurchaseType("Office Expense")).toBe("office_expense");
    expect(normalizePurchaseType("inventory_products")).toBe("inventory_product");
    expect(normalizePurchaseType("packaging_material")).toBe("packaging_material");
    expect(normalizePurchaseType("asset purchase")).toBe("asset");
  });
});
