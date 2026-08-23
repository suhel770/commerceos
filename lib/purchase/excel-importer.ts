/**
 * CommerceOS Purchase Excel Bulk Importer Engine
 * Genuine OpenXML (.xlsx) & CSV multi-sheet parser, validator, and template generator.
 * Enforces Vendor Master & Product Catalog lookups, RBAC vendor security rules,
 * exact GST engine formulas, pre-commit preview, and atomic transactions.
 */

import * as XLSX from "xlsx";
import type { CommerceContext } from "@/lib/platform/commerce-context";
import type {
  BusinessIntent,
  FreightAllocationMode,
  PaymentMethod,
  PurchaseType,
  PurchaseUom,
  Vendor,
} from "./types";
import {
  ALL_BUSINESS_INTENTS,
  ALL_PURCHASE_TYPES,
  PURCHASE_UOM_OPTIONS,
  getVendorCode,
} from "./types";
import { normalizeGstRate } from "./gst";
import { isStockPathType, resolveIntentFromPurchaseType } from "./routing";

export interface ExcelImportRowError {
  sheet: string;
  rowNumber: number;
  invoiceNumber: string;
  field: string;
  problem: string;
  suggestedFix: string;
}

export interface ExcelImportParsedBill {
  invoiceNumber: string;
  vendorName: string;
  vendorCode?: string;
  vendorId?: string;
  vendorInvoiceNumber?: string;
  billDate: string;
  dueDate?: string;
  purchaseType: PurchaseType;
  paymentMethod: PaymentMethod;
  paymentId?: string;
  poReference?: string;
  department?: string;
  costCenter?: string;
  discountAmount: number;
  freightAmount: number;
  allocateFreightToLandedCost: boolean;
  otherCharges: number;
  notes?: string;
  billUploadName?: string;
  lines: Array<{
    lineNumber: number;
    description: string;
    sku?: string;
    hsn?: string;
    productId?: string;
    quantity: number;
    uom: PurchaseUom;
    unitPrice: number;
    gstRate: number;
    intent: BusinessIntent;
    freightMode?: FreightAllocationMode;
  }>;
  // Computed preview amounts (derived via backend calculation engine)
  previewSubtotal: number;
  previewTax: number;
  previewTotal: number;
  intentBreakdown: Record<string, number>;
}

export interface ExcelImportValidationResult {
  isValid: boolean;
  totalInvoicesCount: number;
  totalItemsCount: number;
  totalChargesCount: number;
  totalGrandAmount: number;
  bills: ExcelImportParsedBill[];
  errors: ExcelImportRowError[];
  warnings: string[];
}

export interface CatalogProductLookup {
  id: string;
  sku: string;
  name?: string;
}

function todayInputDate(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Normalizes dates (cell Date object, numeric serial, or YYYY-MM-DD text) into YYYY-MM-DD format
 */
function normalizeDateValue(raw: unknown): string {
  if (!raw) return todayInputDate();
  if (raw instanceof Date) {
    const y = raw.getFullYear();
    const m = String(raw.getMonth() + 1).padStart(2, "0");
    const d = String(raw.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const str = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [m, d, y] = str.split("/");
    return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return str || todayInputDate();
}

/**
 * Safely normalizes text cells without stripping leading zeroes or auto-converting codes
 */
function cleanTextCell(val: unknown): string {
  if (val === undefined || val === null) return "";
  return String(val).trim();
}

/**
 * Safely parse numeric cells, stripping formatting characters like commas
 */
function parseExcelNumber(val: unknown, fallback: number = 0): number {
  if (typeof val === "number") return val;
  if (val === undefined || val === null || val === "") return fallback;
  const cleaned = String(val)
    .replace(/,/g, "")
    .replace(/[^0-9.-]/g, "");
  const num = Number(cleaned);
  return Number.isFinite(num) ? num : fallback;
}

/**
 * Builds the official CommerceOS 4-Sheet Purchase Import Template as a genuine .xlsx workbook.
 */
export function buildOfficialPurchaseImportTemplateXlsx(
  vendors: Array<{ name: string; code?: string; id?: string } | string> = [],
  sampleProducts: CatalogProductLookup[] = [],
): {
  filename: string;
  contentType: string;
  body: Uint8Array;
} {
  const today = todayInputDate();

  const rawV1 = vendors[0] || {
    name: "Nova Footwear Industries",
    code: "VEN-00000001",
    id: "VEN-00000001",
  };
  const v1 = typeof rawV1 === "string" ? { name: rawV1, code: "VEN-00000001", id: "VEN-00000001" } : rawV1;
  const sampleVendor1 = v1.name?.trim() || "Nova Footwear Industries";
  const sampleCode1 = getVendorCode(v1 as any) || "VEN-00000001";

  const rawV2 = vendors[1] || {
    name: "PackRight Corrugators",
    code: "VEN-00000002",
    id: "VEN-00000002",
  };
  const v2 = typeof rawV2 === "string" ? { name: rawV2, code: "VEN-00000002", id: "VEN-00000002" } : rawV2;
  const sampleVendor2 = v2.name?.trim() || "PackRight Corrugators";
  const sampleCode2 = getVendorCode(v2 as any) || "VEN-00000002";

  const sampleSku1 = sampleProducts[0]?.sku || "SKU-DINO-CLOG-BLU";
  const sampleSku2 = sampleProducts[1]?.sku || "SKU-BOX-MED-01";

  const wb = XLSX.utils.book_new();

  // Sheet 1: Purchase Bills
  const billsHeaders = [
    "Vendor Code",
    "Supplier Name*",
    "Invoice Number*",
    "Invoice Date*",
    "Purchase Type*",
    "Vendor Invoice Number",
    "Due Date",
    "Payment Method",
    "Payment ID",
    "PO Reference",
    "Department",
    "Cost Center",
    "Discount Amount",
    "Freight Amount",
    "Allocate Freight To Landed Cost",
    "Other Charges",
    "Notes",
  ];

  const billsRows: Array<Array<string | number>> = [
    [
      sampleCode1,
      sampleVendor1,
      "INV-2026-101",
      today,
      "inventory_product",
      "VEN-INV-9901",
      "",
      "credit",
      "",
      "PO-2026-88",
      "Procurement",
      "CC-101",
      0,
      250,
      "Yes",
      50,
      "Batch 101 Bulk Purchase",
    ],
    [
      sampleCode2,
      sampleVendor2,
      "INV-2026-102",
      today,
      "packaging_material",
      "BOX-INV-4412",
      "",
      "upi",
      "UPI-TXN-998822",
      "",
      "Logistics",
      "CC-102",
      100,
      150,
      "No",
      0,
      "Monthly Mailer Boxes",
    ],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet([billsHeaders, ...billsRows]);
  ws1["!cols"] = [
    { wch: 16 },
    { wch: 28 },
    { wch: 18 },
    { wch: 14 },
    { wch: 22 },
    { wch: 22 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 30 },
    { wch: 16 },
    { wch: 30 },
  ];

  // Sheet 2: Purchase Items
  const itemsHeaders = [
    "Invoice Number*",
    "Line Number",
    "Description*",
    "SKU",
    "HSN",
    "Quantity*",
    "UOM",
    "Unit Price*",
    "GST Rate",
    "Intent",
  ];

  const itemsRows: Array<Array<string | number>> = [
    [
      "INV-2026-101",
      1,
      "Dino Clog - Kids Blue (Size 5)",
      sampleSku1,
      "6403",
      50,
      "pcs",
      250,
      18,
      "sellable",
    ],
    [
      "INV-2026-101",
      2,
      "Dino Clog - Kids Red (Size 6)",
      "SKU-DINO-CLOG-RED",
      "6403",
      50,
      "pcs",
      260,
      18,
      "sellable",
    ],
    [
      "INV-2026-102",
      1,
      "Corrugated Mailer Box - Medium",
      sampleSku2,
      "4819",
      500,
      "pcs",
      15,
      18,
      "consumable",
    ],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet([itemsHeaders, ...itemsRows]);
  ws2["!cols"] = [
    { wch: 18 },
    { wch: 12 },
    { wch: 34 },
    { wch: 22 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
  ];

  // Sheet 3: Charges
  const chargesHeaders = [
    "Invoice Number*",
    "Charge Type*",
    "Amount*",
    "Landed Cost Allocation",
    "Notes",
  ];

  const chargesRows: Array<Array<string | number>> = [
    ["INV-2026-101", "freight", 250, "Yes", "Express Logistics Courier"],
    ["INV-2026-101", "other", 50, "No", "Unloading Charge"],
    ["INV-2026-102", "freight", 150, "No", "Local Rickshaw Dispatch"],
  ];

  const ws3 = XLSX.utils.aoa_to_sheet([chargesHeaders, ...chargesRows]);
  ws3["!cols"] = [
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 24 },
    { wch: 30 },
  ];

  // Sheet 4: Instructions
  const guideRows = [
    ["Instruction Point", "Category", "Requirement & Explanation"],
    [
      "1. Template Download",
      "General",
      "Download and fill this official .xlsx workbook in Microsoft Excel, Google Sheets, or LibreOffice.",
    ],
    [
      "2. Vendor Matching",
      "Vendor Lookup",
      "Leave Vendor Code blank to match by Supplier Name. If Vendor Code is provided, it must exist in Vendor Master and is authoritative.",
    ],
    [
      "3. Product / SKU",
      "Catalog Lookup",
      "SKU must match Master Product Catalog. System resolves productId automatically. Ad-hoc items leave SKU blank.",
    ],
    [
      "4. Invoice Number*",
      "Linking Key",
      "Unique relationship key connecting Sheet 1 (Bills), Sheet 2 (Items), and Sheet 3 (Charges).",
    ],
    [
      "5. Multiple Items",
      "Line Items",
      "Connect multiple item rows on Sheet 2 to one invoice by repeating the Invoice Number on each item row.",
    ],
    [
      "6. Multiple Charges",
      "Charges",
      "Connect itemized freight or handling charges on Sheet 3 to an invoice using the Invoice Number.",
    ],
    [
      "7. Required Fields",
      "Validation",
      "Mandatory fields are marked with (*). Sheet 1: Supplier Name*, Invoice Number*, Invoice Date*, Purchase Type*. Sheet 2: Invoice Number*, Description*, Quantity*, Unit Price*.",
    ],
    [
      "8. Business Intents",
      "Routing",
      "sellable | consumable | asset | expense | service | marketing | freight | other. Defines stock vs expense disposition.",
    ],
    [
      "9. Date Format",
      "Formatting",
      "Use YYYY-MM-DD date format (e.g. 2026-08-12).",
    ],
    [
      "10. GST Calculations",
      "Backend Auto",
      "Enter only base Rate & GST % slab (0, 5, 12, 18, 28). CGST/SGST vs IGST split is calculated automatically by server.",
    ],
    [
      "11. Payment Handling",
      "Finance",
      "Immediate paid methods (cash, upi, card, neft_rtgs) mark bill as paid & completed. Credit/unpaid methods set status to ordered.",
    ],
    [
      "12. Calculated Fields",
      "Do Not Enter",
      "Subtotal, CGST, SGST, IGST, Round Off, Total Amount are calculated by backend. DO NOT enter calculated total columns.",
    ],
    [
      "13. Database Lookups",
      "Lookups",
      "Vendor Code -> Vendor ID, SKU -> Product ID, Business Profile -> Buyer State Code.",
    ],
    [
      "14. Validation & Preview",
      "Security",
      "All rows are validated against schema & master data. Preview displays exact errors before commit.",
    ],
    [
      "15. Atomic Transaction",
      "Data Safety",
      "Imports execute as atomic all-or-nothing transactions. If any row is invalid, 0 bills are committed.",
    ],
    [
      "16. Storage Protection",
      "Inventory",
      "Creating a Purchase Bill updates Accounts Payable. Physical inventory is protected until warehouse staff process GRN receiving.",
    ],
  ];

  const ws4 = XLSX.utils.aoa_to_sheet(guideRows);
  ws4["!cols"] = [{ wch: 24 }, { wch: 18 }, { wch: 85 }];

  XLSX.utils.book_append_sheet(wb, ws1, "Purchase Bills");
  XLSX.utils.book_append_sheet(wb, ws2, "Purchase Items");
  XLSX.utils.book_append_sheet(wb, ws3, "Charges");
  XLSX.utils.book_append_sheet(wb, ws4, "Instructions");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return {
    filename: "commerceos-purchase-bulk-import-template.xlsx",
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    body: new Uint8Array(buffer),
  };
}

/**
 * Builds a separate official Demo Workbook demonstrating production multi-item, multi-charge scenarios.
 */
export function buildOfficialPurchaseImportDemoXlsx(
  vendors: Array<{ name: string; code?: string; id?: string } | string> = [],
  sampleProducts: CatalogProductLookup[] = [],
): {
  filename: string;
  contentType: string;
  body: Uint8Array;
} {
  const today = todayInputDate();

  const rawVendor1 = vendors[0] || {
    name: "Nova Footwear Industries",
    code: "VEN-00000001",
    id: "VEN-00000001",
  };
  const vendor1 = typeof rawVendor1 === "string" ? { name: rawVendor1, code: "VEN-00000001", id: "VEN-00000001" } : rawVendor1;
  const v1Name = vendor1.name?.trim() || "Nova Footwear Industries";
  const v1Code = getVendorCode(vendor1 as any) || "VEN-00000001";

  const rawVendor2 = vendors[1] || {
    name: "PackRight Corrugators",
    code: "VEN-00000002",
    id: "VEN-00000002",
  };
  const vendor2 = typeof rawVendor2 === "string" ? { name: rawVendor2, code: "VEN-00000002", id: "VEN-00000002" } : rawVendor2;
  const v2Name = vendor2.name?.trim() || "PackRight Corrugators";
  const v2Code = getVendorCode(vendor2 as any) || "VEN-00000002";

  const sku1 = sampleProducts[0]?.sku || "SKU-DINO-CLOG-BLU";
  const sku2 = sampleProducts[1]?.sku || "SKU-BOX-MED-01";

  const wb = XLSX.utils.book_new();

  // Sheet 1: Purchase Bills
  const billsHeaders = [
    "Vendor Code",
    "Supplier Name",
    "Invoice Number",
    "Invoice Date",
    "Purchase Type",
    "Vendor Invoice Number",
    "Due Date",
    "Payment Method",
    "Payment ID",
    "PO Reference",
    "Department",
    "Cost Center",
    "Discount Amount",
    "Freight Amount",
    "Allocate Freight To Landed Cost",
    "Other Charges",
    "Notes",
  ];

  const billsRows: Array<Array<string | number>> = [
    [
      v1Code,
      v1Name,
      "INV-DEMO-1001",
      today,
      "inventory_product",
      "VEN-INV-DEMO-01",
      "",
      "credit",
      "",
      "PO-2026-DEMO",
      "Procurement",
      "CC-101",
      100,
      0,
      "Yes",
      0,
      "Demo Multi-Item Footwear Purchase",
    ],
    [
      v2Code,
      v2Name,
      "INV-DEMO-1002",
      today,
      "packaging_material",
      "BOX-INV-DEMO-02",
      "",
      "upi",
      "UPI-DEMO-9988",
      "",
      "Logistics",
      "CC-102",
      0,
      150,
      "No",
      0,
      "Demo Packaging Consumable Purchase",
    ],
  ];

  const ws1 = XLSX.utils.aoa_to_sheet([billsHeaders, ...billsRows]);

  // Sheet 2: Purchase Items
  const itemsHeaders = [
    "Invoice Number",
    "Line Number",
    "Description",
    "SKU",
    "HSN",
    "Quantity",
    "UOM",
    "Unit Price",
    "GST Rate",
    "Intent",
  ];

  const itemsRows: Array<Array<string | number>> = [
    [
      "INV-DEMO-1001",
      1,
      "Dino Clog - Kids Blue (Size 5)",
      sku1,
      "6403",
      50,
      "pcs",
      250,
      18,
      "sellable",
    ],
    [
      "INV-DEMO-1001",
      2,
      "Dino Clog - Kids Red (Size 6)",
      "SKU-DINO-CLOG-RED",
      "6403",
      50,
      "pcs",
      260,
      18,
      "sellable",
    ],
    [
      "INV-DEMO-1001",
      3,
      "Office Laptop for Procurement",
      "SKU-LAPTOP-PRO-01",
      "8471",
      1,
      "pcs",
      45000,
      18,
      "asset",
    ],
    [
      "INV-DEMO-1002",
      1,
      "Corrugated Mailer Box - Medium",
      sku2,
      "4819",
      500,
      "pcs",
      15,
      18,
      "consumable",
    ],
  ];

  const ws2 = XLSX.utils.aoa_to_sheet([itemsHeaders, ...itemsRows]);

  // Sheet 3: Charges
  const chargesHeaders = [
    "Invoice Number*",
    "Charge Type*",
    "Amount*",
    "Landed Cost Allocation",
    "Notes",
  ];

  const chargesRows: Array<Array<string | number>> = [
    ["INV-DEMO-1001", "freight", 300, "Yes", "Express Container Logistics"],
    ["INV-DEMO-1001", "other", 50, "No", "Unloading & Dock Fee"],
    ["INV-DEMO-1002", "freight", 150, "No", "Local Transport Dispatch"],
  ];

  const ws3 = XLSX.utils.aoa_to_sheet([chargesHeaders, ...chargesRows]);

  // Sheet 4: Instructions
  const guideRows = [
    ["Demo Notice", "Instruction"],
    [
      "Sample Data",
      "This is an instructional demo workbook. Demo values must be reviewed in preview before importing into production.",
    ],
  ];
  const ws4 = XLSX.utils.aoa_to_sheet(guideRows);

  XLSX.utils.book_append_sheet(wb, ws1, "Purchase Bills");
  XLSX.utils.book_append_sheet(wb, ws2, "Purchase Items");
  XLSX.utils.book_append_sheet(wb, ws3, "Charges");
  XLSX.utils.book_append_sheet(wb, ws4, "Instructions");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return {
    filename: "commerceos-purchase-bulk-import-demo.xlsx",
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    body: new Uint8Array(buffer),
  };
}

/** Legacy SpreadsheetML / CSV fallback compatibility wrapper */
export function buildOfficialPurchaseImportTemplateExcel(
  vendorNames: string[] = [],
): {
  filename: string;
  contentType: string;
  body: string;
} {
  const xlsxRes = buildOfficialPurchaseImportTemplateXlsx(vendorNames);
  return {
    filename: "commerceos-purchase-bulk-import-template.xlsx",
    contentType: xlsxRes.contentType,
    body: Buffer.from(xlsxRes.body).toString("base64"),
  };
}

/**
 * Parse sheets into a record of 2D string arrays using XLSX engine
 */
function extractWorksheetsFromWorkbook(
  wb: XLSX.WorkBook,
): Record<string, string[][]> {
  const worksheets: Record<string, string[][]> = {};
  for (const name of wb.SheetNames) {
    const ws = wb.Sheets[name];
    if (!ws) continue;
    const rows: any[][] = XLSX.utils.sheet_to_json(ws, {
      header: 1,
      raw: false,
      defval: "",
    });
    const stringRows: string[][] = rows
      .map((row) => row.map((cell) => cleanTextCell(cell)))
      .filter((row) => row.some((c) => c.length > 0));
    worksheets[name.trim()] = stringRows;
  }
  return worksheets;
}

/**
 * Parse CSV text into a 2D array
 */
function parseCsvRows(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(",").map((c) => c.trim().replace(/^"|"$/g, "")));
}

/**
 * Normalizes user-input Purchase Type labels (e.g. "Asset Purchase") to internal enum keys.
 */
export function normalizePurchaseType(raw: string): PurchaseType | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return undefined;

  const cleanSpaced = trimmed.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
  const cleanUnderscored = trimmed.replace(/[\s-]+/g, "_").replace(/_+/g, "_").trim();

  // Exact match
  if (ALL_PURCHASE_TYPES.includes(trimmed as PurchaseType)) {
    return trimmed as PurchaseType;
  }
  if (ALL_PURCHASE_TYPES.includes(cleanUnderscored as PurchaseType)) {
    return cleanUnderscored as PurchaseType;
  }

  // Reverse lookup map
  const reverseMap: Record<string, PurchaseType> = {
    // Inventory
    "inventory products": "inventory_product",
    "inventory product": "inventory_product",
    "inventory_products": "inventory_product",
    "inventory_product": "inventory_product",
    "inventory-products": "inventory_product",
    "inventory-product": "inventory_product",
    inventory: "inventory_product",
    product: "inventory_product",
    products: "inventory_product",
    stock: "inventory_product",
    goods: "inventory_product",

    // Packaging
    "packaging material": "packaging_material",
    "packaging materials": "packaging_material",
    "packaging_material": "packaging_material",
    "packaging_materials": "packaging_material",
    "packaging-material": "packaging_material",
    "packaging-materials": "packaging_material",
    packaging: "packaging_material",
    boxes: "packaging_material",
    box: "packaging_material",
    labels: "packaging_material",

    // Office supplies & expenses
    "office supplies": "office_expense",
    "office supply": "office_expense",
    "office_supplies": "office_expense",
    "office_supply": "office_expense",
    "office-supplies": "office_expense",
    "office-supply": "office_expense",
    "office expense": "office_expense",
    "office expenses": "office_expense",
    "office_expense": "office_expense",
    "office_expenses": "office_expense",
    "office-expense": "office_expense",
    "office-expenses": "office_expense",
    office: "office_expense",
    supplies: "office_expense",
    stationery: "office_expense",

    // Asset
    asset: "asset",
    assets: "asset",
    "asset purchase": "asset",
    "asset purchases": "asset",
    "asset_purchase": "asset",
    "asset_purchases": "asset",
    "asset-purchase": "asset",
    "fixed asset": "asset",
    "fixed assets": "asset",
    "fixed_asset": "asset",
    "fixed_assets": "asset",
    "capital goods": "asset",
    "capital_goods": "asset",
    equipment: "asset",

    // Marketing
    marketing: "marketing",
    advertisement: "marketing",
    advertising: "marketing",
    ads: "marketing",
    promotion: "marketing",
    promotions: "marketing",
    branding: "marketing",

    // Software
    software: "software",
    saas: "software",
    subscription: "software",
    subscriptions: "software",
    "software subscription": "software",
    "software_subscription": "software",
    it: "software",

    // Courier
    courier: "courier",
    shipping: "courier",
    freight: "courier",
    logistics: "courier",
    delivery: "courier",
    transport: "courier",
    transportation: "courier",

    // Rent
    rent: "rent",
    lease: "rent",
    rental: "rent",

    // Utilities
    utilities: "utilities",
    utility: "utilities",
    electricity: "utilities",
    water: "utilities",
    power: "utilities",
    internet: "utilities",
    broadband: "utilities",

    // Service
    service: "service",
    services: "service",
    maintenance: "service",
    consulting: "service",
    consultancy: "service",
    contractor: "service",

    // Travel
    travel: "travel",
    "travel expense": "travel",
    "travel expenses": "travel",
    "travel_expense": "travel",
    "travel_expenses": "travel",
    hotel: "travel",
    flight: "travel",

    // Professional fees
    "professional fees": "professional_fees",
    "professional fee": "professional_fees",
    "professional_fees": "professional_fees",
    "professional_fee": "professional_fees",
    "professional-fees": "professional_fees",
    "pro fees": "professional_fees",
    "pro_fees": "professional_fees",
    legal: "professional_fees",
    accounting: "professional_fees",
    audit: "professional_fees",

    // Other
    other: "other",
    others: "other",
    misc: "other",
    miscellaneous: "other",
    general: "other",
  };

  return reverseMap[trimmed] || reverseMap[cleanSpaced] || reverseMap[cleanUnderscored];
}

/**
 * Comprehensive Multi-Sheet / CSV Excel Import Parser & Validator
 */
export async function validateAndParsePurchaseExcel(
  context: CommerceContext,
  fileInput: string | ArrayBuffer | Uint8Array,
  fileName: string,
  existingVendors: Vendor[],
  existingProducts: CatalogProductLookup[] = [],
): Promise<ExcelImportValidationResult> {
  const errors: ExcelImportRowError[] = [];
  const warnings: string[] = [];
  const lowerName = fileName.toLowerCase();

  let sheets: Record<string, string[][]> = {};

  try {
    let wb: XLSX.WorkBook | null = null;

    if (typeof fileInput === "string") {
      const isCsv = lowerName.endsWith(".csv");
      const isBase64 =
        fileInput.startsWith("UEsDB") ||
        fileInput.startsWith("7zXZ") ||
        /^[A-Za-z0-9+/=]{100,}$/.test(
          fileInput.slice(0, 200).replace(/\s/g, ""),
        );
      const isPkZip =
        fileInput.startsWith("PK") || fileInput.startsWith("\x50\x4B");

      if (isCsv && !isBase64 && !isPkZip) {
        sheets["Purchase Bills"] = parseCsvRows(fileInput);
      } else if (isBase64) {
        wb = XLSX.read(Buffer.from(fileInput, "base64"), {
          type: "buffer",
          cellDates: true,
        });
      } else if (isPkZip) {
        wb = XLSX.read(Buffer.from(fileInput, "binary"), {
          type: "buffer",
          cellDates: true,
        });
      } else {
        wb = XLSX.read(fileInput, { type: "string", cellDates: true });
      }
    } else {
      wb = XLSX.read(fileInput, { type: "array", cellDates: true });
    }

    if (wb) {
      sheets = extractWorksheetsFromWorkbook(wb);
    }
  } catch (err) {
    errors.push({
      sheet: "File",
      rowNumber: 1,
      invoiceNumber: "FILE_READ",
      field: "Format",
      problem:
        err instanceof Error ? err.message : "Failed to parse workbook format.",
      suggestedFix: "Ensure the file is a genuine .xlsx, .xls, or .csv file.",
    });
    return {
      isValid: false,
      totalInvoicesCount: 0,
      totalItemsCount: 0,
      totalChargesCount: 0,
      totalGrandAmount: 0,
      bills: [],
      errors,
      warnings,
    };
  }

  // Find Sheet 1 (Purchase Bills), Sheet 2 (Purchase Items), Sheet 3 (Charges)
  let sheetBills =
    sheets["Purchase Bills"] ||
    sheets["PurchaseBills"] ||
    sheets["Bills"] ||
    [];
  const sheetItems =
    sheets["Purchase Items"] ||
    sheets["PurchaseItems"] ||
    sheets["Items"] ||
    [];
  const sheetCharges = sheets["Charges"] || [];

  if (sheetBills.length === 0 && Object.keys(sheets).length > 0) {
    const firstKey = Object.keys(sheets)[0]!;
    sheetBills = sheets[firstKey] || [];
  }

  if (sheetBills.length < 2) {
    errors.push({
      sheet: "Purchase Bills",
      rowNumber: 1,
      invoiceNumber: "HEADER",
      field: "Rows",
      problem: "No data rows found in Purchase Bills sheet.",
      suggestedFix:
        "Download official template, fill invoice rows, and re-upload.",
    });
    return {
      isValid: false,
      totalInvoicesCount: 0,
      totalItemsCount: 0,
      totalChargesCount: 0,
      totalGrandAmount: 0,
      bills: [],
      errors,
      warnings,
    };
  }

  // Header normalization helper
  const s1Header = sheetBills[0]!.map((h) => h.toLowerCase().trim());
  const idxOf = (headers: string[], target: string) =>
    headers.findIndex(
      (h) =>
        h === target ||
        h.replace(/\s+/g, "") === target.replace(/\s+/g, "") ||
        h.replace(/[^a-z0-9]/gi, "") === target.replace(/[^a-z0-9]/gi, ""),
    );

  const isLegacySingleSheet =
    idxOf(s1Header, "vendor") >= 0 &&
    idxOf(s1Header, "item") >= 0 &&
    idxOf(s1Header, "invoice number") < 0;

  if (isLegacySingleSheet) {
    return parseLegacySingleSheet(context, sheetBills, existingVendors);
  }

  // Standard Multi-Sheet Importer Header Matching
  const bInvIdx = idxOf(s1Header, "invoice number");
  const bDateIdx =
    idxOf(s1Header, "invoice date") >= 0
      ? idxOf(s1Header, "invoice date")
      : idxOf(s1Header, "bill date");
  const bVendorCodeIdx =
    idxOf(s1Header, "vendor code") >= 0
      ? idxOf(s1Header, "vendor code")
      : idxOf(s1Header, "vendorcode") >= 0
        ? idxOf(s1Header, "vendorcode")
        : idxOf(s1Header, "supplier code");
  const bVendorIdx =
    idxOf(s1Header, "supplier name") >= 0
      ? idxOf(s1Header, "supplier name")
      : idxOf(s1Header, "vendor name") >= 0
        ? idxOf(s1Header, "vendor name")
        : idxOf(s1Header, "vendor");
  const bTypeIdx = idxOf(s1Header, "purchase type");
  const bVenInvIdx = idxOf(s1Header, "vendor invoice number");
  const bDueIdx = idxOf(s1Header, "due date");
  const bPayMethodIdx = idxOf(s1Header, "payment method");
  const bPayIdIdx = idxOf(s1Header, "payment id");
  const bPoRefIdx = idxOf(s1Header, "po reference");
  const bDeptIdx = idxOf(s1Header, "department");
  const bCostCenterIdx = idxOf(s1Header, "cost center");
  const bDiscIdx = idxOf(s1Header, "discount amount");
  const bFreightIdx = idxOf(s1Header, "freight amount");
  const bAllocLandedIdx = idxOf(s1Header, "allocate freight to landed cost");
  const bOtherIdx = idxOf(s1Header, "other charges");
  const bNotesIdx = idxOf(s1Header, "notes");
  const bBillUploadIdx = idxOf(s1Header, "bill upload name");

  if (bInvIdx < 0 || (bVendorIdx < 0 && bVendorCodeIdx < 0)) {
    errors.push({
      sheet: "Purchase Bills",
      rowNumber: 1,
      invoiceNumber: "Header",
      field: "Columns",
      problem:
        "Missing required header columns 'Invoice Number' and 'Vendor Code' (or 'Supplier Name').",
      suggestedFix:
        "Use official template headers: Vendor Code, Supplier Name, Invoice Number, Invoice Date, Purchase Type.",
    });
    return {
      isValid: false,
      totalInvoicesCount: 0,
      totalItemsCount: 0,
      totalChargesCount: 0,
      totalGrandAmount: 0,
      bills: [],
      errors,
      warnings,
    };
  }

  // Parse Sheet 2 (Purchase Items)
  const itemsByInvoice: Record<
    string,
    Array<{ rowNum: number; values: string[] }>
  > = {};
  if (sheetItems.length > 1) {
    const s2Header = sheetItems[0]!.map((h) => h.toLowerCase().trim());
    const iInvIdx = idxOf(s2Header, "invoice number");
    if (iInvIdx >= 0) {
      for (let r = 1; r < sheetItems.length; r++) {
        const row = sheetItems[r]!;
        const invNum = row[iInvIdx]?.trim();
        if (invNum) {
          if (!itemsByInvoice[invNum]) itemsByInvoice[invNum] = [];
          itemsByInvoice[invNum]!.push({ rowNum: r + 1, values: row });
        }
      }
    }
  }

  // Parse Sheet 3 (Charges)
  const chargesByInvoice: Record<
    string,
    Array<{ rowNum: number; values: string[] }>
  > = {};
  if (sheetCharges.length > 1) {
    const s3Header = sheetCharges[0]!.map((h) => h.toLowerCase().trim());
    const cInvIdx = idxOf(s3Header, "invoice number");
    if (cInvIdx >= 0) {
      for (let r = 1; r < sheetCharges.length; r++) {
        const row = sheetCharges[r]!;
        const invNum = row[cInvIdx]?.trim();
        if (invNum) {
          if (!chargesByInvoice[invNum]) chargesByInvoice[invNum] = [];
          chargesByInvoice[invNum]!.push({ rowNum: r + 1, values: row });
        }
      }
    }
  }

  const parsedBills: ExcelImportParsedBill[] = [];
  const processedInvoiceNumbers = new Set<string>();

  for (let r = 1; r < sheetBills.length; r++) {
    const row = sheetBills[r]!;
    const rowNum = r + 1;
    const invoiceNumber = row[bInvIdx]?.trim() ?? "";
    if (!invoiceNumber) {
      errors.push({
        sheet: "Purchase Bills",
        rowNumber: rowNum,
        invoiceNumber: "EMPTY",
        field: "Invoice Number",
        problem: "Invoice Number cannot be empty.",
        suggestedFix: "Provide a unique Invoice Number (e.g. INV-1001).",
      });
      continue;
    }

    if (processedInvoiceNumbers.has(invoiceNumber.toLowerCase())) {
      errors.push({
        sheet: "Purchase Bills",
        rowNumber: rowNum,
        invoiceNumber,
        field: "Invoice Number",
        problem: `Duplicate Invoice Number '${invoiceNumber}' in Excel sheet.`,
        suggestedFix: "Combine items under the same Invoice Number on Sheet 2.",
      });
      continue;
    }
    processedInvoiceNumbers.add(invoiceNumber.toLowerCase());

    const excelVendorCode =
      bVendorCodeIdx >= 0 ? row[bVendorCodeIdx]?.trim() : undefined;
    const supplierName = (bVendorIdx >= 0 ? row[bVendorIdx]?.trim() : "") || "";

    let vendor: Vendor | undefined = undefined;

    // PHASE 4: Authoritative Vendor Code Lookup
    if (excelVendorCode && excelVendorCode.length > 0) {
      vendor = existingVendors.find(
        (v) =>
          getVendorCode(v).toLowerCase() === excelVendorCode.toLowerCase() ||
          v.id.toLowerCase() === excelVendorCode.toLowerCase() ||
          (v.code && v.code.toLowerCase() === excelVendorCode.toLowerCase()),
      );

      if (vendor) {
        if (supplierName && supplierName.length > 0) {
          if (
            vendor.name.trim().toLowerCase() !==
            supplierName.trim().toLowerCase()
          ) {
            warnings.push(
              `Row ${rowNum} (${invoiceNumber}): Vendor Code '${excelVendorCode}' matches '${vendor.name}' in database, but Excel specified Supplier Name '${supplierName}'. Vendor Code remains authoritative.`,
            );
          }
        }
      } else {
        errors.push({
          sheet: "Purchase Bills",
          rowNumber: rowNum,
          invoiceNumber,
          field: "Vendor Code",
          problem: `Supplier with Vendor Code '${excelVendorCode}' not found in active Vendor master database.`,
          suggestedFix:
            "Verify Vendor Code in Vendor Master or create the vendor first.",
        });
      }
    } else if (supplierName && supplierName.length > 0) {
      vendor = existingVendors.find(
        (v) => v.name.trim().toLowerCase() === supplierName.toLowerCase(),
      );
      if (vendor) {
        warnings.push(
          `Row ${rowNum} (${invoiceNumber}): Missing Vendor Code. Resolved via Supplier Name '${supplierName}' (${getVendorCode(vendor)}). Please include Vendor Code in production imports.`,
        );
      } else {
        errors.push({
          sheet: "Purchase Bills",
          rowNumber: rowNum,
          invoiceNumber,
          field: "Supplier Name",
          problem: `Supplier '${supplierName}' not found in active Vendor master database.`,
          suggestedFix:
            "Create vendor in Vendors Directory first, or fix spelling / include Vendor Code.",
        });
      }
    } else {
      errors.push({
        sheet: "Purchase Bills",
        rowNumber: rowNum,
        invoiceNumber,
        field: "Vendor Code / Supplier Name",
        problem: "Both Vendor Code and Supplier Name are missing.",
        suggestedFix:
          "Provide a valid Vendor Code (e.g. VEN-00000001) or Supplier Name.",
      });
    }

    // PHASE 4: Enforce Vendor Security Status (ACTIVE / BLOCKED / INACTIVE)
    if (vendor && vendor.status !== "active") {
      errors.push({
        sheet: "Purchase Bills",
        rowNumber: rowNum,
        invoiceNumber,
        field: "Vendor Status",
        problem: `Vendor ${vendor.name} (${getVendorCode(vendor)}) is ${vendor.status.toUpperCase()} by Owner. Purchase Bill cannot be imported.`,
        suggestedFix:
          vendor.status === "blocked"
            ? "Unblock the vendor in Vendor Master or request Owner Approval."
            : "Activate the vendor in Vendor Master first.",
      });
    }

    const rawTypeStr = row[bTypeIdx]?.trim() || "";
    let purchaseType = normalizePurchaseType(rawTypeStr);

    if (!purchaseType) {
      errors.push({
        sheet: "Purchase Bills",
        rowNumber: rowNum,
        invoiceNumber,
        field: "Purchase Type",
        problem: `Purchase Type '${rawTypeStr}' is not recognized.`,
        suggestedFix:
          "Use a valid purchase type like 'Inventory Products', 'Asset', 'Service', etc.",
      });
      purchaseType = "inventory_product";
    }

    const billDate = normalizeDateValue(row[bDateIdx]);
    const dueDate =
      bDueIdx >= 0 && row[bDueIdx]
        ? normalizeDateValue(row[bDueIdx])
        : undefined;
    const vendorInvoiceNumber = row[bVenInvIdx]?.trim() || invoiceNumber;
    const rawMethod = (row[bPayMethodIdx]?.trim() || "credit").toLowerCase();
    const paymentMethod = (
      [
        "unpaid",
        "cash",
        "upi",
        "cheque",
        "neft_rtgs",
        "card",
        "wallet",
        "credit",
      ].includes(rawMethod)
        ? rawMethod
        : "credit"
    ) as PaymentMethod;

    const paymentId = row[bPayIdIdx]?.trim() || undefined;
    const poReference = row[bPoRefIdx]?.trim() || undefined;
    const department = row[bDeptIdx]?.trim() || undefined;
    const costCenter = row[bCostCenterIdx]?.trim() || undefined;
    const discountAmount = Math.max(0, parseExcelNumber(row[bDiscIdx]));
    let freightAmount = Math.max(0, parseExcelNumber(row[bFreightIdx]));
    let otherCharges = Math.max(0, parseExcelNumber(row[bOtherIdx]));
    let allocateFreightToLandedCost =
      (row[bAllocLandedIdx]?.trim() || "").toLowerCase() === "yes" ||
      (row[bAllocLandedIdx]?.trim() || "").toLowerCase() === "true";
    const notes = row[bNotesIdx]?.trim() || undefined;
    const billUploadName =
      bBillUploadIdx >= 0
        ? row[bBillUploadIdx]?.trim() || undefined
        : undefined;

    // Process Sheet 3 Charges for this Invoice Number
    const invoiceCharges = chargesByInvoice[invoiceNumber] || [];
    if (sheetCharges.length > 1 && invoiceCharges.length > 0) {
      const s3Header = sheetCharges[0]!.map((h) => h.toLowerCase().trim());
      const cTypeIdx = idxOf(s3Header, "charge type");
      const cAmtIdx = idxOf(s3Header, "amount");
      const cLandedIdx = idxOf(s3Header, "landed cost allocation");

      for (const chg of invoiceCharges) {
        const cType = (chg.values[cTypeIdx]?.trim() || "other").toLowerCase();
        const amt = Math.max(0, parseExcelNumber(chg.values[cAmtIdx]));
        const isLanded =
          (chg.values[cLandedIdx]?.trim() || "").toLowerCase() === "yes";

        if (cType.includes("freight") || cType.includes("shipping")) {
          freightAmount += amt;
          if (isLanded) allocateFreightToLandedCost = true;
        } else {
          otherCharges += amt;
        }
      }
    }

    // Process Sheet 2 Items for this Invoice Number
    const rawItems = itemsByInvoice[invoiceNumber] || [];
    const lines: ExcelImportParsedBill["lines"] = [];

    if (rawItems.length === 0) {
      errors.push({
        sheet: "Purchase Items",
        rowNumber: 1,
        invoiceNumber,
        field: "Items",
        problem: `Invoice '${invoiceNumber}' has no line items on Sheet 2 'Purchase Items'.`,
        suggestedFix:
          "Add at least one item row on Sheet 2 with Invoice Number matching.",
      });
    } else {
      const s2Header = sheetItems[0]!.map((h) => h.toLowerCase().trim());
      const iDescIdx =
        idxOf(s2Header, "description") >= 0
          ? idxOf(s2Header, "description")
          : idxOf(s2Header, "item name");
      const iSkuIdx = idxOf(s2Header, "sku");
      const iHsnIdx = idxOf(s2Header, "hsn");
      const iQtyIdx =
        idxOf(s2Header, "quantity") >= 0
          ? idxOf(s2Header, "quantity")
          : idxOf(s2Header, "qty");
      const iUomIdx = idxOf(s2Header, "uom");
      const iPriceIdx =
        idxOf(s2Header, "unit price") >= 0
          ? idxOf(s2Header, "unit price")
          : idxOf(s2Header, "rate");
      const iGstIdx = idxOf(s2Header, "gst rate");
      const iIntentIdx = idxOf(s2Header, "intent");

      for (let i = 0; i < rawItems.length; i++) {
        const itemObj = rawItems[i]!;
        const itemVals = itemObj.values;
        const itemRowNum = itemObj.rowNum;

        const description = itemVals[iDescIdx]?.trim() || "";
        if (!description) {
          errors.push({
            sheet: "Purchase Items",
            rowNumber: itemRowNum,
            invoiceNumber,
            field: "Description",
            problem: "Item Description / Name cannot be empty.",
            suggestedFix: "Enter item description.",
          });
        }

        const quantity = parseExcelNumber(itemVals[iQtyIdx]);
        if (!Number.isFinite(quantity) || quantity <= 0) {
          errors.push({
            sheet: "Purchase Items",
            rowNumber: itemRowNum,
            invoiceNumber,
            field: "Quantity",
            problem: `Invalid quantity '${itemVals[iQtyIdx]}'. Must be > 0.`,
            suggestedFix: "Enter a positive number for quantity.",
          });
        }

        const unitPrice = parseExcelNumber(itemVals[iPriceIdx]);
        if (!Number.isFinite(unitPrice) || unitPrice < 0) {
          errors.push({
            sheet: "Purchase Items",
            rowNumber: itemRowNum,
            invoiceNumber,
            field: "Unit Price",
            problem: `Invalid unit price '${itemVals[iPriceIdx]}'. Must be >= 0.`,
            suggestedFix: "Enter valid cost price.",
          });
        }

        const rawUom = (itemVals[iUomIdx]?.trim() || "pcs").toLowerCase();
        const uom: PurchaseUom = PURCHASE_UOM_OPTIONS.some((o) => o.value === rawUom)
          ? (rawUom as PurchaseUom)
          : "pcs";

        const sku = itemVals[iSkuIdx]?.trim() || undefined;
        let productId: string | undefined = undefined;

        // PHASE 5: Master Product / SKU Lookup
        if (sku && sku.length > 0) {
          const match = existingProducts.find(
            (p) => p.sku.trim().toLowerCase() === sku.toLowerCase(),
          );
          if (match) {
            productId = match.id;
          } else if (existingProducts.length > 0) {
            errors.push({
              sheet: "Purchase Items",
              rowNumber: itemRowNum,
              invoiceNumber,
              field: "SKU",
              problem: `SKU '${sku}' not found in Master Product Catalog.`,
              suggestedFix:
                "Verify SKU in Master Catalog or create product first.",
            });
          }
        }

        const hsn = itemVals[iHsnIdx]?.trim() || undefined;
        const rawGst = parseExcelNumber(itemVals[iGstIdx], 18);
        const gstRate = normalizeGstRate(Number.isFinite(rawGst) ? rawGst : 18);

        const defaultIntent =
          vendor?.defaultPurchaseIntent ||
          resolveIntentFromPurchaseType(purchaseType);
        let rawIntent = itemVals[iIntentIdx]?.trim()?.toLowerCase();

        let intent: BusinessIntent;
        if (!rawIntent) {
          intent = defaultIntent as BusinessIntent;
        } else if (ALL_BUSINESS_INTENTS.includes(rawIntent as BusinessIntent)) {
          intent = rawIntent as BusinessIntent;
        } else {
          intent = defaultIntent as BusinessIntent;
        }

        if (
          vendor?.allowedPurchaseIntents &&
          vendor.allowedPurchaseIntents.length > 0
        ) {
          if (!vendor.allowedPurchaseIntents.includes(intent)) {
            errors.push({
              sheet: "Purchase Items",
              rowNumber: itemRowNum,
              invoiceNumber,
              field: "Intent",
              problem: `Line intent '${intent}' is not allowed for vendor '${vendor.name}'.`,
              suggestedFix: `Allowed intents are: ${vendor.allowedPurchaseIntents.join(", ")}.`,
            });
          }
        }

        const freightMode: FreightAllocationMode | undefined =
          allocateFreightToLandedCost && isStockPathType(purchaseType)
            ? "landed_cost"
            : undefined;

        lines.push({
          lineNumber: i + 1,
          description,
          sku,
          hsn,
          productId,
          quantity,
          uom,
          unitPrice,
          gstRate,
          intent,
          freightMode,
        });
      }
    }

    // Pre-calculate server totals for Preview using backend GST rules
    const rawSubtotal = lines.reduce(
      (sum, l) => sum + l.quantity * l.unitPrice,
      0,
    );
    const discRatio =
      rawSubtotal > 0 ? Math.min(discountAmount / rawSubtotal, 1) : 0;
    const taxableTotal = rawSubtotal * (1 - discRatio);
    const estTax = lines.reduce(
      (sum, l) =>
        sum + l.quantity * l.unitPrice * (1 - discRatio) * (l.gstRate / 100),
      0,
    );
    const estTotal = Number(
      (taxableTotal + estTax + freightAmount + otherCharges).toFixed(2),
    );

    const intentBreakdown: Record<string, number> = {};
    for (const line of lines) {
      intentBreakdown[line.intent] =
        (intentBreakdown[line.intent] || 0) + line.quantity;
    }

    parsedBills.push({
      invoiceNumber,
      vendorName: vendor ? vendor.name : supplierName,
      vendorCode: vendor ? getVendorCode(vendor) : excelVendorCode,
      vendorId: vendor?.id,
      vendorInvoiceNumber,
      billDate,
      dueDate,
      purchaseType,
      paymentMethod,
      paymentId,
      poReference,
      department,
      costCenter,
      discountAmount,
      freightAmount,
      allocateFreightToLandedCost,
      otherCharges,
      notes,
      billUploadName,
      lines,
      previewSubtotal: Number(rawSubtotal.toFixed(2)),
      previewTax: Number(estTax.toFixed(2)),
      previewTotal: estTotal,
      intentBreakdown,
    });
  }

  const totalItemsCount = parsedBills.reduce(
    (sum, b) => sum + b.lines.length,
    0,
  );
  const totalGrandAmount = Number(
    parsedBills.reduce((sum, b) => sum + b.previewTotal, 0).toFixed(2),
  );

  return {
    isValid: errors.length === 0,
    totalInvoicesCount: parsedBills.length,
    totalItemsCount,
    totalChargesCount: sheetCharges.length > 1 ? sheetCharges.length - 1 : 0,
    totalGrandAmount,
    bills: parsedBills,
    errors,
    warnings,
  };
}

/**
 * Legacy single-sheet CSV parser (`vendor, item, qty, rate, date, type`)
 */
async function parseLegacySingleSheet(
  context: CommerceContext,
  rows: string[][],
  existingVendors: Vendor[],
): Promise<ExcelImportValidationResult> {
  const errors: ExcelImportRowError[] = [];
  const warnings: string[] = [];
  const header = rows[0]!.map((h) => h.toLowerCase().trim());

  const idxOf = (name: string) => header.indexOf(name);
  const vendorIdx = idxOf("vendor");
  const itemIdx = idxOf("item");
  const qtyIdx = idxOf("qty");
  const rateIdx = idxOf("rate");
  const dateIdx = idxOf("date");
  const typeIdx = idxOf("type");

  const parsedBills: ExcelImportParsedBill[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r]!;
    const rowNum = r + 1;
    const vendorName = row[vendorIdx]?.trim() ?? "";
    const itemName = row[itemIdx]?.trim() ?? "";
    const quantity = parseExcelNumber(row[qtyIdx]);
    const unitPrice = parseExcelNumber(row[rateIdx]);

    if (!vendorName || !itemName) continue;

    const vendor = existingVendors.find(
      (v) => v.name.trim().toLowerCase() === vendorName.toLowerCase(),
    );
    if (!vendor) {
      errors.push({
        sheet: "Sheet1",
        rowNumber: rowNum,
        invoiceNumber: `ROW-${rowNum}`,
        field: "vendor",
        problem: `Vendor '${vendorName}' not found in active Vendor master database.`,
        suggestedFix: "Create vendor in Vendors Directory first.",
      });
    }

    const rawType = row[typeIdx]?.trim() || "inventory_product";
    const purchaseType =
      normalizePurchaseType(rawType) || "inventory_product";

    const billDate = normalizeDateValue(row[dateIdx]);

    parsedBills.push({
      invoiceNumber: `CSV-INV-${1000 + r}`,
      vendorName,
      vendorId: vendor?.id,
      vendorInvoiceNumber: `CSV-INV-${1000 + r}`,
      billDate,
      purchaseType,
      paymentMethod: "unpaid",
      discountAmount: 0,
      freightAmount: 0,
      allocateFreightToLandedCost: false,
      otherCharges: 0,
      lines: [
        {
          lineNumber: 1,
          description: itemName,
          quantity,
          uom: "pcs",
          unitPrice,
          gstRate: 18,
          intent: resolveIntentFromPurchaseType(purchaseType),
        },
      ],
      previewSubtotal: quantity * unitPrice,
      previewTax: quantity * unitPrice * 0.18,
      previewTotal: quantity * unitPrice * 1.18,
      intentBreakdown: {
        [resolveIntentFromPurchaseType(purchaseType)]: quantity,
      },
    });
  }

  const totalItemsCount = parsedBills.reduce(
    (sum, b) => sum + b.lines.length,
    0,
  );
  const totalGrandAmount = Number(
    parsedBills.reduce((sum, b) => sum + b.previewTotal, 0).toFixed(2),
  );

  return {
    isValid: errors.length === 0,
    totalInvoicesCount: parsedBills.length,
    totalItemsCount,
    totalChargesCount: 0,
    totalGrandAmount,
    bills: parsedBills,
    errors,
    warnings,
  };
}
