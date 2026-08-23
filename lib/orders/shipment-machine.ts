import type {
  Order,
  OrderShipping,
  Shipment,
  ShipmentEvent,
  ShippingMode,
  TrackingStatus,
} from "./types";

export const SHIPMENT_TRANSITIONS: Record<ShipmentEvent, ShipmentEvent[]> = {
  label_generated: ["label_printed", "manifest_generated"],
  label_printed: ["manifest_generated", "pickup_requested"],
  manifest_generated: ["pickup_requested"],
  pickup_requested: ["pickup_completed"],
  pickup_completed: ["in_transit"],
  in_transit: ["out_for_delivery", "rto_expected", "delivered"],
  out_for_delivery: [
    "delivery_attempt_failed",
    "delivered",
    "rto_expected",
  ],
  delivery_attempt_failed: ["out_for_delivery", "in_transit", "rto_expected"],
  delivered: [],
  rto_expected: ["rto_in_transit"],
  rto_in_transit: ["rto_completed"],
  rto_completed: [],
};

export function canAdvanceShipment(
  current: ShipmentEvent,
  next: ShipmentEvent,
): boolean {
  return SHIPMENT_TRANSITIONS[current]?.includes(next) ?? false;
}

export function isMarketplaceFulfillmentMode(mode: ShippingMode): boolean {
  return (
    mode === "marketplace" ||
    mode === "fba" ||
    mode === "flipkart_fulfilled"
  );
}

export function isSelfFulfillmentMode(mode: ShippingMode): boolean {
  return mode === "self_ship" || mode === "three_pl";
}

/** AWB is OMS-visible only for seller-managed modes. */
export function isAwbVisible(mode: ShippingMode): boolean {
  return isSelfFulfillmentMode(mode);
}

export function primaryShipment(order: Order): Shipment | undefined {
  if (order.shipments?.length) {
    return order.shipments[0];
  }
  return undefined;
}

export function shipmentToLegacyShipping(
  shipment: Shipment,
): OrderShipping | undefined {
  if (!shipment.awb && !shipment.labelUrl) return undefined;
  return {
    courier: shipment.courier ?? "Marketplace",
    awb: shipment.awb ?? "",
    trackingNumber: shipment.trackingNumber ?? shipment.awb ?? "",
    trackingStatus: shipmentEventToTracking(shipment.event),
    labelUrl: shipment.labelUrl,
    pickupSlot: shipment.pickupSlot,
    shippedAt: shipment.shippedAt,
    deliveryAttempts: shipment.deliveryAttempts,
    lastAttemptAt: shipment.lastAttemptAt,
    lastAttemptReason: shipment.lastAttemptReason,
    expectedRtoAt: shipment.expectedRtoAt,
  };
}

export function shipmentEventToTracking(event: ShipmentEvent): TrackingStatus {
  switch (event) {
    case "label_generated":
    case "label_printed":
    case "manifest_generated":
    case "pickup_requested":
    case "pickup_completed":
      return "label_created";
    case "in_transit":
      return "in_transit";
    case "out_for_delivery":
    case "delivery_attempt_failed":
      return "out_for_delivery";
    case "delivered":
      return "delivered";
    case "rto_expected":
    case "rto_in_transit":
      return "rto_in_transit";
    case "rto_completed":
      return "rto_completed";
    default:
      return "label_created";
  }
}

export function syncOrderShippingFromShipments(order: Order): Order {
  const primary = primaryShipment(order);
  return {
    ...order,
    shipping: primary ? shipmentToLegacyShipping(primary) : undefined,
  };
}

export function allShipmentsTerminal(order: Order): boolean {
  if (!order.shipments.length) return false;
  return order.shipments.every(
    (s) => s.event === "delivered" || s.event === "rto_completed",
  );
}

export function allShipmentsDelivered(order: Order): boolean {
  if (!order.shipments.length) return false;
  return order.shipments.every((s) => s.event === "delivered");
}

export function hasLeftWarehouse(order: Order): boolean {
  return order.shipments.some((s) =>
    [
      "pickup_completed",
      "in_transit",
      "out_for_delivery",
      "delivery_attempt_failed",
      "delivered",
      "rto_expected",
      "rto_in_transit",
      "rto_completed",
    ].includes(s.event),
  );
}
