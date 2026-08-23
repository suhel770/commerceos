import { marketplaceLabelApiPath } from "./label";
import { orderRepository } from "./repository";
import {
  allShipmentsDelivered,
  allShipmentsTerminal,
  canAdvanceShipment,
  hasLeftWarehouse,
  isAwbVisible,
  isMarketplaceFulfillmentMode,
  primaryShipment,
  shipmentToLegacyShipping,
  syncOrderShippingFromShipments,
} from "./shipment-machine";
import type {
  CreateOrderInput,
  HoldReason,
  Order,
  OrderHoldRecord,
  OrderLine,
  OrderReturnCase,
  OrderSettlement,
  OrderStatus,
  OrderTimelineEntry,
  Shipment,
  ShipmentEvent,
  ShipmentLine,
} from "./types";
import {
  MAX_DELIVERY_ATTEMPTS,
  ORDER_TRANSITIONS,
  OrderError,
  OrderNotFoundError,
  PRE_SHIP_CANCELABLE,
} from "./types";

const LABEL_ELIGIBLE: OrderStatus[] = [
  "Packed",
  "Shipped",
  "Delivered",
  "Settled",
  "Closed",
];

function computeSubtotal(lines: OrderLine[]): number {
  return lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0,
  );
}

function appendTimeline(
  timeline: OrderTimelineEntry[],
  status: OrderStatus,
  note?: string,
  previousStatus?: OrderStatus,
  user = "system",
): OrderTimelineEntry[] {
  return [
    ...timeline,
    {
      status,
      at: new Date().toISOString(),
      note,
      user,
      actorType: user === "system" ? "system" : "user",
      previousStatus,
    },
  ];
}

function activityEntry(
  action: string,
  opts: {
    user?: string;
    previousStatus?: OrderStatus;
    newStatus?: OrderStatus;
    notes?: string;
    oldValue?: string;
    newValue?: string;
  } = {},
) {
  return {
    id: crypto.randomUUID(),
    action,
    user: opts.user ?? "system",
    at: new Date().toISOString(),
    actorType: (opts.user && opts.user !== "system" ? "user" : "system") as
      | "user"
      | "system",
    previousStatus: opts.previousStatus,
    newStatus: opts.newStatus,
    notes: opts.notes,
    oldValue: opts.oldValue,
    newValue: opts.newValue,
  };
}

function defaultDocuments(orderId: string) {
  return [
    {
      id: crypto.randomUUID(),
      type: "shipping_label" as const,
      status: "not_generated" as const,
      version: 0,
    },
    {
      id: crypto.randomUUID(),
      type: "invoice" as const,
      status: "not_generated" as const,
      version: 0,
    },
    {
      id: crypto.randomUUID(),
      type: "packing_slip" as const,
      status: "not_generated" as const,
      version: 0,
    },
    {
      id: crypto.randomUUID(),
      type: "manifest" as const,
      status: "not_generated" as const,
      version: 0,
    },
    {
      id: crypto.randomUUID(),
      type: "credit_note" as const,
      status: "not_generated" as const,
      version: 0,
    },
    {
      id: crypto.randomUUID(),
      type: "return_receipt" as const,
      status: "not_generated" as const,
      version: 0,
    },
  ];
}

export class OrderService {
  list(filter: {
    organizationId: string;
    workspaceId: string;
    productId?: string;
    status?: OrderStatus;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return orderRepository.list(filter);
  }

  async get(orderId: string) {
    const order = await orderRepository.getById(orderId);
    if (!order) throw new OrderNotFoundError(orderId);
    return order;
  }

  async createDraft(input: CreateOrderInput): Promise<Order> {
    if (input.lines.length === 0) {
      throw new OrderError("EMPTY_ORDER", "Order must include at least one line.");
    }

    for (const line of input.lines) {
      if (line.quantity <= 0) {
        throw new OrderError(
          "INVALID_QUANTITY",
          `Line ${line.sku} quantity must be positive.`,
        );
      }
    }

    const now = new Date().toISOString();
    const lines: OrderLine[] = input.lines.map((line) => ({
      id: crypto.randomUUID(),
      productId: line.productId,
      sku: line.sku,
      productName: line.productName,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      warehouseId: line.warehouseId,
    }));

    const shippingMode =
      input.shippingMode ??
      (input.channel === "Manual" || input.channel === "Shopify"
        ? "self_ship"
        : "marketplace");

    const order: Order = {
      id: crypto.randomUUID(),
      orderNumber: orderRepository.nextOrderNumber(),
      organizationId: input.organizationId,
      workspaceId: input.workspaceId,
      channel: input.channel,
      externalOrderId: input.externalOrderId,
      status: "Imported",
      paymentStatus: input.paymentStatus ?? "paid",
      shippingMode,
      priority: "normal",
      tags: ["Prepaid"],
      customer: {
        name: "Walk-in Customer",
        city: "Bengaluru",
      },
      lines,
      totals: {
        subtotal: computeSubtotal(lines),
        currency: "INR",
      },
      shipments: [],
      holds: [],
      timeline: [
        {
          status: "Imported",
          at: now,
          note: "Order received",
          user: "system",
          actorType: "system",
        },
      ],
      documents: defaultDocuments(""),
      claims: [],
      internalNotes: [],
      activity: [
        activityEntry("order.created", {
          newStatus: "Imported",
          newValue: "Imported",
        }),
      ],
      createdAt: now,
      updatedAt: now,
    };

    return orderRepository.save(order);
  }

  async applyStatus(
    orderId: string,
    status: OrderStatus,
    patch?: Partial<
      Pick<
        Order,
        | "lines"
        | "warehouseId"
        | "estimatedDeliveryAt"
        | "shipping"
        | "shipments"
        | "settlement"
        | "returnCase"
        | "holds"
        | "activeHold"
        | "cancelReason"
        | "cancelledAt"
        | "paymentStatus"
      >
    >,
    note?: string,
    user = "system",
  ): Promise<Order> {
    const order = await this.get(orderId);
    const allowed = ORDER_TRANSITIONS[order.status];
    if (!allowed.includes(status) && status !== "Cancelled") {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot move order from ${order.status} to ${status}.`,
      );
    }

    const next: Order = syncOrderShippingFromShipments({
      ...order,
      ...patch,
      status,
      lines: patch?.lines ?? order.lines,
      shipments: patch?.shipments ?? order.shipments,
      holds: patch?.holds ?? order.holds,
      timeline: appendTimeline(
        order.timeline,
        status,
        note,
        order.status,
        user,
      ),
      activity: [
        activityEntry("order.status_changed", {
          user,
          previousStatus: order.status,
          newStatus: status,
          notes: note,
        }),
        ...order.activity,
      ],
      updatedAt: new Date().toISOString(),
    });
    return orderRepository.save(next);
  }

  async patchOrder(
    orderId: string,
    patch: Partial<
      Pick<
        Order,
        | "shipping"
        | "shipments"
        | "returnCase"
        | "lines"
        | "documents"
        | "claims"
        | "internalNotes"
        | "activity"
        | "assignedUserId"
        | "assignedUserName"
        | "warehouseId"
        | "priority"
        | "tags"
        | "shippingMode"
        | "holds"
        | "activeHold"
        | "settlement"
      >
    >,
    note?: string,
  ): Promise<Order> {
    const order = await this.get(orderId);
    let next: Order = {
      ...order,
      ...patch,
      shipping: patch.shipping ?? order.shipping,
      shipments: patch.shipments ?? order.shipments,
      returnCase: patch.returnCase ?? order.returnCase,
      lines: patch.lines ?? order.lines,
      documents: patch.documents ?? order.documents,
      claims: patch.claims ?? order.claims,
      internalNotes: patch.internalNotes ?? order.internalNotes,
      activity: patch.activity ?? order.activity,
      holds: patch.holds ?? order.holds,
      activeHold:
        patch.activeHold !== undefined ? patch.activeHold : order.activeHold,
      timeline: note
        ? appendTimeline(order.timeline, order.status, note, order.status)
        : order.timeline,
      updatedAt: new Date().toISOString(),
    };
    next = syncOrderShippingFromShipments(next);
    return orderRepository.save(next);
  }

  async addInternalNote(
    orderId: string,
    body: string,
    user = "operator",
  ): Promise<Order> {
    const order = await this.get(orderId);
    const entry = {
      id: crypto.randomUUID(),
      body: body.trim(),
      user,
      at: new Date().toISOString(),
    };
    if (!entry.body) {
      throw new OrderError("INVALID_NOTE", "Note body is required.");
    }
    return this.patchOrder(orderId, {
      internalNotes: [entry, ...order.internalNotes],
      activity: [
        activityEntry("note.added", {
          user,
          notes: entry.body.slice(0, 80),
          newValue: entry.body.slice(0, 80),
        }),
        ...order.activity,
      ],
    });
  }

  async addClaim(
    orderId: string,
    input: {
      type: import("./types").ClaimType;
      note?: string;
      evidence?: string[];
    },
  ): Promise<Order> {
    const order = await this.get(orderId);
    const openedAt = new Date().toISOString();
    const claim = {
      id: crypto.randomUUID(),
      type: input.type,
      status: "open" as const,
      evidence: input.evidence ?? [],
      openedAt,
      note: input.note,
      history: [
        {
          at: openedAt,
          status: "open" as const,
          note: input.note,
          user: "operator",
        },
      ],
    };
    return this.patchOrder(
      orderId,
      {
        claims: [claim, ...order.claims],
        activity: [
          activityEntry("claim.opened", {
            user: "operator",
            newValue: claim.type,
          }),
          ...order.activity,
        ],
      },
      `Claim opened: ${claim.type}`,
    );
  }

  async generateDocument(
    orderId: string,
    type: import("./types").OrderDocumentType,
  ): Promise<Order> {
    const order = await this.get(orderId);
    const now = new Date().toISOString();
    const documents = order.documents.map((doc) =>
      doc.type === type
        ? {
            ...doc,
            status: "available" as const,
            version: doc.version + 1,
            generatedAt: now,
            url:
              type === "shipping_label"
                ? `/api/v1/orders/${orderId}/label`
                : `/api/v1/orders/${orderId}/documents/${type}`,
          }
        : doc,
    );
    const hasType = documents.some((doc) => doc.type === type);
    const nextDocs = hasType
      ? documents
      : [
          ...documents,
          {
            id: crypto.randomUUID(),
            type,
            status: "available" as const,
            version: 1,
            generatedAt: now,
            url: `/api/v1/orders/${orderId}/documents/${type}`,
          },
        ];
    return this.patchOrder(
      orderId,
      {
        documents: nextDocs,
        activity: [
          activityEntry("document.generated", {
            user: "operator",
            newValue: type,
          }),
          ...order.activity,
        ],
      },
      `Generated ${type}`,
    );
  }

  async markOnHold(
    orderId: string,
    input: { reason: HoldReason; note?: string; heldBy?: string },
  ): Promise<Order> {
    const order = await this.get(orderId);
    if (
      order.status !== "Imported" &&
      order.status !== "Confirmed" &&
      order.status !== "Reserved" &&
      order.status !== "Allocated"
    ) {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot hold order in status ${order.status}.`,
      );
    }
    if (order.activeHold) {
      throw new OrderError("ALREADY_ON_HOLD", "Order already has an active hold.");
    }

    const heldBy = input.heldBy ?? "operator";
    const hold: OrderHoldRecord = {
      id: crypto.randomUUID(),
      reason: input.reason,
      heldBy,
      heldAt: new Date().toISOString(),
      statusBeforeHold: order.status,
      note: input.note,
    };

    return this.applyStatus(
      orderId,
      "OnHold",
      {
        activeHold: hold,
        holds: [hold, ...order.holds],
      },
      input.note ?? `On hold: ${input.reason}`,
      heldBy,
    );
  }

  async releaseHold(
    orderId: string,
    input?: { releasedBy?: string; note?: string },
  ): Promise<Order> {
    const order = await this.get(orderId);
    if (order.status !== "OnHold" || !order.activeHold) {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot release hold in status ${order.status}.`,
      );
    }

    const releasedBy = input?.releasedBy ?? "operator";
    const restored = order.activeHold.statusBeforeHold;
    const closedHold: OrderHoldRecord = {
      ...order.activeHold,
      releasedBy,
      releasedAt: new Date().toISOString(),
      note: input?.note ?? order.activeHold.note,
    };
    const holds = order.holds.map((h) =>
      h.id === closedHold.id ? closedHold : h,
    );

    // Bypass strict transition table: restore prior status
    const next: Order = syncOrderShippingFromShipments({
      ...order,
      status: restored,
      activeHold: undefined,
      holds,
      timeline: appendTimeline(
        order.timeline,
        restored,
        input?.note ?? "Hold released",
        "OnHold",
        releasedBy,
      ),
      activity: [
        activityEntry("order.hold_released", {
          user: releasedBy,
          previousStatus: "OnHold",
          newStatus: restored,
          notes: input?.note,
        }),
        ...order.activity,
      ],
      updatedAt: new Date().toISOString(),
    });
    return orderRepository.save(next);
  }

  async markConfirmed(orderId: string, note?: string): Promise<Order> {
    const order = await this.get(orderId);
    if (order.status !== "Imported" && order.status !== "OnHold") {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot confirm order in status ${order.status}.`,
      );
    }
    if (order.status === "OnHold") {
      return this.releaseHold(orderId, { note: note ?? "Released to confirm" });
    }
    return this.applyStatus(
      orderId,
      "Confirmed",
      undefined,
      note ?? "Validated and confirmed",
    );
  }

  /** Lock inventory — Confirmed → Reserved. */
  async markReserved(
    orderId: string,
    lines: OrderLine[],
    note?: string,
  ): Promise<Order> {
    const order = await this.get(orderId);
    if (order.status !== "Confirmed") {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot reserve order in status ${order.status}.`,
      );
    }
    return this.applyStatus(
      orderId,
      "Reserved",
      { lines },
      note ?? "Inventory reserved",
    );
  }

  /** Assign warehouse ops — Reserved → Allocated. */
  async markAllocated(
    orderId: string,
    lines: OrderLine[],
    warehouseId: string,
    estimatedDeliveryAt?: string,
  ): Promise<Order> {
    const order = await this.get(orderId);
    if (order.status !== "Reserved") {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot allocate order in status ${order.status}. Reserve inventory first.`,
      );
    }
    const withWarehouse = lines.map((line) => ({
      ...line,
      warehouseId: line.warehouseId ?? warehouseId,
    }));
    return this.applyStatus(
      orderId,
      "Allocated",
      {
        lines: withWarehouse,
        warehouseId,
        estimatedDeliveryAt,
      },
      `Allocated at ${warehouseId}`,
    );
  }

  async markPicked(orderId: string): Promise<Order> {
    const order = await this.get(orderId);
    const lines = order.lines.map((line) => ({
      ...line,
      pickedQty: line.quantity,
    }));
    return this.applyStatus(orderId, "Picked", { lines }, "Pick complete");
  }

  async markPacked(orderId: string): Promise<Order> {
    const order = await this.get(orderId);
    const lines = order.lines.map((line) => ({
      ...line,
      packedQty: line.quantity,
    }));
    const packed = await this.applyStatus(
      orderId,
      "Packed",
      { lines },
      "Packed and QC passed",
    );
    // Ensure a shipment shell exists for label ops
    if (!packed.shipments.length) {
      return this.createShipment(packed.id, {
        lines: packed.lines.map((l) => ({
          lineId: l.id,
          quantity: l.quantity,
        })),
      });
    }
    return packed;
  }

  async createShipment(
    orderId: string,
    input: {
      lines: ShipmentLine[];
      warehouseId?: string;
      courier?: string;
    },
  ): Promise<Order> {
    const order = await this.get(orderId);
    if (order.status !== "Packed" && order.status !== "Shipped") {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot create shipment in status ${order.status}.`,
      );
    }
    if (!input.lines.length) {
      throw new OrderError("EMPTY_SHIPMENT", "Shipment must include lines.");
    }

    for (const shipLine of input.lines) {
      const orderLine = order.lines.find((line) => line.id === shipLine.lineId);
      if (!orderLine) {
        throw new OrderError(
          "INVALID_LINE",
          `Unknown order line ${shipLine.lineId}.`,
        );
      }
      if (shipLine.quantity <= 0) {
        throw new OrderError(
          "INVALID_QUANTITY",
          `Shipment quantity must be positive for line ${shipLine.lineId}.`,
        );
      }
      const alreadyShipped = order.shipments.reduce((sum, existing) => {
        const match = existing.lines.find((l) => l.lineId === shipLine.lineId);
        return sum + (match?.quantity ?? 0);
      }, 0);
      if (alreadyShipped + shipLine.quantity > orderLine.quantity) {
        throw new OrderError(
          "OVER_SHIP",
          `Cannot ship ${shipLine.quantity} of line ${orderLine.sku} — only ${orderLine.quantity - alreadyShipped} remaining.`,
        );
      }
    }

    const warehouseId =
      input.warehouseId ??
      order.warehouseId ??
      order.lines[0]?.warehouseId ??
      "wh-default";

    const now = new Date().toISOString();
    const shipment: Shipment = {
      id: crypto.randomUUID(),
      orderId,
      warehouseId,
      shippingMode: order.shippingMode,
      lines: input.lines,
      event: "label_generated",
      events: [
        {
          event: "label_generated",
          at: now,
          note: "Shipment created",
          actorType: "system",
        },
      ],
      courier: input.courier,
      deliveryAttempts: 0,
      createdAt: now,
      updatedAt: now,
    };

    return this.patchOrder(
      orderId,
      { shipments: [...order.shipments, shipment] },
      `Shipment ${shipment.id.slice(0, 8)} created`,
    );
  }

  async advanceShipmentEvent(
    orderId: string,
    shipmentId: string,
    event: ShipmentEvent,
    note?: string,
  ): Promise<Order> {
    const order = await this.get(orderId);
    const shipment = order.shipments.find((s) => s.id === shipmentId);
    if (!shipment) {
      throw new OrderError("SHIPMENT_NOT_FOUND", `Shipment ${shipmentId} not found.`);
    }
    if (!canAdvanceShipment(shipment.event, event)) {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot move shipment from ${shipment.event} to ${event}.`,
      );
    }

    const now = new Date().toISOString();
    const updated: Shipment = {
      ...shipment,
      event,
      events: [
        ...shipment.events,
        {
          event,
          at: now,
          note,
          actorType: "user",
          user: "operator",
        },
      ],
      shippedAt:
        event === "pickup_completed" || event === "in_transit"
          ? shipment.shippedAt ?? now
          : shipment.shippedAt,
      deliveredAt: event === "delivered" ? now : shipment.deliveredAt,
      updatedAt: now,
    };

    const shipments = order.shipments.map((s) =>
      s.id === shipmentId ? updated : s,
    );
    let next = await this.patchOrder(
      orderId,
      { shipments },
      `Shipment → ${event}`,
    );

    // Auto-advance order when shipments leave warehouse
    if (
      next.status === "Packed" &&
      hasLeftWarehouse(next)
    ) {
      next = await this.applyStatus(
        orderId,
        "Shipped",
        { shipments: next.shipments },
        "Order shipped (shipment left warehouse)",
      );
    }

    if (
      next.status === "Shipped" &&
      allShipmentsDelivered(next)
    ) {
      next = await this.applyStatus(
        orderId,
        "Delivered",
        { shipments: next.shipments },
        "All shipments delivered",
      );
    }

    return next;
  }

  async ensureMarketplaceLabel(
    orderId: string,
    options?: { courier?: string; shipmentId?: string },
  ): Promise<Order> {
    const order = await this.get(orderId);
    if (!LABEL_ELIGIBLE.includes(order.status)) {
      throw new OrderError(
        "LABEL_UNAVAILABLE",
        `Label not available in status ${order.status}. Pack the order first.`,
      );
    }

    let working = order;
    if (!working.shipments.length) {
      working = await this.createShipment(orderId, {
        lines: working.lines.map((l) => ({
          lineId: l.id,
          quantity: l.quantity,
        })),
        courier: options?.courier,
      });
    }

    const shipmentId =
      options?.shipmentId ?? primaryShipment(working)?.id;
    if (!shipmentId) {
      throw new OrderError("SHIPMENT_NOT_FOUND", "No shipment for label.");
    }

    const shipment = working.shipments.find((s) => s.id === shipmentId)!;
    if (
      shipment.labelUrl &&
      shipment.awb &&
      (!options?.courier || shipment.courier === options.courier)
    ) {
      return working;
    }

    const token = working.orderNumber.replace(/\D/g, "") || "0";
    const defaultCourier = isMarketplaceFulfillmentMode(working.shippingMode)
      ? working.channel === "Flipkart"
        ? "Ekart"
        : working.channel === "Amazon"
          ? "Amazon Shipping"
          : "Marketplace"
      : options?.courier?.trim() ||
        shipment.courier ||
        "Delhivery";

    const awb =
      isAwbVisible(working.shippingMode) ||
      isMarketplaceFulfillmentMode(working.shippingMode)
        ? shipment.awb ?? `AWB${token}${String(token).slice(-3)}`
        : shipment.awb;

    const updated: Shipment = {
      ...shipment,
      courier: options?.courier?.trim() || shipment.courier || defaultCourier,
      awb: isAwbVisible(working.shippingMode)
        ? awb
        : isMarketplaceFulfillmentMode(working.shippingMode)
          ? awb
          : undefined,
      trackingNumber:
        shipment.trackingNumber ??
        (awb ? `TRK${token}${String(token).slice(-4)}` : undefined),
      labelUrl: marketplaceLabelApiPath(working.id),
      event:
        shipment.event === "label_generated"
          ? "label_generated"
          : shipment.event,
      updatedAt: new Date().toISOString(),
    };

    // Marketplace still stores AWB internally for label file but UI hides it
    if (isMarketplaceFulfillmentMode(working.shippingMode) && !updated.awb) {
      updated.awb = `AWB${token}${String(token).slice(-3)}`;
      updated.trackingNumber = `TRK${token}${String(token).slice(-4)}`;
    }

    const shipments = working.shipments.map((s) =>
      s.id === shipmentId ? updated : s,
    );
    return this.patchOrder(
      orderId,
      { shipments },
      `Label ready (${working.channel})`,
    );
  }

  async failQc(orderId: string, reason: string): Promise<Order> {
    const order = await this.get(orderId);
    if (order.status !== "Picked" && order.status !== "Packed") {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot fail QC in status ${order.status}.`,
      );
    }
    const lines = order.lines.map((line) => ({
      ...line,
      packedQty: undefined,
    }));
    if (order.status === "Packed") {
      return this.applyStatus(
        orderId,
        "Picked",
        { lines },
        `QC failed — re-pick: ${reason}`,
      );
    }
    return this.patchOrder(
      orderId,
      { lines },
      `QC failed — stay in pick: ${reason}`,
    );
  }

  async markShipped(
    orderId: string,
    input?: { courier?: string; shipmentId?: string },
  ): Promise<Order> {
    let order = await this.get(orderId);
    if (order.status !== "Packed" && order.status !== "Shipped") {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot ship order in status ${order.status}.`,
      );
    }

    if (!order.shipments.length) {
      order = await this.createShipment(orderId, {
        lines: order.lines.map((l) => ({
          lineId: l.id,
          quantity: l.quantity,
        })),
        courier: input?.courier,
      });
    }

    order = await this.ensureMarketplaceLabel(orderId, {
      courier: input?.courier,
      shipmentId: input?.shipmentId,
    });

    const shipmentId =
      input?.shipmentId ?? primaryShipment(order)?.id;
    if (!shipmentId) {
      throw new OrderError("SHIPMENT_NOT_FOUND", "No shipment to ship.");
    }

    // Advance toward in_transit
    const shipment = order.shipments.find((s) => s.id === shipmentId)!;
    const path: ShipmentEvent[] = [
      "label_printed",
      "manifest_generated",
      "pickup_requested",
      "pickup_completed",
      "in_transit",
    ];
    let current = shipment.event;
    for (const step of path) {
      if (canAdvanceShipment(current, step)) {
        order = await this.advanceShipmentEvent(
          orderId,
          shipmentId,
          step,
          `Ship: ${step}`,
        );
        current = step;
      }
    }

    if (order.status === "Packed") {
      order = await this.applyStatus(
        orderId,
        "Shipped",
        undefined,
        `Shipped${input?.courier ? ` via ${input.courier}` : ""}`,
      );
    }
    return order;
  }

  async advanceTracking(
    orderId: string,
    trackingStatus: "in_transit" | "out_for_delivery",
  ): Promise<Order> {
    const order = await this.get(orderId);
    const shipment = primaryShipment(order);
    if (order.status !== "Shipped" || !shipment) {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot advance tracking for order in status ${order.status}.`,
      );
    }
    const event: ShipmentEvent =
      trackingStatus === "in_transit" ? "in_transit" : "out_for_delivery";
    return this.advanceShipmentEvent(orderId, shipment.id, event);
  }

  async recordFailedAttempt(
    orderId: string,
    reason: string,
  ): Promise<{ order: Order; rtoTriggered: boolean }> {
    const order = await this.get(orderId);
    const shipment = primaryShipment(order);
    if (order.status !== "Shipped" || !shipment) {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot record delivery attempt in status ${order.status}.`,
      );
    }

    const attempts = shipment.deliveryAttempts + 1;
    const now = new Date().toISOString();
    const updated: Shipment = {
      ...shipment,
      deliveryAttempts: attempts,
      lastAttemptAt: now,
      lastAttemptReason: reason,
      event: "delivery_attempt_failed",
      events: [
        ...shipment.events,
        {
          event: "delivery_attempt_failed",
          at: now,
          note: reason,
          actorType: "system",
        },
      ],
      updatedAt: now,
    };

    const shipments = order.shipments.map((s) =>
      s.id === shipment.id ? updated : s,
    );
    let next = await this.patchOrder(
      orderId,
      { shipments },
      `Delivery attempt ${attempts}/${MAX_DELIVERY_ATTEMPTS} failed: ${reason}`,
    );

    if (attempts >= MAX_DELIVERY_ATTEMPTS) {
      next = await this.initiateRto(orderId, reason);
      return { order: next, rtoTriggered: true };
    }
    return { order: next, rtoTriggered: false };
  }

  async initiateRto(orderId: string, reason: string): Promise<Order> {
    const order = await this.get(orderId);
    const shipment = primaryShipment(order);
    if (order.status !== "Shipped" || !shipment) {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot initiate RTO in status ${order.status}.`,
      );
    }

    const expectedRtoAt = new Date(
      Date.now() + 3 * 86_400_000,
    ).toISOString();

    const returnCase: OrderReturnCase = {
      id: crypto.randomUUID(),
      kind: "rto",
      status: "requested",
      reason,
      openedAt: new Date().toISOString(),
      shipmentId: shipment.id,
    };

    // Shipment: rto_expected → rto_in_transit; order stays Shipped
    let next = await this.patchOrder(
      orderId,
      {
        returnCase,
        shipments: order.shipments.map((s) =>
          s.id === shipment.id
            ? {
                ...s,
                expectedRtoAt,
                event: "rto_expected" as const,
                events: [
                  ...s.events,
                  {
                    event: "rto_expected" as const,
                    at: new Date().toISOString(),
                    note: reason,
                    actorType: "system" as const,
                  },
                ],
                updatedAt: new Date().toISOString(),
              }
            : s,
        ),
      },
      `RTO expected: ${reason}`,
    );

    next = await this.advanceShipmentEvent(
      orderId,
      shipment.id,
      "rto_in_transit",
      reason,
    );
    if (next.returnCase?.kind === "rto") {
      next = await this.patchOrder(
        orderId,
        {
          returnCase: {
            ...next.returnCase,
            status: "in_transit",
          },
        },
        "RTO in transit to origin warehouse",
      );
    }
    return next;
  }

  async markDelivered(orderId: string): Promise<Order> {
    const order = await this.get(orderId);
    if (order.status !== "Shipped") {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot deliver order in status ${order.status}.`,
      );
    }

    let next = order;
    for (const shipment of order.shipments) {
      if (
        shipment.event !== "delivered" &&
        shipment.event !== "rto_completed"
      ) {
        // Force path to delivered if possible
        const path: ShipmentEvent[] = [
          "out_for_delivery",
          "delivered",
        ];
        for (const step of path) {
          const current = next.shipments.find((s) => s.id === shipment.id)!;
          if (canAdvanceShipment(current.event, step)) {
            next = await this.advanceShipmentEvent(
              orderId,
              shipment.id,
              step,
            );
          }
        }
      }
    }

    next = await this.get(orderId);
    if (!allShipmentsDelivered(next) && next.shipments.length) {
      // Mark remaining as delivered for operator "Deliver" action
      const now = new Date().toISOString();
      const shipments = next.shipments.map((s) =>
        s.event === "delivered" || s.event === "rto_completed"
          ? s
          : {
              ...s,
              event: "delivered" as const,
              deliveredAt: now,
              events: [
                ...s.events,
                {
                  event: "delivered" as const,
                  at: now,
                  actorType: "user" as const,
                  user: "operator",
                },
              ],
              updatedAt: now,
            },
      );
      next = await this.patchOrder(orderId, { shipments }, "Marked delivered");
    }

    if (next.status === "Shipped") {
      next = await this.applyStatus(orderId, "Delivered", undefined, "Delivered");
    }
    return next;
  }

  async markReturnInTransit(orderId: string): Promise<Order> {
    const order = await this.get(orderId);
    if (!order.returnCase || order.returnCase.status !== "approved") {
      throw new OrderError(
        "NO_OPEN_RETURN",
        "Return must be approved before marking in transit.",
      );
    }
    return this.patchOrder(
      orderId,
      {
        returnCase: {
          ...order.returnCase,
          status: "in_transit",
        },
      },
      "Return in transit to warehouse",
    );
  }

  async receiveReturn(orderId: string): Promise<Order> {
    const order = await this.get(orderId);
    if (!order.returnCase || order.returnCase.status !== "in_transit") {
      throw new OrderError(
        "NO_OPEN_RETURN",
        `Order ${order.orderNumber} has no in-transit return to receive.`,
      );
    }

    const returnCase: OrderReturnCase = {
      ...order.returnCase,
      status: "received",
      receivedAt: new Date().toISOString(),
    };

    return this.patchOrder(
      orderId,
      { returnCase },
      "Return/RTO received at warehouse — QC pending",
    );
  }

  async markRtoCompleted(orderId: string): Promise<Order> {
    const order = await this.get(orderId);
    const shipment =
      order.shipments.find((s) => s.event === "rto_in_transit") ??
      primaryShipment(order);
    if (!shipment || shipment.event !== "rto_in_transit") {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot complete RTO — no shipment in rto_in_transit.`,
      );
    }
    return this.advanceShipmentEvent(
      orderId,
      shipment.id,
      "rto_completed",
      "RTO completed",
    );
  }

  async markSettled(
    orderId: string,
    settlement: OrderSettlement,
  ): Promise<Order> {
    let order = await this.get(orderId);
    if (order.status === "Shipped" && allShipmentsTerminal(order)) {
      order = await this.applyStatus(
        orderId,
        "Delivered",
        undefined,
        "Terminal shipments — ready to settle",
      );
    }
    return this.applyStatus(
      orderId,
      "Settled",
      { settlement },
      "Settlement reconciled",
    );
  }

  async markClosed(orderId: string): Promise<Order> {
    return this.applyStatus(orderId, "Closed", undefined, "Order closed");
  }

  async openReturn(
    orderId: string,
    input: { kind: "return" | "rto"; reason: string },
  ): Promise<Order> {
    const order = await this.get(orderId);
    if (order.returnCase && order.returnCase.status !== "disposed") {
      throw new OrderError(
        "RETURN_ALREADY_OPEN",
        `Order ${order.orderNumber} already has an active return.`,
      );
    }

    if (input.kind === "rto") {
      return this.initiateRto(orderId, input.reason);
    }

    const returnCase: OrderReturnCase = {
      id: crypto.randomUUID(),
      kind: "return",
      status: "requested",
      reason: input.reason,
      openedAt: new Date().toISOString(),
    };

    return this.patchOrder(
      orderId,
      { returnCase },
      `Return requested: ${input.reason}`,
    );
  }

  async approveReturn(orderId: string): Promise<Order> {
    const order = await this.get(orderId);
    if (!order.returnCase || order.returnCase.status !== "requested") {
      throw new OrderError(
        "NO_OPEN_RETURN",
        "No requested return to approve.",
      );
    }
    return this.patchOrder(
      orderId,
      {
        returnCase: {
          ...order.returnCase,
          status: "approved",
          approvedAt: new Date().toISOString(),
        },
      },
      "Return approved",
    );
  }

  async disposeReturn(
    orderId: string,
    disposition: NonNullable<OrderReturnCase["disposition"]>,
  ): Promise<Order> {
    const order = await this.get(orderId);
    if (!order.returnCase || order.returnCase.status !== "received") {
      throw new OrderError(
        "NO_OPEN_RETURN",
        `Order ${order.orderNumber} must be received at warehouse before disposition.`,
      );
    }

    const returnCase: OrderReturnCase = {
      ...order.returnCase,
      status: "disposed",
      disposition,
      disposedAt: new Date().toISOString(),
      receivedAt: order.returnCase.receivedAt ?? new Date().toISOString(),
    };

    let next = await this.patchOrder(
      orderId,
      { returnCase },
      `Return disposed: ${disposition}`,
    );

    const rtoShipment = next.shipments.find(
      (s) => s.event === "rto_in_transit",
    );
    if (rtoShipment) {
      next = await this.markRtoCompleted(orderId);
    }

    return next;
  }

  async cancel(orderId: string, reason?: string): Promise<Order> {
    const order = await this.get(orderId);
    if (order.status === "Cancelled") {
      throw new OrderError(
        "ALREADY_CANCELLED",
        `Order ${order.orderNumber} is already cancelled.`,
      );
    }
    if (!PRE_SHIP_CANCELABLE.includes(order.status)) {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot cancel order in status ${order.status}.`,
      );
    }

    const next: Order = {
      ...order,
      status: "Cancelled",
      cancelReason: reason ?? "Cancelled by system",
      cancelledAt: new Date().toISOString(),
      timeline: appendTimeline(
        order.timeline,
        "Cancelled",
        reason ?? "Cancelled by system",
        order.status,
      ),
      activity: [
        activityEntry("order.cancelled", {
          previousStatus: order.status,
          newStatus: "Cancelled",
          notes: reason,
        }),
        ...order.activity,
      ],
      updatedAt: new Date().toISOString(),
    };
    return orderRepository.save(next);
  }
}

export const orderService = new OrderService();
