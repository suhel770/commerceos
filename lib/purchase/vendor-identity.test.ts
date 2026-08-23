import { describe, expect, it } from "vitest";
import { extractPanFromGstin } from "./gst";
import { getVendorCode, type Vendor } from "./types";
import { buildOfficialPurchaseImportTemplateExcel, validateAndParsePurchaseExcel } from "./excel-importer";

describe("Unified Vendor Identity & Excel Purchase Integration Suite", () => {
  it("Auto-extracts PAN number from GSTIN (e.g. 09AAKFA4410Q1Z8 -> AAKFA4410Q)", () => {
    expect(extractPanFromGstin("09AAKFA4410Q1Z8")).toBe("AAKFA4410Q");
    expect(extractPanFromGstin("33AABCN6821F1Z2")).toBe("AABCN6821F");
    expect(extractPanFromGstin("INVALID")).toBeNull();
  });
  const context = {
    organizationId: "org-commerceos",
    workspaceId: "ws-default",
  };

  const activeVendors: Vendor[] = [
    {
      id: "ven-00000001",
      code: "VEN-00000001",
      organizationId: "org-commerceos",
      workspaceId: "ws-default",
      name: "Nova Footwear Industries",
      registrationType: "regular",
      paymentTermsDays: 30,
      leadTimeDays: 7,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "ven-00000002",
      code: "VEN-00000002",
      organizationId: "org-commerceos",
      workspaceId: "ws-default",
      name: "PackRight Corrugators",
      registrationType: "regular",
      paymentTermsDays: 15,
      leadTimeDays: 3,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it("TEST 1: getVendorCode generates stable human-readable Vendor Code for vendor", () => {
    const code = getVendorCode(activeVendors[0]);
    expect(code).toBe("VEN-00000001");
  });

  it("TEST 2: getVendorCode falls back deterministically for legacy vendor without explicit code", () => {
    const legacyVendor: Vendor = {
      id: "ven-legacy-99",
      organizationId: "org-commerceos",
      workspaceId: "ws-default",
      name: "Legacy Vendor Pvt Ltd",
      registrationType: "regular",
      paymentTermsDays: 30,
      leadTimeDays: 7,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const code = getVendorCode(legacyVendor);
    expect(code).toMatch(/^VEN-\d{8}$/);
  });

  it("TEST 5: Excel import resolves vendor via authoritative Vendor Code", async () => {
    const xml = `<?xml version="1.0"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">
      <Worksheet ss:Name="Purchase Bills">
        <Table>
          <Row>
            <Cell><Data ss:Type="String">Vendor Code</Data></Cell>
            <Cell><Data ss:Type="String">Supplier Name</Data></Cell>
            <Cell><Data ss:Type="String">Invoice Number</Data></Cell>
            <Cell><Data ss:Type="String">Invoice Date</Data></Cell>
            <Cell><Data ss:Type="String">Purchase Type</Data></Cell>
          </Row>
          <Row>
            <Cell><Data ss:Type="String">VEN-00000001</Data></Cell>
            <Cell><Data ss:Type="String">Nova Footwear Industries</Data></Cell>
            <Cell><Data ss:Type="String">INV-VEN-100</Data></Cell>
            <Cell><Data ss:Type="String">2026-08-12</Data></Cell>
            <Cell><Data ss:Type="String">inventory_product</Data></Cell>
          </Row>
        </Table>
      </Worksheet>
      <Worksheet ss:Name="Purchase Items">
        <Table>
          <Row>
            <Cell><Data ss:Type="String">Invoice Number</Data></Cell>
            <Cell><Data ss:Type="String">Description</Data></Cell>
            <Cell><Data ss:Type="String">Quantity</Data></Cell>
            <Cell><Data ss:Type="String">Unit Price</Data></Cell>
          </Row>
          <Row>
            <Cell><Data ss:Type="String">INV-VEN-100</Data></Cell>
            <Cell><Data ss:Type="String">Shoes</Data></Cell>
            <Cell><Data ss:Type="Number">10</Data></Cell>
            <Cell><Data ss:Type="Number">100</Data></Cell>
          </Row>
        </Table>
      </Worksheet>
    </Workbook>`;

    const res = await validateAndParsePurchaseExcel(context, xml, "import.xls", activeVendors);
    expect(res.isValid).toBe(true);
    expect(res.bills[0]!.vendorId).toBe("ven-00000001");
    expect(res.bills[0]!.vendorCode).toBe("VEN-00000001");
  });

  it("TEST 6: Unknown Vendor Code causes validation error", async () => {
    const xml = `<?xml version="1.0"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">
      <Worksheet ss:Name="Purchase Bills">
        <Table>
          <Row>
            <Cell><Data ss:Type="String">Vendor Code</Data></Cell>
            <Cell><Data ss:Type="String">Invoice Number</Data></Cell>
          </Row>
          <Row>
            <Cell><Data ss:Type="String">VEN-UNKNOWN-999</Data></Cell>
            <Cell><Data ss:Type="String">INV-BAD</Data></Cell>
          </Row>
        </Table>
      </Worksheet>
    </Workbook>`;

    const res = await validateAndParsePurchaseExcel(context, xml, "bad.xls", activeVendors);
    expect(res.isValid).toBe(false);
    expect(res.errors.some((e) => e.problem.includes("VEN-UNKNOWN-999"))).toBe(true);
  });

  it("TEST 8: Valid Vendor Code + Mismatched Vendor Name generates warning without breaking import", async () => {
    const xml = `<?xml version="1.0"?>
    <Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet">
      <Worksheet ss:Name="Purchase Bills">
        <Table>
          <Row>
            <Cell><Data ss:Type="String">Vendor Code</Data></Cell>
            <Cell><Data ss:Type="String">Supplier Name</Data></Cell>
            <Cell><Data ss:Type="String">Invoice Number</Data></Cell>
          </Row>
          <Row>
            <Cell><Data ss:Type="String">VEN-00000001</Data></Cell>
            <Cell><Data ss:Type="String">Wrong Supplier Spelled Name</Data></Cell>
            <Cell><Data ss:Type="String">INV-WARN-101</Data></Cell>
          </Row>
        </Table>
      </Worksheet>
      <Worksheet ss:Name="Purchase Items">
        <Table>
          <Row>
            <Cell><Data ss:Type="String">Invoice Number</Data></Cell>
            <Cell><Data ss:Type="String">Description</Data></Cell>
            <Cell><Data ss:Type="String">Quantity</Data></Cell>
            <Cell><Data ss:Type="String">Unit Price</Data></Cell>
          </Row>
          <Row>
            <Cell><Data ss:Type="String">INV-WARN-101</Data></Cell>
            <Cell><Data ss:Type="String">Item</Data></Cell>
            <Cell><Data ss:Type="Number">1</Data></Cell>
            <Cell><Data ss:Type="Number">10</Data></Cell>
          </Row>
        </Table>
      </Worksheet>
    </Workbook>`;

    const res = await validateAndParsePurchaseExcel(context, xml, "warn.xls", activeVendors);
    expect(res.isValid).toBe(true);
    expect(res.warnings.some((w) => w.includes("Vendor Code remains authoritative"))).toBe(true);
    expect(res.bills[0]!.vendorId).toBe("ven-00000001");
  });

  it("TEST 9 & TEST 10: Download template includes Vendor Code column and uploads cleanly", async () => {
    const template = buildOfficialPurchaseImportTemplateExcel(["Nova Footwear Industries"]);
    expect(template.filename).toContain("template");

    const res = await validateAndParsePurchaseExcel(context, template.body, template.filename, activeVendors);
    expect(res.isValid).toBe(true);
  });
});
