import type { Order } from "./types";

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
  "Order Number",
  "External ID",
  "Channel",
  "Status",
  "Payment",
  "Warehouse",
  "SKU",
  "Product",
  "Quantity",
  "Unit Price",
  "Subtotal",
  "Currency",
  "AWB",
  "Tracking",
  "Courier",
  "Return Kind",
  "Return Status",
  "Return Reason",
  "Received At",
  "Updated At",
] as const;

/** Excel-compatible SpreadsheetML (.xls) — opens natively in Excel. */
export function buildOrdersExcel(orders: Order[]): {
  filename: string;
  contentType: string;
  body: string;
} {
  const rows: string[] = [];
  rows.push(`<Row>${HEADERS.map((header) => cell(header)).join("")}</Row>`);

  for (const order of orders) {
    const returnKind = order.returnCase?.kind ?? "";
    const returnStatus = order.returnCase?.status ?? "";
    const returnReason = order.returnCase?.reason ?? "";
    const awb = order.shipping?.awb ?? "";
    const tracking = order.shipping?.trackingNumber ?? "";
    const courier = order.shipping?.courier ?? "";

    if (order.lines.length === 0) {
      rows.push(
        `<Row>${[
          order.orderNumber,
          order.externalOrderId ?? "",
          order.channel,
          order.status,
          order.paymentStatus,
          order.warehouseId ?? "",
          "",
          "",
          0,
          0,
          order.totals.subtotal,
          order.totals.currency,
          awb,
          tracking,
          courier,
          returnKind,
          returnStatus,
          returnReason,
          order.createdAt,
          order.updatedAt,
        ]
          .map((value) => cell(value as string | number))
          .join("")}</Row>`,
      );
      continue;
    }

    for (const line of order.lines) {
      rows.push(
        `<Row>${[
          order.orderNumber,
          order.externalOrderId ?? "",
          order.channel,
          order.status,
          order.paymentStatus,
          order.warehouseId ?? "",
          line.sku,
          line.productName,
          line.quantity,
          line.unitPrice,
          order.totals.subtotal,
          order.totals.currency,
          awb,
          tracking,
          courier,
          returnKind,
          returnStatus,
          returnReason,
          order.createdAt,
          order.updatedAt,
        ]
          .map((value) => cell(value as string | number))
          .join("")}</Row>`,
      );
    }
  }

  const body = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Worksheet ss:Name="Orders">
  <Table>
${rows.join("\n")}
  </Table>
 </Worksheet>
</Workbook>
`;

  const stamp = new Date().toISOString().slice(0, 10);
  return {
    filename: `commerceos-orders-${stamp}.xls`,
    contentType: "application/vnd.ms-excel; charset=utf-8",
    body,
  };
}

export function orderCreatedInRange(
  order: Order,
  dateFrom?: string,
  dateTo?: string,
) {
  const created = new Date(order.createdAt).getTime();
  if (dateFrom) {
    const start = new Date(`${dateFrom}T00:00:00`).getTime();
    if (created < start) return false;
  }
  if (dateTo) {
    const end = new Date(`${dateTo}T23:59:59.999`).getTime();
    if (created > end) return false;
  }
  return true;
}
