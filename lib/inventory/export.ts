import type { StockBalance } from "./types";

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
  "SKU",
  "Product",
  "Warehouse",
  "Available",
  "Reserved",
  "Incoming",
  "Damaged",
  "In Transit",
  "Total",
  "Updated At",
] as const;

/** Excel-compatible SpreadsheetML (.xls). */
export function buildInventoryExcel(rows: StockBalance[]): {
  filename: string;
  contentType: string;
  body: string;
} {
  const excelRows: string[] = [];
  excelRows.push(
    `<Row>${HEADERS.map((header) => cell(header)).join("")}</Row>`,
  );

  for (const row of rows) {
    const total =
      row.available +
      row.reserved +
      row.incoming +
      row.damaged +
      row.inTransit;
    excelRows.push(
      `<Row>${[
        row.sku,
        row.productName,
        row.warehouseId,
        row.available,
        row.reserved,
        row.incoming,
        row.damaged,
        row.inTransit,
        total,
        row.updatedAt,
      ]
        .map((value) => cell(value))
        .join("")}</Row>`,
    );
  }

  const body = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Inventory">
  <Table>
${excelRows.join("\n")}
  </Table>
 </Worksheet>
</Workbook>`;

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    filename: `commerceos-inventory-${stamp}.xls`,
    contentType: "application/vnd.ms-excel",
    body,
  };
}
