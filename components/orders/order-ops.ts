import type {
  Order,
  OrderPriority,
  ShippingMode,
} from "@/lib/orders";
import {
  PRE_SHIP_CANCELABLE,
  SHIPMENT_EVENT_LABELS,
  SHIPPING_MODE_LABELS,
  isAwbVisible,
  isMarketplaceFulfillmentMode,
  isSelfFulfillmentMode,
  primaryShipment,
} from "@/lib/orders";

/** Lifecycle / flowchart status badges (Claim / Return are secondary tags). */
export type OpsChip =
  | "Imported"
  | "Confirmed"
  | "Reserved"
  | "Allocated"
  | "Picked"
  | "Packed"
  | "Shipped"
  | "Delivered"
  | "Settled"
  | "Closed"
  | "Cancelled"
  | "On Hold"
  | "RTO In Transit"
  | "RTO Initiated";

export type KpiKey =
  | "total"
  | "pending"
  | "ready_to_ship"
  | "label_pending"
  | "ready_for_pickup"
  | "packed"
  | "shipped"
  | "delivered"
  | "returns"
  | "return_requested"
  | "rto"
  | "cancelled"
  | "on_hold"
  | "today_revenue"
  | "avg_processing"
  | "sla_breach";

export type AlertKey =
  | "labels_waiting"
  | "sla_nearing"
  | "inventory_issue"
  | "sync_failures"
  | "pickup_failures"
  | "returns_qc"
  | "claims_pending"
  | "settlement_issues";

export function marketplaceLogoSrc(channel: string) {
  const normalized = channel.trim().toLowerCase();
  if (
    normalized === "manual" ||
    normalized === "website" ||
    normalized === "own website"
  ) {
    return "/marketplaces/own%20website.png";
  }
  return `/marketplaces/${normalized.replace(/\s+/g, "-")}.png`;
}

export function shippingModeLabel(mode: ShippingMode) {
  return SHIPPING_MODE_LABELS[mode] ?? mode;
}

export function formatMoney(amount?: number | null) {
  const value =
    typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;
}

export function formatDateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function hasRtoShipment(order: Order) {
  return (order.shipments ?? []).some((s) => s.event.startsWith("rto_"));
}

export function isLabelPending(order: Order) {
  if (order.status !== "Packed") return false;
  const shipment = primaryShipment(order);
  if (isSelfFulfillmentMode(order.shippingMode)) {
    return !shipment?.awb || !shipment?.labelUrl;
  }
  return !shipment?.labelUrl;
}

export function isReadyForPickup(order: Order) {
  const shipment = primaryShipment(order);
  return (
    order.status === "Packed" &&
    Boolean(shipment?.awb) &&
    !shipment?.shippedAt
  );
}

export function isReadyToShip(order: Order) {
  return (
    order.status === "Allocated" ||
    order.status === "Picked" ||
    (order.status === "Packed" && !primaryShipment(order)?.shippedAt)
  );
}

export function isPending(order: Order) {
  return order.status === "Imported" || order.status === "Confirmed";
}

export function hasOpenClaim(order: Order) {
  return order.claims.some(
    (c) => c.status === "open" || c.status === "under_review",
  );
}

/** Secondary tags — Claim / Return — never replace lifecycle status. */
export function opsSecondaryBadges(
  order: Order,
): Array<{ label: string; className: string }> {
  const badges: Array<{ label: string; className: string }> = [];
  if (hasOpenClaim(order)) {
    badges.push({
      label: "Claim Raised",
      className: "bg-amber-100 text-amber-900",
    });
  }
  if (order.returnCase?.kind === "return") {
    if (order.returnCase.status === "requested") {
      badges.push({
        label: "Return Requested",
        className: "bg-violet-100 text-violet-800",
      });
    } else if (order.returnCase.status === "approved") {
      badges.push({
        label: "Return Approved",
        className: "bg-violet-100 text-violet-700",
      });
    } else if (order.returnCase.status === "in_transit") {
      badges.push({
        label: "Return In Transit",
        className: "bg-violet-100 text-violet-700",
      });
    } else if (order.returnCase.status === "received") {
      badges.push({
        label: "QC Pending",
        className: "bg-violet-50 text-violet-700",
      });
    } else if (order.returnCase.disposition === "restock") {
      badges.push({
        label: "Restocked",
        className: "bg-emerald-50 text-emerald-800",
      });
    }
  }
  return badges;
}

export function opsChip(order: Order): { label: OpsChip; className: string } {
  if (order.status === "Cancelled") {
    return { label: "Cancelled", className: "bg-slate-100 text-slate-600" };
  }
  if (order.status === "OnHold") {
    return { label: "On Hold", className: "bg-rose-100 text-rose-800" };
  }

  const shipment = primaryShipment(order);
  if (shipment?.event === "rto_in_transit") {
    return { label: "RTO In Transit", className: "bg-rose-100 text-rose-800" };
  }
  if (
    shipment?.event === "rto_expected" ||
    (order.returnCase?.kind === "rto" &&
      shipment?.event !== "rto_completed")
  ) {
    return { label: "RTO Initiated", className: "bg-rose-100 text-rose-800" };
  }

  switch (order.status) {
    case "Imported":
      return { label: "Imported", className: "bg-slate-100 text-slate-700" };
    case "Confirmed":
      return { label: "Confirmed", className: "bg-sky-100 text-sky-800" };
    case "Reserved":
      return { label: "Reserved", className: "bg-cyan-100 text-cyan-800" };
    case "Allocated":
      return { label: "Allocated", className: "bg-emerald-100 text-emerald-800" };
    case "Picked":
      return { label: "Picked", className: "bg-teal-100 text-teal-800" };
    case "Packed":
      return { label: "Packed", className: "bg-indigo-100 text-indigo-800" };
    case "Shipped":
      return { label: "Shipped", className: "bg-blue-100 text-blue-800" };
    case "Delivered":
      return { label: "Delivered", className: "bg-emerald-100 text-emerald-800" };
    case "Settled":
      return { label: "Settled", className: "bg-emerald-50 text-emerald-800" };
    case "Closed":
      return { label: "Closed", className: "bg-slate-100 text-slate-700" };
    default:
      return { label: "Imported", className: "bg-slate-100 text-slate-700" };
  }
}

export function priorityTone(priority: OrderPriority) {
  switch (priority) {
    case "urgent":
      return "bg-rose-100 text-rose-800";
    case "high":
      return "bg-orange-100 text-orange-800";
    case "low":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-blue-50 text-blue-700";
  }
}

export function canCancel(order: Order) {
  return PRE_SHIP_CANCELABLE.includes(order.status);
}

export function canDownloadLabel(order: Order) {
  return [
    "Packed",
    "Shipped",
    "Delivered",
    "Settled",
    "Closed",
  ].includes(order.status) || hasRtoShipment(order);
}

/** Marketplace / platform-fulfilled — AWB lives in the label, not OMS. */
export const MARKETPLACE_FULFILLMENT_MODES: ShippingMode[] = [
  "marketplace",
  "fba",
  "flipkart_fulfilled",
];

/** Seller-managed — AWB / courier are OMS-visible. */
export const SELF_FULFILLMENT_MODES: ShippingMode[] = [
  "self_ship",
  "three_pl",
];

export const SELF_SHIP_COURIERS = [
  "Delhivery",
  "BlueDart",
  "Ekart",
  "Shadowfax",
  "Xpressbees",
] as const;

export function isMarketplaceFulfillment(mode: ShippingMode) {
  return isMarketplaceFulfillmentMode(mode);
}

export function isSelfFulfillment(mode: ShippingMode) {
  return isSelfFulfillmentMode(mode);
}

/** Marketplaces where sellers typically must accept/acknowledge before fulfilment. */
const MARKETPLACE_ACCEPT_CHANNELS = new Set([
  "Amazon",
  "Flipkart",
  "Meesho",
  "Myntra",
]);

/**
 * Imported marketplace orders that need seller acceptance (not FBA / Flipkart Fulfilled).
 * Manual / Shopify use Confirm instead.
 */
export function requiresMarketplaceAccept(order: Order) {
  if (order.status !== "Imported") return false;
  if (order.shippingMode === "fba" || order.shippingMode === "flipkart_fulfilled") {
    return false;
  }
  return MARKETPLACE_ACCEPT_CHANNELS.has(order.channel);
}

export function requiresOrderConfirm(order: Order) {
  return order.status === "Imported";
}

export function acceptActionLabel(order: Order) {
  if (requiresMarketplaceAccept(order)) return "Accept Order";
  return "Confirm Order";
}

/** AWB / tracking numbers are only shown for seller-managed fulfillment. */
export function showsAwbInOms(order: Order) {
  return isAwbVisible(order.shippingMode);
}

export function needsMarketplaceLabel(order: Order) {
  return (
    isMarketplaceFulfillmentMode(order.shippingMode) &&
    order.status === "Packed" &&
    !primaryShipment(order)?.labelUrl
  );
}

export function needsSelfShipLabel(order: Order) {
  return (
    isSelfFulfillmentMode(order.shippingMode) &&
    order.status === "Packed" &&
    !primaryShipment(order)?.awb
  );
}

export type ShippingUiAction =
  | {
      kind: "ensure_label";
      label: string;
      /** Create AWB / label metadata without forcing a file download. */
      download?: false;
    }
  | {
      kind: "download_label";
      label: string;
      download?: true;
    }
  | {
      kind: "print_label";
      label: string;
      download?: true;
    }
  | {
      kind: "api";
      label: string;
      path: string;
      body?: object;
    };

/**
 * Label / AWB actions that differ by shipping mode.
 * Marketplace: label only, no courier.
 * Self ship: Generate AWB, Generate / Download / Print Label (courier selected in UI).
 */
export function shippingModeActions(order: Order): ShippingUiAction[] {
  const shipment = primaryShipment(order);

  if (isMarketplaceFulfillmentMode(order.shippingMode)) {
    if (order.status !== "Packed" && !canDownloadLabel(order)) return [];
    const actions: ShippingUiAction[] = [];
    if (order.status === "Packed" && !shipment?.labelUrl) {
      actions.push({
        kind: "ensure_label",
        label: "Generate Marketplace Label",
        download: false,
      });
    }
    if (order.status === "Packed" || canDownloadLabel(order)) {
      actions.push({
        kind: "download_label",
        label: "Download Marketplace Label",
      });
      actions.push({
        kind: "print_label",
        label: "Print Marketplace Label",
      });
    }
    return actions;
  }

  if (isSelfFulfillmentMode(order.shippingMode)) {
    if (order.status !== "Packed" && !canDownloadLabel(order)) return [];
    const actions: ShippingUiAction[] = [];
    const hasAwb = Boolean(shipment?.awb);
    if (order.status === "Packed" && !hasAwb) {
      actions.push({
        kind: "ensure_label",
        label: "Generate AWB",
        download: false,
      });
    }
    if (order.status === "Packed" && hasAwb) {
      actions.push({
        kind: "download_label",
        label: "Generate Label",
      });
    }
    if (hasAwb || (canDownloadLabel(order) && order.status !== "Packed")) {
      actions.push({
        kind: "download_label",
        label: "Download Label",
      });
      actions.push({
        kind: "print_label",
        label: "Print Label",
      });
    }
    return dedupeActions(actions);
  }

  return [];
}

function dedupeActions(actions: ShippingUiAction[]) {
  const seen = new Set<string>();
  return actions.filter((action) => {
    const key = `${action.kind}:${action.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function nextActions(
  order: Order,
): Array<{ label: string; path: string; body?: object }> {
  const shipment = primaryShipment(order);

  switch (order.status) {
    case "OnHold":
      return [{ label: "Release hold", path: "release-hold" }];
    case "Imported":
      return [
        {
          label: acceptActionLabel(order),
          path: "confirm",
          body: {
            note: requiresMarketplaceAccept(order)
              ? `Accepted on ${order.channel}`
              : "Confirmed",
          },
        },
        {
          label: "Hold",
          path: "hold",
          body: { reason: "manual_review", note: "Manual hold" },
        },
      ];
    case "Confirmed":
      return [
        { label: "Reserve", path: "reserve" },
        {
          label: "Hold",
          path: "hold",
          body: { reason: "manual_review", note: "Manual hold" },
        },
      ];
    case "Reserved":
      return [
        { label: "Allocate", path: "allocate" },
        {
          label: "Hold",
          path: "hold",
          body: { reason: "manual_review", note: "Manual hold" },
        },
      ];
    case "Allocated":
      return [
        { label: "Pick", path: "pick" },
        {
          label: "Hold",
          path: "hold",
          body: { reason: "manual_review", note: "Manual hold" },
        },
      ];
    case "Picked":
      return [{ label: "Pack", path: "pack" }];
    case "Packed": {
      if (isSelfFulfillmentMode(order.shippingMode)) {
        if (!shipment?.awb) return [];
        return [
          {
            label: "Ship",
            path: "ship",
            body: {
              courier: shipment.courier ?? "Delhivery",
            },
          },
        ];
      }
      return [{ label: "Mark shipped", path: "ship", body: {} }];
    }
    case "Shipped": {
      const actions: Array<{ label: string; path: string; body?: object }> = [
        { label: "Deliver", path: "deliver" },
        {
          label: "Attempt failed",
          path: "delivery-attempt",
          body: { reason: "Customer unavailable" },
        },
        {
          label: "Initiate RTO",
          path: "rto",
          body: { reason: "Delivery not completed" },
        },
      ];
      if (
        shipment?.event === "label_generated" ||
        shipment?.event === "label_printed" ||
        shipment?.event === "manifest_generated" ||
        shipment?.event === "pickup_requested" ||
        shipment?.event === "pickup_completed" ||
        shipment?.event === "in_transit"
      ) {
        actions.unshift({
          label: "Out for delivery",
          path: shipment
            ? `shipments/${shipment.id}/events`
            : "tracking",
          body: shipment
            ? { event: "out_for_delivery" }
            : { trackingStatus: "out_for_delivery" },
        });
      }
      return actions;
    }
    case "Delivered":
      return [
        { label: "Settle", path: "settle" },
        {
          label: "Customer return",
          path: "returns",
          body: { kind: "return", reason: "Customer requested return" },
        },
      ];
    case "Settled":
      return [{ label: "Close", path: "close" }];
    default:
      return [];
  }
}

export function shipmentEventLabel(event: string) {
  return (
    SHIPMENT_EVENT_LABELS[event as keyof typeof SHIPMENT_EVENT_LABELS] ??
    event.replace(/_/g, " ")
  );
}

export function computeKpis(orders: Order[]) {
  const today = new Date().toDateString();
  let todayRevenue = 0;
  let processingSum = 0;
  let processingCount = 0;

  const counts: Record<KpiKey, number> = {
    total: orders.length,
    pending: 0,
    ready_to_ship: 0,
    label_pending: 0,
    ready_for_pickup: 0,
    packed: 0,
    shipped: 0,
    delivered: 0,
    returns: 0,
    return_requested: 0,
    rto: 0,
    cancelled: 0,
    on_hold: 0,
    today_revenue: 0,
    avg_processing: 0,
    sla_breach: 0,
  };

  for (const order of orders) {
    if (isPending(order)) counts.pending += 1;
    if (isReadyToShip(order)) counts.ready_to_ship += 1;
    if (isLabelPending(order)) counts.label_pending += 1;
    if (isReadyForPickup(order)) counts.ready_for_pickup += 1;
    if (order.status === "Packed") counts.packed += 1;
    if (order.status === "Shipped") counts.shipped += 1;
    if (order.status === "Delivered") counts.delivered += 1;
    if (order.returnCase?.kind === "return") counts.returns += 1;
    if (
      order.returnCase?.kind === "return" &&
      order.returnCase.status === "requested"
    ) {
      counts.return_requested += 1;
    }
    if (hasRtoShipment(order) || order.returnCase?.kind === "rto") {
      counts.rto += 1;
    }
    if (order.status === "Cancelled") counts.cancelled += 1;
    if (order.status === "OnHold") counts.on_hold += 1;
    if (order.slaBreached) counts.sla_breach += 1;
    if (new Date(order.createdAt).toDateString() === today) {
      todayRevenue += order.totals.subtotal;
    }
    if (order.processingMinutes != null) {
      processingSum += order.processingMinutes;
      processingCount += 1;
    }
  }

  counts.today_revenue = todayRevenue;
  counts.avg_processing =
    processingCount === 0 ? 0 : Math.round(processingSum / processingCount);
  return counts;
}

export function computeAlerts(orders: Order[]) {
  return {
    labels_waiting: orders.filter(isLabelPending).length,
    sla_nearing: orders.filter(
      (o) =>
        o.slaBreached ||
        (o.shipByAt &&
          new Date(o.shipByAt).getTime() - Date.now() < 6 * 3600_000 &&
          !["Shipped", "Delivered", "Closed", "Cancelled"].includes(o.status)),
    ).length,
    inventory_issue: orders.filter((o) => Boolean(o.inventoryIssue)).length,
    sync_failures: orders.filter((o) => o.syncFailed).length,
    pickup_failures: orders.filter((o) => o.pickupFailed).length,
    returns_qc: orders.filter(
      (o) =>
        o.returnCase &&
        (o.returnCase.status === "requested" ||
          o.returnCase.status === "received"),
    ).length,
    claims_pending: orders.filter((o) =>
      o.claims.some((c) => c.status === "open" || c.status === "under_review"),
    ).length,
    settlement_issues: orders.filter((o) => Boolean(o.settlement?.issue))
      .length,
  } satisfies Record<AlertKey, number>;
}

export function matchesSearch(order: Order, query: string) {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  const shipment = primaryShipment(order);
  const haystack = [
    order.orderNumber,
    order.externalOrderId ?? "",
    shipment?.awb ?? "",
    shipment?.trackingNumber ?? "",
    order.shipping?.awb ?? "",
    order.shipping?.trackingNumber ?? "",
    order.invoiceNumber ?? "",
    ...order.lines.map((l) => `${l.sku} ${l.productName}`),
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

export type OrdersFilterState = {
  search: string;
  marketplace: string;
  shippingMode: string;
  warehouse: string;
  courier: string;
  status: string;
  payment: string;
  tag: string;
  assignee: string;
  priority: string;
  dateFrom: string;
  dateTo: string;
  valueMin: string;
  valueMax: string;
  sla: string;
  alert?: AlertKey | null;
  kpi?: KpiKey | null;
};

export function filterOrders(orders: Order[], filters: OrdersFilterState) {
  return orders.filter((order) => {
    if (!matchesSearch(order, filters.search)) return false;
    if (filters.marketplace !== "all" && order.channel !== filters.marketplace) {
      return false;
    }
    if (
      filters.shippingMode !== "all" &&
      order.shippingMode !== filters.shippingMode
    ) {
      return false;
    }
    if (
      filters.warehouse !== "all" &&
      (order.warehouseId ?? "") !== filters.warehouse
    ) {
      return false;
    }
    if (
      filters.courier !== "all" &&
      (primaryShipment(order)?.courier ?? order.shipping?.courier ?? "") !==
        filters.courier
    ) {
      return false;
    }
    if (filters.status !== "all" && opsChip(order).label !== filters.status) {
      return false;
    }
    if (filters.payment !== "all" && order.paymentStatus !== filters.payment) {
      return false;
    }
    if (filters.tag !== "all" && !order.tags.includes(filters.tag)) {
      return false;
    }
    if (
      filters.assignee !== "all" &&
      (order.assignedUserId ?? "") !== filters.assignee
    ) {
      return false;
    }
    if (filters.priority !== "all" && order.priority !== filters.priority) {
      return false;
    }
    if (filters.dateFrom) {
      const start = new Date(`${filters.dateFrom}T00:00:00`).getTime();
      if (new Date(order.createdAt).getTime() < start) return false;
    }
    if (filters.dateTo) {
      const end = new Date(`${filters.dateTo}T23:59:59.999`).getTime();
      if (new Date(order.createdAt).getTime() > end) return false;
    }
    if (filters.valueMin && order.totals.subtotal < Number(filters.valueMin)) {
      return false;
    }
    if (filters.valueMax && order.totals.subtotal > Number(filters.valueMax)) {
      return false;
    }
    if (filters.sla === "breached" && !order.slaBreached) return false;
    if (filters.sla === "ok" && order.slaBreached) return false;

    if (filters.kpi) {
      switch (filters.kpi) {
        case "pending":
          if (!isPending(order)) return false;
          break;
        case "ready_to_ship":
          if (!isReadyToShip(order)) return false;
          break;
        case "label_pending":
          if (!isLabelPending(order)) return false;
          break;
        case "ready_for_pickup":
          if (!isReadyForPickup(order)) return false;
          break;
        case "packed":
          if (order.status !== "Packed") return false;
          break;
        case "shipped":
          if (order.status !== "Shipped") return false;
          break;
        case "delivered":
          if (order.status !== "Delivered") return false;
          break;
        case "returns":
          if (order.returnCase?.kind !== "return") return false;
          break;
        case "return_requested":
          if (
            !(
              order.returnCase?.kind === "return" &&
              order.returnCase.status === "requested"
            )
          ) {
            return false;
          }
          break;
        case "rto":
          if (!(hasRtoShipment(order) || order.returnCase?.kind === "rto")) {
            return false;
          }
          break;
        case "cancelled":
          if (order.status !== "Cancelled") return false;
          break;
        case "on_hold":
          if (order.status !== "OnHold") return false;
          break;
        case "sla_breach":
          if (!order.slaBreached) return false;
          break;
        default:
          break;
      }
    }

    if (filters.alert) {
      switch (filters.alert) {
        case "labels_waiting":
          if (!isLabelPending(order)) return false;
          break;
        case "sla_nearing":
          if (
            !(
              order.slaBreached ||
              (order.shipByAt &&
                new Date(order.shipByAt).getTime() - Date.now() <
                  6 * 3600_000 &&
                !["Shipped", "Delivered", "Closed", "Cancelled"].includes(
                  order.status,
                ))
            )
          ) {
            return false;
          }
          break;
        case "inventory_issue":
          if (!order.inventoryIssue) return false;
          break;
        case "sync_failures":
          if (!order.syncFailed) return false;
          break;
        case "pickup_failures":
          if (!order.pickupFailed) return false;
          break;
        case "returns_qc":
          if (
            !(
              order.returnCase &&
              (order.returnCase.status === "requested" ||
                order.returnCase.status === "received")
            )
          ) {
            return false;
          }
          break;
        case "claims_pending":
          if (
            !order.claims.some(
              (c) => c.status === "open" || c.status === "under_review",
            )
          ) {
            return false;
          }
          break;
        case "settlement_issues":
          if (!order.settlement?.issue) return false;
          break;
      }
    }

    return true;
  });
}

export type SortKey =
  | "orderNumber"
  | "channel"
  | "status"
  | "orderValue"
  | "shipBy"
  | "createdAt"
  | "priority";

export function sortOrders(
  orders: Order[],
  sortKey: SortKey,
  direction: "asc" | "desc",
) {
  const sorted = [...orders].sort((a, b) => {
    const dir = direction === "asc" ? 1 : -1;
    switch (sortKey) {
      case "orderNumber":
        return a.orderNumber.localeCompare(b.orderNumber) * dir;
      case "channel":
        return a.channel.localeCompare(b.channel) * dir;
      case "status":
        return opsChip(a).label.localeCompare(opsChip(b).label) * dir;
      case "orderValue":
        return (a.totals.subtotal - b.totals.subtotal) * dir;
      case "shipBy":
        return (
          (new Date(a.shipByAt ?? 0).getTime() -
            new Date(b.shipByAt ?? 0).getTime()) *
          dir
        );
      case "priority": {
        const rank = { urgent: 4, high: 3, normal: 2, low: 1 };
        return (rank[a.priority] - rank[b.priority]) * dir;
      }
      case "createdAt":
      default:
        return (
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
          dir
        );
    }
  });
  return sorted;
}

export type VisionTab =
  | "pending"
  | "confirmed"
  | "reserved"
  | "to_ship"
  | "shipped"
  | "delivered"
  | "returns"
  | "rto"
  | "rto_in_transit"
  | "onhold"
  | "claims"
  | "all"
  | "label_pending"
  | "ready_pickup";

/** Lifecycle tabs — Pending first, then next fulfilment steps. */
export const VISION_TABS: Array<[VisionTab, string]> = [
  ["pending", "Pending"],
  ["confirmed", "Confirmed"],
  ["reserved", "Reserved"],
  ["to_ship", "To Ship"],
  ["shipped", "Shipped"],
  ["delivered", "Delivered"],
  ["returns", "Returns"],
  ["rto_in_transit", "RTO In Transit"],
  ["onhold", "On Hold"],
  ["claims", "Claims"],
  ["all", "All"],
];

export function matchesVisionTab(order: Order, tab: VisionTab) {
  if (tab === "all") return true;
  if (tab === "pending") return order.status === "Imported";
  if (tab === "confirmed") return order.status === "Confirmed";
  if (tab === "reserved") return order.status === "Reserved";
  if (tab === "to_ship") {
    return (
      order.status === "Allocated" ||
      order.status === "Picked" ||
      order.status === "Packed" ||
      isLabelPending(order) ||
      isReadyForPickup(order)
    );
  }
  if (tab === "label_pending") return isLabelPending(order);
  if (tab === "ready_pickup") return isReadyForPickup(order);
  if (tab === "shipped") return order.status === "Shipped";
  if (tab === "delivered") {
    return (
      order.status === "Delivered" ||
      order.status === "Settled" ||
      order.status === "Closed"
    );
  }
  if (tab === "returns") return order.returnCase?.kind === "return";
  if (tab === "rto") {
    return hasRtoShipment(order) || order.returnCase?.kind === "rto";
  }
  if (tab === "rto_in_transit") return isRtoInTransit(order);
  if (tab === "onhold") return order.status === "OnHold";
  if (tab === "claims") {
    return order.claims.some(
      (c) => c.status === "open" || c.status === "under_review",
    );
  }
  return true;
}

export function computeVisionTabCounts(orders: Order[]) {
  const counts: Record<VisionTab, number> = {
    pending: 0,
    confirmed: 0,
    reserved: 0,
    to_ship: 0,
    shipped: 0,
    delivered: 0,
    returns: 0,
    rto: 0,
    rto_in_transit: 0,
    onhold: 0,
    claims: 0,
    all: orders.length,
    label_pending: 0,
    ready_pickup: 0,
  };
  for (const order of orders) {
    if (matchesVisionTab(order, "pending")) counts.pending += 1;
    if (matchesVisionTab(order, "confirmed")) counts.confirmed += 1;
    if (matchesVisionTab(order, "reserved")) counts.reserved += 1;
    if (matchesVisionTab(order, "to_ship")) counts.to_ship += 1;
    if (matchesVisionTab(order, "label_pending")) counts.label_pending += 1;
    if (matchesVisionTab(order, "ready_pickup")) counts.ready_pickup += 1;
    if (matchesVisionTab(order, "shipped")) counts.shipped += 1;
    if (matchesVisionTab(order, "delivered")) counts.delivered += 1;
    if (matchesVisionTab(order, "returns")) counts.returns += 1;
    if (matchesVisionTab(order, "rto")) counts.rto += 1;
    if (matchesVisionTab(order, "rto_in_transit")) counts.rto_in_transit += 1;
    if (matchesVisionTab(order, "onhold")) counts.onhold += 1;
    if (matchesVisionTab(order, "claims")) counts.claims += 1;
  }
  return counts;
}

export type VisionKpiKey =
  | "all"
  | "to_ship"
  | "shipped"
  | "delivered"
  | "rto_in_transit"
  | "on_hold"
  | "claims";

export function isRtoInTransit(order: Order) {
  return (order.shipments ?? []).some((s) => s.event === "rto_in_transit");
}

export function computeVisionKpis(orders: Order[]) {
  const tabs = computeVisionTabCounts(orders);
  return {
    all: tabs.all,
    to_ship: tabs.to_ship,
    shipped: tabs.shipped,
    delivered: tabs.delivered,
    rto_in_transit: orders.filter(isRtoInTransit).length,
    on_hold: tabs.onhold,
    claims: tabs.claims,
  } satisfies Record<VisionKpiKey, number>;
}

export function orderDetailTag(order: Order): { label: string; className: string } | null {
  if (hasRtoShipment(order) || order.returnCase?.kind === "rto") {
    return { label: "RTO", className: "bg-rose-100 text-rose-700" };
  }
  if (order.returnCase?.kind === "return") {
    return { label: "Return", className: "bg-violet-100 text-violet-700" };
  }
  if (order.status === "Imported" || order.status === "Confirmed") {
    return { label: "New", className: "bg-sky-100 text-sky-700" };
  }
  if (order.status === "Reserved") {
    return { label: "Reserved", className: "bg-cyan-100 text-cyan-700" };
  }
  return null;
}

export function needsGenerateLabel(order: Order) {
  if (isMarketplaceFulfillmentMode(order.shippingMode)) {
    return needsMarketplaceLabel(order);
  }
  if (isSelfFulfillmentMode(order.shippingMode)) {
    return needsSelfShipLabel(order);
  }
  return order.status === "Packed" && !primaryShipment(order)?.awb;
}
