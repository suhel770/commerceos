import { primaryShipment } from "./shipment-machine";
import type { Order } from "./types";

export interface MarketplaceLabelDocument {
  filename: string;
  contentType: string;
  body: string;
  source: "marketplace_stub";
  channel: string;
  awb: string;
  trackingNumber: string;
}

/** Minimal printable label stub (marketplace connector placeholder). */
export function buildMarketplaceLabel(order: Order): MarketplaceLabelDocument {
  const shipment = primaryShipment(order);
  const shipping = order.shipping ?? (shipment
    ? {
        courier: shipment.courier ?? "Marketplace",
        awb: shipment.awb ?? "LABEL-ONLY",
        trackingNumber: shipment.trackingNumber ?? shipment.awb ?? "—",
        trackingStatus: "label_created" as const,
      }
    : null);

  if (!shipping && !shipment?.labelUrl) {
    throw new Error("Order has no shipping / label metadata.");
  }

  const courier = shipping?.courier ?? shipment?.courier ?? "Marketplace";
  const awb = shipping?.awb || shipment?.awb || "IN-LABEL";
  const tracking =
    shipping?.trackingNumber || shipment?.trackingNumber || awb;

  const lines = order.lines
    .map(
      (line) =>
        `  - ${line.sku} × ${line.quantity}  ${line.productName}`,
    )
    .join("\n");

  const body = [
    "========================================",
    `  ${order.channel.toUpperCase()} SHIPPING LABEL`,
    "  (CommerceOS marketplace stub)",
    "========================================",
    "",
    `Order:     ${order.orderNumber}`,
    `External:  ${order.externalOrderId ?? "—"}`,
    `Channel:   ${order.channel}`,
    `Mode:      ${order.shippingMode}`,
    `Warehouse: ${order.warehouseId ?? shipment?.warehouseId ?? "—"}`,
    "",
    `Courier:   ${courier}`,
    `AWB:       ${awb}`,
    `Tracking:  ${tracking}`,
    `Stage:     ${shipment?.event ?? shipping?.trackingStatus ?? "label"}`,
    "",
    "Lines:",
    lines,
    "",
    `Subtotal:  INR ${order.totals.subtotal}`,
    "",
    "----------------------------------------",
    "Live SP-API / Seller label fetch deferred.",
    "========================================",
    "",
  ].join("\n");

  const safeChannel = order.channel.replace(/[^a-zA-Z0-9]/g, "_");
  return {
    filename: `${safeChannel}_${order.orderNumber}_${awb}.txt`,
    contentType: "text/plain; charset=utf-8",
    body,
    source: "marketplace_stub",
    channel: order.channel,
    awb,
    trackingNumber: tracking,
  };
}

export function marketplaceLabelApiPath(orderId: string) {
  return `/api/v1/orders/${orderId}/label`;
}
