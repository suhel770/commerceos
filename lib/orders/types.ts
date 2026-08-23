export type OrderStatus =
  | "Imported"
  | "Confirmed"
  | "OnHold"
  | "Reserved"
  | "Allocated"
  | "Picked"
  | "Packed"
  | "Shipped"
  | "Delivered"
  | "Settled"
  | "Closed"
  | "Cancelled";

export type PaymentStatus = "pending" | "paid" | "failed";

/** Independent of OrderStatus — lives on Shipment. */
export type ShipmentEvent =
  | "label_generated"
  | "label_printed"
  | "manifest_generated"
  | "pickup_requested"
  | "pickup_completed"
  | "in_transit"
  | "out_for_delivery"
  | "delivery_attempt_failed"
  | "delivered"
  | "rto_expected"
  | "rto_in_transit"
  | "rto_completed";

/** @deprecated Prefer ShipmentEvent on Shipment — kept for label stub compat. */
export type TrackingStatus =
  | "label_created"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "rto_in_transit"
  | "rto_completed";

export type ReturnDisposition = "restock" | "refurbish" | "scrap";

export type ReturnCaseStatus =
  | "requested"
  | "approved"
  | "in_transit"
  | "received"
  | "disposed";

export type ShippingMode =
  | "marketplace"
  | "self_ship"
  | "fba"
  | "flipkart_fulfilled"
  | "three_pl";

export type OrderPriority = "low" | "normal" | "high" | "urgent";

export type HoldReason =
  | "inventory_issue"
  | "fraud_check"
  | "payment_issue"
  | "customer_request"
  | "marketplace_issue"
  | "manual_review"
  | "other";

export type SettlementStatus =
  | "pending"
  | "expected"
  | "reconciled"
  | "disputed"
  | "paid";

export type OrderDocumentType =
  | "shipping_label"
  | "invoice"
  | "tax_invoice"
  | "packing_slip"
  | "manifest"
  | "return_label"
  | "replacement_label"
  | "credit_note"
  | "claim_document"
  | "return_receipt";

export type OrderDocumentStatus = "not_generated" | "available" | "expired";

export type ClaimType =
  | "empty_box"
  | "wrong_item"
  | "courier_damage"
  | "lost_shipment"
  | "fake_return"
  | "weight_difference"
  | "damaged"
  | "missing_item";

export type ClaimStatus =
  | "open"
  | "under_review"
  | "approved"
  | "rejected"
  | "compensated";

export type ActorType = "user" | "system";

export const MAX_DELIVERY_ATTEMPTS = 3;

export interface OrderLine {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  reservationId?: string;
  warehouseId?: string;
  pickedQty?: number;
  packedQty?: number;
  shippedQty?: number;
}

export interface OrderTotals {
  subtotal: number;
  currency: string;
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  at: string;
  note?: string;
  user?: string;
  actorType?: ActorType;
  previousStatus?: OrderStatus;
}

export interface ShipmentEventEntry {
  event: ShipmentEvent;
  at: string;
  note?: string;
  actorType?: ActorType;
  user?: string;
}

export interface ShipmentLine {
  lineId: string;
  quantity: number;
}

export interface Shipment {
  id: string;
  orderId: string;
  warehouseId: string;
  shippingMode: ShippingMode;
  lines: ShipmentLine[];
  event: ShipmentEvent;
  events: ShipmentEventEntry[];
  courier?: string;
  awb?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  labelUrl?: string;
  pickupSlot?: string;
  deliveryAttempts: number;
  lastAttemptAt?: string;
  lastAttemptReason?: string;
  expectedRtoAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Legacy single-shipment snapshot — prefer `Order.shipments`.
 * Kept as a derived/compat field for label stubs during migration.
 */
export interface OrderShipping {
  courier: string;
  awb: string;
  trackingNumber: string;
  trackingStatus: TrackingStatus;
  labelUrl?: string;
  pickupSlot?: string;
  manifestSyncedAt?: string;
  shippedAt?: string;
  deliveryAttempts: number;
  lastAttemptAt?: string;
  lastAttemptReason?: string;
  expectedRtoAt?: string;
}

export interface OrderSettlement {
  marketplaceFees: number;
  commission: number;
  shippingCharges: number;
  reverseShipping: number;
  tcs: number;
  tds: number;
  netSettlement: number;
  settlementDate?: string;
  settlementStatus: SettlementStatus;
  /** @deprecated use marketplaceFees + netSettlement */
  fees?: number;
  payout?: number;
  reconciledAt?: string;
  issue?: string;
}

export interface OrderReturnCase {
  id: string;
  kind: "return" | "rto";
  status: ReturnCaseStatus;
  reason: string;
  openedAt: string;
  approvedAt?: string;
  inTransitAt?: string;
  receivedAt?: string;
  disposedAt?: string;
  disposition?: ReturnDisposition;
  shipmentId?: string;
}

export interface OrderHoldRecord {
  id: string;
  reason: HoldReason;
  heldBy: string;
  heldAt: string;
  statusBeforeHold: OrderStatus;
  note?: string;
  releasedBy?: string;
  releasedAt?: string;
}

export interface OrderCustomer {
  name: string;
  phone?: string;
  email?: string;
  city?: string;
}

export interface OrderDocument {
  id: string;
  type: OrderDocumentType;
  status: OrderDocumentStatus;
  version: number;
  url?: string;
  generatedAt?: string;
  shipmentId?: string;
}

export interface OrderClaim {
  id: string;
  type: ClaimType;
  status: ClaimStatus;
  evidence: string[];
  openedAt: string;
  note?: string;
  marketplaceResponse?: string;
  history: Array<{
    at: string;
    status: ClaimStatus;
    note?: string;
    user?: string;
  }>;
}

export interface OrderInternalNote {
  id: string;
  body: string;
  user: string;
  at: string;
}

export interface OrderActivityEntry {
  id: string;
  action: string;
  user: string;
  at: string;
  actorType?: ActorType;
  previousStatus?: OrderStatus;
  newStatus?: OrderStatus;
  oldValue?: string;
  newValue?: string;
  notes?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  organizationId: string;
  workspaceId: string;
  channel: string;
  externalOrderId?: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  shippingMode: ShippingMode;
  priority: OrderPriority;
  tags: string[];
  customer: OrderCustomer;
  assignedUserId?: string;
  assignedUserName?: string;
  shipByAt?: string;
  slaBreached?: boolean;
  processingMinutes?: number;
  invoiceNumber?: string;
  syncFailed?: boolean;
  pickupFailed?: boolean;
  inventoryIssue?: string;
  lines: OrderLine[];
  totals: OrderTotals;
  warehouseId?: string;
  estimatedDeliveryAt?: string;
  /** @deprecated Prefer shipments[]; kept in sync with primary shipment. */
  shipping?: OrderShipping;
  shipments: Shipment[];
  settlement?: OrderSettlement;
  timeline: OrderTimelineEntry[];
  returnCase?: OrderReturnCase;
  holds: OrderHoldRecord[];
  activeHold?: OrderHoldRecord;
  documents: OrderDocument[];
  claims: OrderClaim[];
  internalNotes: OrderInternalNote[];
  activity: OrderActivityEntry[];
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string;
  cancelReason?: string;
}

export interface CreateOrderInput {
  organizationId: string;
  workspaceId: string;
  channel: string;
  externalOrderId?: string;
  paymentStatus?: PaymentStatus;
  shippingMode?: ShippingMode;
  lines: Array<{
    productId: string;
    sku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    warehouseId?: string;
  }>;
}

export class OrderError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "OrderError";
    this.code = code;
  }
}

export class OrderNotFoundError extends OrderError {
  constructor(orderId: string) {
    super("ORDER_NOT_FOUND", `Order ${orderId} was not found.`);
    this.name = "OrderNotFoundError";
  }
}

/** Allowed next statuses from each status (cancel handled separately). */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  Imported: ["Confirmed", "OnHold"],
  Confirmed: ["Reserved", "OnHold"],
  OnHold: ["Confirmed", "Reserved", "Allocated"],
  Reserved: ["Allocated", "OnHold"],
  Allocated: ["Picked", "OnHold"],
  Picked: ["Packed"],
  Packed: ["Shipped", "Picked"],
  Shipped: ["Delivered", "Settled"],
  Delivered: ["Settled", "Closed"],
  Settled: ["Closed"],
  Closed: [],
  Cancelled: [],
};

export const PRE_SHIP_CANCELABLE: OrderStatus[] = [
  "Imported",
  "Confirmed",
  "OnHold",
  "Reserved",
  "Allocated",
];

export const CUSTOMER_RETURN_ELIGIBLE: OrderStatus[] = [
  "Delivered",
  "Settled",
  "Closed",
];

/** Order must be Shipped; RTO advances on shipment events. */
export const RTO_ELIGIBLE: OrderStatus[] = ["Shipped"];

export const HOLD_REASON_LABELS: Record<HoldReason, string> = {
  inventory_issue: "Inventory Issue",
  fraud_check: "Fraud Check",
  payment_issue: "Payment Issue",
  customer_request: "Customer Request",
  marketplace_issue: "Marketplace Issue",
  manual_review: "Manual Review",
  other: "Other",
};

export const SHIPPING_MODE_LABELS: Record<ShippingMode, string> = {
  marketplace: "Marketplace Shipping",
  self_ship: "Self Ship",
  fba: "Amazon FBA",
  flipkart_fulfilled: "Flipkart Fulfilled",
  three_pl: "3PL",
};

export const SHIPMENT_EVENT_LABELS: Record<ShipmentEvent, string> = {
  label_generated: "Label Generated",
  label_printed: "Label Printed",
  manifest_generated: "Manifest Generated",
  pickup_requested: "Pickup Requested",
  pickup_completed: "Pickup Completed",
  in_transit: "In Transit",
  out_for_delivery: "Out For Delivery",
  delivery_attempt_failed: "Delivery Attempt Failed",
  delivered: "Delivered",
  rto_expected: "RTO Expected",
  rto_in_transit: "RTO In Transit",
  rto_completed: "RTO Completed",
};
