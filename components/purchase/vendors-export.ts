/**
 * Vendor Export Utility (Excel SpreadsheetML / CSV)
 * Exports selected or all vendors with complete registration & financial statistics.
 */

import { VENDOR_REGISTRATION_TYPE_LABELS, formatPurchaseMoney, getVendorCode, type VendorWithStats } from "@/lib/purchase";

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function cell(value?: string | number | null) {
  if (value === undefined || value === null) {
    return `<Cell><Data ss:Type="String"></Data></Cell>`;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<Cell><Data ss:Type="Number">${value}</Data></Cell>`;
  }
  return `<Cell><Data ss:Type="String">${escapeXml(String(value))}</Data></Cell>`;
}

const HEADERS = [
  "Vendor Code",
  "Vendor Name",
  "Registration Type",
  "GSTIN",
  "PAN",
  "Phone",
  "Email",
  "Contact Person",
  "Address",
  "City",
  "State",
  "Pincode",
  "Bank Name",
  "Account Name",
  "Account Number",
  "IFSC Code",
  "Status",
  "Total Bills",
  "Total Spend",
  "Stock Spend",
  "Expense Spend",
  "Outstanding Balance",
] as const;

export function buildVendorsExcel(rows: VendorWithStats[]): {
  filename: string;
  contentType: string;
  body: string;
} {
  const excelRows: string[] = [];
  excelRows.push(
    `<Row>${HEADERS.map((header) => cell(header)).join("")}</Row>`,
  );

  for (const item of rows) {
    excelRows.push(
      `<Row>${[
        getVendorCode(item),
        item.name,
        VENDOR_REGISTRATION_TYPE_LABELS[item.registrationType] ?? item.registrationType,
        item.gstin ?? "",
        item.pan ?? "",
        item.phone ?? "",
        item.email ?? "",
        item.contactPerson ?? "",
        item.address ?? "",
        item.city ?? "",
        item.state ?? "",
        item.pincode ?? "",
        item.bankName ?? "",
        item.bankAccountName ?? "",
        item.bankAccountNumber ?? "",
        item.bankIfsc ?? "",
        item.status === "active" ? "Active (Purchasable)" : item.status === "blocked" ? "Blocked" : "Inactive",
        item.purchaseCount,
        item.totalPurchaseAmount ?? 0,
        (item.totalPurchaseAmount ?? 0) - (item.totalExpenseAmount ?? 0),
        item.totalExpenseAmount ?? 0,
        item.outstandingBalance,
      ]
        .map((value) => cell(value))
        .join("")}</Row>`,
    );
  }

  const body = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Vendors">
  <Table>
${excelRows.join("\n")}
  </Table>
 </Worksheet>
</Workbook>`;

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    filename: `commerceos-vendors-${stamp}.xls`,
    contentType: "application/vnd.ms-excel",
    body,
  };
}

export function downloadVendorsExport(vendors: VendorWithStats[], isSelectedOnly: boolean = false) {
  const exportData = buildVendorsExcel(vendors);
  const blob = new Blob([exportData.body as any], { type: exportData.contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", isSelectedOnly ? `selected-${exportData.filename}` : exportData.filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
