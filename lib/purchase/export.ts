import * as XLSX from "xlsx";
import {
  PURCHASE_STATUS_LABELS,
  PURCHASE_TYPE_LABELS,
  billAmountPaid,
  billPendingAmount,
  type PurchaseBill,
} from "./types";
import {
  buildOfficialPurchaseImportDemoXlsx,
  buildOfficialPurchaseImportTemplateXlsx,
  type CatalogProductLookup,
} from "./excel-importer";

const HEADERS = [
  "Bill Number",
  "Vendor Invoice",
  "Date",
  "Type",
  "Vendor",
  "Status",
  "Payment",
  "Payment Date",
  "Payment ID",
  "Amount Paid",
  "Pending",
  "Subtotal",
  "Discount",
  "Tax",
  "Freight",
  "Other Charges",
  "Total",
  "Due Date",
  "Notes",
] as const;

/** Exports list of Purchase Bills as a genuine OpenXML .xlsx workbook */
export function buildPurchaseBillsExcel(bills: PurchaseBill[]): {
  filename: string;
  contentType: string;
  body: Uint8Array;
} {
  const rows: Array<Array<string | number>> = [];

  for (const bill of bills) {
    rows.push([
      bill.billNumber,
      bill.vendorInvoiceNumber ?? "",
      bill.billDate,
      PURCHASE_TYPE_LABELS[bill.purchaseType] || bill.purchaseType,
      bill.vendorName,
      PURCHASE_STATUS_LABELS[bill.status] || bill.status,
      bill.paymentStatus,
      bill.paymentDate ?? "",
      bill.paymentId ?? "",
      billAmountPaid(bill),
      billPendingAmount(bill),
      bill.subtotal,
      bill.discountAmount,
      bill.taxAmount,
      bill.freightAmount,
      bill.otherCharges,
      bill.totalAmount,
      bill.dueDate ?? "",
      bill.notes ?? "",
    ]);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([Array.from(HEADERS), ...rows]);
  ws["!cols"] = [
    { wch: 16 },
    { wch: 20 },
    { wch: 14 },
    { wch: 22 },
    { wch: 28 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 30 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Purchases");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const stamp = new Date().toISOString().slice(0, 10);

  return {
    filename: `commerceos-purchases-${stamp}.xlsx`,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    body: new Uint8Array(buffer),
  };
}

/**
 * Official CommerceOS 4-Sheet Excel Template for Purchase Bulk Import (.xlsx)
 */
export function buildPurchaseImportTemplateExcel(
  vendors: { name: string; code?: string; id: string }[] = [],
  products: CatalogProductLookup[] = [],
): {
  filename: string;
  contentType: string;
  body: Uint8Array;
} {
  return buildOfficialPurchaseImportTemplateXlsx(vendors, products);
}

/**
 * Official CommerceOS Demo Workbook for Purchase Bulk Import (.xlsx)
 */
export function buildPurchaseImportDemoExcel(
  vendors: { name: string; code?: string; id: string }[] = [],
  products: CatalogProductLookup[] = [],
): {
  filename: string;
  contentType: string;
  body: Uint8Array;
} {
  return buildOfficialPurchaseImportDemoXlsx(vendors, products);
}

const IMPORT_HEADERS = [
  "vendor",
  "item",
  "qty",
  "rate",
  "date",
  "type",
] as const;

function todayInputDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** CSV twin of the import template (for simple single-sheet legacy tools). */
export function buildPurchaseImportTemplateCsv(
  vendorNames: string[] = [],
): {
  filename: string;
  contentType: string;
  body: string;
} {
  const today = todayInputDate();
  const v = (index: number, fallback: string) =>
    vendorNames[index]?.trim() || fallback;

  const lines = [
    IMPORT_HEADERS.join(","),
    `${v(0, "Nova Footwear Industries")},Dino Clog - Kids,24,189,${today},inventory_product`,
    `${v(1, "PackRight Corrugators")},Corrugated mailer box - Medium,100,18.5,${today},packaging_material`,
    `${v(2, "OfficeMart Wholesale")},A4 copier paper ream,10,320,${today},office_expense`,
    `${v(3, "PixelReach Media")},Meta ads top-up,1,15000,${today},marketing`,
  ];

  return {
    filename: "commerceos-purchase-import-template.csv",
    contentType: "text/csv;charset=utf-8",
    body: lines.join("\n"),
  };
}

const STOCK_HEADERS = [
  "Item",
  "SKU",
  "Purchased qty",
  "Damaged qty",
  "Sellable qty",
  "Unit cost",
  "Damage value",
  "Purchase spend",
  "Available value",
  "Last vendor",
  "Last bill",
  "Last bill date",
  "Source bills",
] as const;

/** Exports Purchase Stocks as a genuine OpenXML .xlsx workbook */
export function buildPurchaseStockExcel(
  rows: Array<{
    description: string;
    sku?: string;
    purchasedQty: number;
    damagedQty: number;
    sellableQty: number;
    unitCost: number;
    damageValue: number;
    purchaseSpend: number;
    lastVendorName: string;
    lastBillNumber: string;
    lastBillDate: string;
    sourceBillCount: number;
  }>,
): {
  filename: string;
  contentType: string;
  body: Uint8Array;
} {
  const excelRows: Array<Array<string | number>> = [];

  for (const row of rows) {
    excelRows.push([
      row.description,
      row.sku ?? "",
      row.purchasedQty,
      row.damagedQty,
      row.sellableQty,
      row.unitCost,
      row.damageValue,
      row.purchaseSpend,
      Number((row.sellableQty * row.unitCost).toFixed(2)),
      row.lastVendorName,
      row.lastBillNumber,
      row.lastBillDate,
      row.sourceBillCount,
    ]);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([Array.from(STOCK_HEADERS), ...excelRows]);
  ws["!cols"] = [
    { wch: 30 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 14 },
    { wch: 16 },
    { wch: 28 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Stocks");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const stamp = new Date().toISOString().slice(0, 10);

  return {
    filename: `commerceos-purchase-stocks-${stamp}.xlsx`,
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    body: new Uint8Array(buffer),
  };
}
