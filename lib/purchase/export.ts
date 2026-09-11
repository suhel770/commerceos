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

const BILL_HEADERS = [
  "Bill Number",
  "Vendor Invoice",
  "Date",
  "Type",
  "Vendor",
  "Status",
  "Payment",
  "Payment Method",
  "Payment Date",
  "Payment ID",
  "Items Count",
  "Total Qty",
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

const ITEM_HEADERS = [
  "Bill Number",
  "Vendor Invoice",
  "Bill Date",
  "Vendor",
  "Bill Type",
  "Bill Status",
  "Line #",
  "Item / Description",
  "SKU",
  "HSN",
  "Quantity",
  "UOM",
  "Unit Price",
  "Subtotal",
  "Damaged Qty",
  "Sellable Qty",
  "GST Rate (%)",
  "Tax Amount",
  "CGST",
  "SGST",
  "IGST",
  "Line Total",
  "Intent",
] as const;

/** Exports list of Purchase Bills as a genuine 2-sheet OpenXML .xlsx workbook (Bills + Bill Items) */
export function buildPurchaseBillsExcel(bills: PurchaseBill[]): {
  filename: string;
  contentType: string;
  body: Uint8Array;
} {
  const billRows: Array<Array<string | number>> = [];
  const itemRows: Array<Array<string | number>> = [];

  for (const bill of bills) {
    const lines = bill.lines ?? [];
    const totalQty = lines.reduce((acc, l) => acc + (Number(l.quantity) || 0), 0);

    // Sheet 1: Bill summary row
    billRows.push([
      bill.billNumber,
      bill.vendorInvoiceNumber ?? "",
      bill.billDate,
      PURCHASE_TYPE_LABELS[bill.purchaseType] || bill.purchaseType,
      bill.vendorName,
      PURCHASE_STATUS_LABELS[bill.status] || bill.status,
      bill.paymentStatus,
      bill.paymentMethod ?? "",
      bill.paymentDate ?? "",
      bill.paymentId ?? "",
      lines.length,
      totalQty,
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

    // Sheet 2: Item-level rows linked to this bill
    lines.forEach((line, idx) => {
      const qty = Number(line.quantity) || 0;
      const damaged = Number(line.qtyDamaged) || 0;
      const sellable = Math.max(0, qty - damaged);
      const amount = Number(line.amount) || (qty * (Number(line.unitPrice) || 0));
      const taxAmount = Number(line.taxAmount) || 0;
      const lineTotal = Number((amount + taxAmount).toFixed(2));

      itemRows.push([
        bill.billNumber,
        bill.vendorInvoiceNumber ?? "",
        bill.billDate,
        bill.vendorName,
        PURCHASE_TYPE_LABELS[bill.purchaseType] || bill.purchaseType,
        PURCHASE_STATUS_LABELS[bill.status] || bill.status,
        idx + 1,
        line.description || "—",
        line.sku ?? "",
        line.hsn ?? "",
        qty,
        line.uom || "pcs",
        Number(line.unitPrice) || 0,
        amount,
        damaged,
        sellable,
        Number(line.gstRate) || 0,
        taxAmount,
        Number(line.cgstAmount) || 0,
        Number(line.sgstAmount) || 0,
        Number(line.igstAmount) || 0,
        lineTotal,
        line.intent || "",
      ]);
    });
  }

  const wb = XLSX.utils.book_new();

  // 1. Append Sheet 1: Bills
  const wsBills = XLSX.utils.aoa_to_sheet([Array.from(BILL_HEADERS), ...billRows]);
  wsBills["!cols"] = [
    { wch: 16 }, // Bill Number
    { wch: 20 }, // Vendor Invoice
    { wch: 14 }, // Date
    { wch: 22 }, // Type
    { wch: 28 }, // Vendor
    { wch: 14 }, // Status
    { wch: 14 }, // Payment
    { wch: 16 }, // Payment Method
    { wch: 14 }, // Payment Date
    { wch: 18 }, // Payment ID
    { wch: 12 }, // Items Count
    { wch: 12 }, // Total Qty
    { wch: 14 }, // Amount Paid
    { wch: 14 }, // Pending
    { wch: 14 }, // Subtotal
    { wch: 14 }, // Discount
    { wch: 14 }, // Tax
    { wch: 14 }, // Freight
    { wch: 14 }, // Other Charges
    { wch: 14 }, // Total
    { wch: 14 }, // Due Date
    { wch: 30 }, // Notes
  ];
  XLSX.utils.book_append_sheet(wb, wsBills, "Bills");

  // 2. Append Sheet 2: Bill Items
  const wsItems = XLSX.utils.aoa_to_sheet([Array.from(ITEM_HEADERS), ...itemRows]);
  wsItems["!cols"] = [
    { wch: 16 }, // Bill Number
    { wch: 20 }, // Vendor Invoice
    { wch: 14 }, // Bill Date
    { wch: 28 }, // Vendor
    { wch: 20 }, // Bill Type
    { wch: 14 }, // Bill Status
    { wch: 8 },  // Line #
    { wch: 32 }, // Item / Description
    { wch: 20 }, // SKU
    { wch: 14 }, // HSN
    { wch: 12 }, // Quantity
    { wch: 10 }, // UOM
    { wch: 14 }, // Unit Price
    { wch: 14 }, // Subtotal
    { wch: 14 }, // Damaged Qty
    { wch: 14 }, // Sellable Qty
    { wch: 14 }, // GST Rate (%)
    { wch: 14 }, // Tax Amount
    { wch: 12 }, // CGST
    { wch: 12 }, // SGST
    { wch: 12 }, // IGST
    { wch: 14 }, // Line Total
    { wch: 18 }, // Intent
  ];
  XLSX.utils.book_append_sheet(wb, wsItems, "Bill Items");

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
