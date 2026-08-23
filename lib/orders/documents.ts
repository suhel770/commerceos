import type { Order, OrderDocumentType } from "./types";

export function buildOrderDocumentStub(
  order: Order,
  type: OrderDocumentType,
) {
  const title = type.replace(/_/g, " ").toUpperCase();
  const body = [
    "========================================",
    `  CommerceOS ${title}`,
    "  (Document stub — live PDF deferred)",
    "========================================",
    "",
    `Order:     ${order.orderNumber}`,
    `External:  ${order.externalOrderId ?? "—"}`,
    `Channel:   ${order.channel}`,
    `Customer:  ${order.customer.name}`,
    `Invoice:   ${order.invoiceNumber ?? "—"}`,
    `Warehouse: ${order.warehouseId ?? "—"}`,
    `Value:     INR ${order.totals.subtotal}`,
    "",
    "Lines:",
    ...order.lines.map(
      (line) => `  - ${line.sku} x ${line.quantity}  ${line.productName}`,
    ),
    "",
    "========================================",
    "",
  ].join("\n");

  return {
    filename: `${order.orderNumber}_${type}.txt`,
    contentType: "text/plain; charset=utf-8",
    body,
  };
}
