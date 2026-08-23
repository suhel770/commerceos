import { inventoryApplication } from "@/lib/application/inventory.application";
import { inventoryConsumptionLedger } from "@/lib/inventory/consumption-ledger";
import { DEFAULT_WAREHOUSE_ID } from "@/lib/inventory/types";
import { products } from "@/lib/mocks/products";
import { orderService } from "@/lib/orders/service";
import {
  CUSTOMER_RETURN_ELIGIBLE,
  OrderError,
  OrderNotFoundError,
  RTO_ELIGIBLE,
  buildMarketplaceLabel,
  buildOrdersExcel,
  type CreateOrderInput,
  type HoldReason,
  type MarketplaceLabelDocument,
  type Order,
  type OrderDocumentType,
  type OrderLine,
  type ReturnDisposition,
  type ShipmentEvent,
  type ShipmentLine,
} from "@/lib/orders";
import {
  assertWorkspaceAccess,
  authorize,
} from "@/lib/platform/authorization";
import {
  auditRepository,
  createAuditEvent,
  type AuditAction,
} from "@/lib/platform/audit";
import type { CommerceContext } from "@/lib/platform/commerce-context";
import {
  domainEvents,
  type ProductDomainEventType,
} from "@/lib/platform/events";

function actorName(context: CommerceContext, fallback = "operator") {
  const name = context.actor?.name?.trim();
  return name || fallback;
}

async function releaseLines(
  context: CommerceContext,
  lines: OrderLine[],
) {
  for (const line of lines) {
    if (!line.reservationId) continue;
    try {
      await inventoryApplication.release(context, {
        reservationId: line.reservationId,
      });
    } catch {
      // Best-effort release; continue remaining lines.
    }
  }
}

async function consumeShippedStock(
  context: CommerceContext,
  order: Order,
) {
  for (const line of order.lines) {
    if (line.reservationId) {
      try {
        await inventoryApplication.release(context, {
          reservationId: line.reservationId,
        });
      } catch {
        // Reservation may already be gone; still outbound adjust.
      }
    }
    await inventoryApplication.adjust(context, {
      productId: line.productId,
      warehouseId: order.warehouseId ?? DEFAULT_WAREHOUSE_ID,
      delta: -line.quantity,
      bucket: "available",
      reason: `order_shipped:${order.orderNumber}`,
    });

    try {
      inventoryConsumptionLedger.recordConsumption({
        idempotencyKey: `order-fulfill-${order.id}-${line.sku}`,
        organizationId: context.organizationId,
        workspaceId: context.workspaceId,
        sku: line.sku,
        productName: line.productName,
        inventoryType: "SELLABLE",
        quantity: line.quantity,
        usageType: "ORDER_FULFILLMENT",
        reason: "Customer Order Fulfillment",
        relatedOrderId: order.orderNumber || order.id,
        relatedShipmentId: order.shipments?.[0]?.id,
        reference: `Order #${order.orderNumber || order.id}`,
        sourceLocationId: line.warehouseId || order.warehouseId,
        actorName: actorName(context),
      });
    } catch {
      // Best-effort ledger sync
    }
  }
}

function validateCatalogLines(
  lines: CreateOrderInput["lines"],
) {
  for (const line of lines) {
    if (!line.productId || !line.sku) {
      throw new OrderError(
        "INVALID_LINE_ITEM",
        "Line item must specify productId and sku.",
      );
    }
  }
}

function hasRtoCompleted(order: Order) {
  return order.shipments.some((shipment) => shipment.event === "rto_completed");
}

async function emitOrderEvent(
  context: CommerceContext,
  type: ProductDomainEventType,
  order: Order,
  payload: Record<string, unknown> = {},
) {
  await domainEvents.publish({
    id: crypto.randomUUID(),
    type,
    organizationId: context.organizationId,
    workspaceId: context.workspaceId,
    productId: order.lines[0]?.productId ?? order.id,
    occurredAt: new Date().toISOString(),
    payload: {
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      ...payload,
    },
  });
}

async function auditOrder(
  context: CommerceContext,
  action: AuditAction,
  order: Order,
  before?: Order,
  metadata?: Record<string, unknown>,
) {
  await auditRepository.append(
    createAuditEvent({
      context,
      entityId: order.id,
      action,
      before,
      after: order,
      metadata: {
        orderNumber: order.orderNumber,
        status: order.status,
        ...metadata,
      },
    }),
  );
}

class OrdersApplicationService {
  async list(
    context: CommerceContext,
    filter?: { productId?: string; dateFrom?: string; dateTo?: string },
  ) {
    authorize(context, "orders.view");
    assertWorkspaceAccess(context, context.workspaceId);

    return orderService.list({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      productId: filter?.productId,
      dateFrom: filter?.dateFrom,
      dateTo: filter?.dateTo,
    });
  }

  async exportExcel(
    context: CommerceContext,
    filter?: { productId?: string; dateFrom?: string; dateTo?: string },
  ) {
    const orders = await this.list(context, filter);
    return {
      orders,
      document: buildOrdersExcel(orders),
    };
  }

  async get(context: CommerceContext, orderId: string) {
    authorize(context, "orders.view");
    assertWorkspaceAccess(context, context.workspaceId);

    const order = await orderService.get(orderId);
    if (
      order.organizationId !== context.organizationId ||
      order.workspaceId !== context.workspaceId
    ) {
      throw new OrderNotFoundError(orderId);
    }
    return order;
  }

  /** Confirmed → reserve inventory → Reserved → Allocated. */
  private async reserveThenAllocate(
    context: CommerceContext,
    order: Order,
  ): Promise<Order> {
    const reserved = await this.reserveInventory(context, order);
    return this.completeAllocate(context, reserved);
  }

  private async reserveInventory(
    context: CommerceContext,
    order: Order,
  ): Promise<Order> {
    if (order.status !== "Confirmed") {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot reserve order in status ${order.status}.`,
      );
    }

    const warehouseId = DEFAULT_WAREHOUSE_ID;
    const reservedLines: OrderLine[] = [];
    try {
      for (const line of order.lines) {
        const reserved = await inventoryApplication.reserve(context, {
          productId: line.productId,
          warehouseId,
          quantity: line.quantity,
          reference: order.id,
        });
        reservedLines.push({
          ...line,
          reservationId: reserved.reservation.id,
          warehouseId: line.warehouseId ?? warehouseId,
        });
      }
    } catch (error) {
      await releaseLines(context, reservedLines);
      await orderService.cancel(order.id, "Reservation failed — rolled back");
      throw error;
    }

    const reserved = await orderService.markReserved(order.id, reservedLines);
    await auditOrder(context, "order.reserved", reserved, order, {
      phase: "reserved",
      warehouseId,
      reservations: reserved.lines.map((line) => ({
        productId: line.productId,
        reservationId: line.reservationId,
        quantity: line.quantity,
      })),
    });
    return reserved;
  }

  private async completeAllocate(
    context: CommerceContext,
    order: Order,
  ): Promise<Order> {
    if (order.status !== "Reserved") {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot allocate order in status ${order.status}. Reserve inventory first.`,
      );
    }

    const warehouseId = order.warehouseId ?? DEFAULT_WAREHOUSE_ID;
    const estimatedDeliveryAt = new Date(
      Date.now() + 5 * 86_400_000,
    ).toISOString();

    const allocated = await orderService.markAllocated(
      order.id,
      order.lines,
      warehouseId,
      estimatedDeliveryAt,
    );

    await auditOrder(context, "order.allocated", allocated, order, {
      warehouseId,
      reservations: allocated.lines.map((line) => ({
        productId: line.productId,
        reservationId: line.reservationId,
        quantity: line.quantity,
      })),
    });
    await emitOrderEvent(context, "OrderAllocated", allocated);

    return allocated;
  }

  async confirm(context: CommerceContext, orderId: string, note?: string) {
    authorize(context, "orders.fulfil");
    assertWorkspaceAccess(context, context.workspaceId);
    const existing = await this.get(context, orderId);
    const order = await orderService.markConfirmed(
      orderId,
      note ?? "Order accepted / confirmed",
    );
    await auditOrder(context, "order.confirmed", order, existing, {
      channel: order.channel,
      shippingMode: order.shippingMode,
    });
    await emitOrderEvent(context, "OrderConfirmed", order);
    return order;
  }

  async reserve(context: CommerceContext, orderId: string) {
    authorize(context, "orders.fulfil");
    assertWorkspaceAccess(context, context.workspaceId);
    const existing = await this.get(context, orderId);
    return this.reserveInventory(context, existing);
  }

  async allocate(context: CommerceContext, orderId: string) {
    authorize(context, "orders.fulfil");
    assertWorkspaceAccess(context, context.workspaceId);
    const existing = await this.get(context, orderId);
    return this.completeAllocate(context, existing);
  }

  async create(
    context: CommerceContext,
    input: Omit<CreateOrderInput, "organizationId" | "workspaceId">,
  ) {
    authorize(context, "orders.create");
    assertWorkspaceAccess(context, context.workspaceId);

    if (input.paymentStatus === "failed") {
      throw new OrderError(
        "PAYMENT_FAILED",
        "Cannot create order with failed payment.",
      );
    }

    validateCatalogLines(input.lines);

    let order = await orderService.createDraft({
      ...input,
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      paymentStatus: input.paymentStatus ?? "paid",
    });

    await auditOrder(context, "order.created", order, undefined, {
      channel: order.channel,
      lineCount: order.lines.length,
    });
    await emitOrderEvent(context, "OrderCreated", order);

    if (order.paymentStatus === "pending") {
      order = await orderService.markOnHold(order.id, {
        reason: "payment_issue",
        note: "Payment pending — held for review",
        heldBy: actorName(context),
      });
      await auditOrder(context, "order.held", order);
      await emitOrderEvent(context, "OrderHeld", order);
      return order;
    }

    order = await orderService.markConfirmed(order.id);
    return this.reserveThenAllocate(context, order);
  }

  async import(
    context: CommerceContext,
    input: Omit<CreateOrderInput, "organizationId" | "workspaceId">,
  ) {
    return this.create(context, input);
  }

  async hold(
    context: CommerceContext,
    orderId: string,
    input?: { reason?: HoldReason; note?: string },
  ) {
    authorize(context, "orders.fulfil");
    assertWorkspaceAccess(context, context.workspaceId);

    const existing = await this.get(context, orderId);
    const order = await orderService.markOnHold(orderId, {
      reason: input?.reason ?? "manual_review",
      note: input?.note,
      heldBy: actorName(context),
    });
    await auditOrder(context, "order.held", order, existing, {
      reason: input?.reason ?? "manual_review",
    });
    await emitOrderEvent(context, "OrderHeld", order);
    return order;
  }

  async releaseHold(
    context: CommerceContext,
    orderId: string,
    input?: { note?: string },
  ) {
    authorize(context, "orders.fulfil");
    assertWorkspaceAccess(context, context.workspaceId);

    const existing = await this.get(context, orderId);
    if (existing.status !== "OnHold") {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Order ${existing.orderNumber} is not on hold.`,
      );
    }
    if (existing.paymentStatus === "failed") {
      throw new OrderError(
        "PAYMENT_FAILED",
        "Cannot release hold with failed payment.",
      );
    }

    let order = await orderService.releaseHold(orderId, {
      releasedBy: actorName(context),
      note: input?.note ?? "Hold released",
    });

    if (order.paymentStatus === "pending") {
      return order;
    }

    if (order.status === "Confirmed") {
      return this.reserveThenAllocate(context, order);
    }

    return order;
  }

  async pick(context: CommerceContext, orderId: string) {
    authorize(context, "orders.fulfil");
    const existing = await this.get(context, orderId);
    const order = await orderService.markPicked(orderId);
    await auditOrder(context, "order.picked", order, existing);
    await emitOrderEvent(context, "OrderPicked", order);
    return order;
  }

  async pack(context: CommerceContext, orderId: string) {
    authorize(context, "orders.fulfil");
    const existing = await this.get(context, orderId);
    const order = await orderService.markPacked(orderId);
    await auditOrder(context, "order.packed", order, existing);
    await emitOrderEvent(context, "OrderPacked", order);
    return order;
  }

  async failQc(
    context: CommerceContext,
    orderId: string,
    reason?: string,
  ) {
    authorize(context, "orders.fulfil");
    const existing = await this.get(context, orderId);
    const order = await orderService.failQc(
      orderId,
      reason ?? "Wrong item / damage",
    );
    await auditOrder(context, "order.qc_failed", order, existing, {
      reason: reason ?? "Wrong item / damage",
    });
    return order;
  }

  async ship(
    context: CommerceContext,
    orderId: string,
    input?: { courier?: string },
  ) {
    authorize(context, "orders.fulfil");
    const existing = await this.get(context, orderId);

    await consumeShippedStock(context, existing);

    let order = await orderService.markShipped(orderId, {
      courier: input?.courier?.trim() || undefined,
    });

    const clearedLines = order.lines.map((line) => ({
      ...line,
      reservationId: undefined,
      pickedQty: line.pickedQty ?? line.quantity,
      packedQty: line.packedQty ?? line.quantity,
      shippedQty: line.shippedQty ?? line.quantity,
    }));
    order = await orderService.patchOrder(orderId, { lines: clearedLines });

    await auditOrder(context, "order.shipped", order, existing, {
      awb: order.shipping?.awb,
      courier: order.shipping?.courier ?? input?.courier,
    });
    await emitOrderEvent(context, "OrderShipped", order, {
      awb: order.shipping?.awb,
    });
    return order;
  }

  async createShipment(
    context: CommerceContext,
    orderId: string,
    input: {
      lines: ShipmentLine[];
      warehouseId?: string;
      courier?: string;
    },
  ) {
    authorize(context, "orders.fulfil");
    assertWorkspaceAccess(context, context.workspaceId);
    const existing = await this.get(context, orderId);
    const order = await orderService.createShipment(orderId, input);
    await auditOrder(context, "order.document_generated", order, existing, {
      action: "shipment_created",
      courier: input.courier,
    });
    return order;
  }

  async advanceShipmentEvent(
    context: CommerceContext,
    orderId: string,
    shipmentId: string,
    event: ShipmentEvent,
    note?: string,
  ) {
    authorize(context, "orders.fulfil");
    assertWorkspaceAccess(context, context.workspaceId);
    const existing = await this.get(context, orderId);
    const order = await orderService.advanceShipmentEvent(
      orderId,
      shipmentId,
      event,
      note,
    );
    await auditOrder(context, "order.tracking_updated", order, existing, {
      shipmentId,
      event,
      note,
    });
    await emitOrderEvent(context, "OrderTrackingUpdated", order, {
      shipmentId,
      event,
    });
    if (hasRtoCompleted(order) && !hasRtoCompleted(existing)) {
      await auditOrder(context, "order.rto_completed", order, existing);
      await emitOrderEvent(context, "OrderRtoCompleted", order);
    }
    return order;
  }

  async advanceTracking(
    context: CommerceContext,
    orderId: string,
    trackingStatus: "in_transit" | "out_for_delivery",
  ) {
    authorize(context, "orders.fulfil");
    const existing = await this.get(context, orderId);
    const order = await orderService.advanceTracking(orderId, trackingStatus);
    await auditOrder(context, "order.tracking_updated", order, existing, {
      trackingStatus,
    });
    await emitOrderEvent(context, "OrderTrackingUpdated", order, {
      trackingStatus,
    });
    return order;
  }

  async recordFailedAttempt(
    context: CommerceContext,
    orderId: string,
    reason?: string,
  ) {
    authorize(context, "orders.fulfil");
    const existing = await this.get(context, orderId);
    const result = await orderService.recordFailedAttempt(
      orderId,
      reason ?? "Customer unavailable",
    );

    await auditOrder(
      context,
      result.rtoTriggered
        ? "order.rto_initiated"
        : "order.delivery_attempt_failed",
      result.order,
      existing,
      {
        reason: reason ?? "Customer unavailable",
        attempts: result.order.shipping?.deliveryAttempts,
        rtoTriggered: result.rtoTriggered,
      },
    );

    if (result.rtoTriggered) {
      await emitOrderEvent(context, "OrderRtoInitiated", result.order);
    }

    return result.order;
  }

  async initiateRto(
    context: CommerceContext,
    orderId: string,
    reason?: string,
  ) {
    authorize(context, "orders.return");
    const existing = await this.get(context, orderId);
    if (!RTO_ELIGIBLE.includes(existing.status)) {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot initiate RTO in status ${existing.status}.`,
      );
    }
    const order = await orderService.initiateRto(
      orderId,
      reason ?? "RTO initiated",
    );
    await auditOrder(context, "order.rto_initiated", order, existing);
    await emitOrderEvent(context, "OrderRtoInitiated", order);
    return order;
  }

  async downloadLabel(
    context: CommerceContext,
    orderId: string,
    options?: { courier?: string },
  ): Promise<{ order: Order; document: MarketplaceLabelDocument }> {
    authorize(context, "orders.view");
    assertWorkspaceAccess(context, context.workspaceId);
    await this.get(context, orderId);

    const order = await orderService.ensureMarketplaceLabel(orderId, options);
    const document = buildMarketplaceLabel(order);
    return { order, document };
  }

  async deliver(context: CommerceContext, orderId: string) {
    authorize(context, "orders.fulfil");
    const existing = await this.get(context, orderId);
    const order = await orderService.markDelivered(orderId);
    await auditOrder(context, "order.delivered", order, existing);
    await emitOrderEvent(context, "OrderDelivered", order);
    return order;
  }

  async settle(context: CommerceContext, orderId: string) {
    authorize(context, "orders.settle");
    const existing = await this.get(context, orderId);

    const isRto = hasRtoCompleted(existing);
    const subtotal = existing.totals.subtotal;
    const marketplaceFees = Math.round(subtotal * (isRto ? 0.1 : 0.08));
    const commission = Math.round(subtotal * (isRto ? 0.08 : 0.04));
    const shippingCharges = isRto ? 0 : 40;
    const reverseShipping = isRto ? 60 : 0;
    const tcs = Math.round(subtotal * 0.01);
    const tds = Math.round(subtotal * 0.01);
    const deductions =
      marketplaceFees +
      commission +
      shippingCharges +
      reverseShipping +
      tcs +
      tds;
    const netSettlement = Math.max(0, subtotal - deductions);
    const settlementDate = new Date().toISOString();

    const order = await orderService.markSettled(orderId, {
      marketplaceFees,
      commission,
      shippingCharges,
      reverseShipping,
      tcs,
      tds,
      netSettlement,
      settlementDate,
      settlementStatus: "reconciled",
      fees: marketplaceFees + commission,
      payout: netSettlement,
      reconciledAt: settlementDate,
    });

    await auditOrder(context, "order.settled", order, existing, {
      marketplaceFees,
      commission,
      netSettlement,
      rto: isRto,
    });
    await emitOrderEvent(context, "OrderSettled", order, {
      marketplaceFees,
      netSettlement,
    });
    return order;
  }

  async close(context: CommerceContext, orderId: string) {
    authorize(context, "orders.fulfil");
    const existing = await this.get(context, orderId);

    // Marketplace orders must be settled before close from Delivered.
    if (existing.status === "Delivered" && existing.channel !== "Manual") {
      throw new OrderError(
        "SETTLEMENT_REQUIRED",
        "Marketplace orders must be settled before close.",
      );
    }

    const order = await orderService.markClosed(orderId);
    await auditOrder(context, "order.closed", order, existing);
    await emitOrderEvent(context, "OrderClosed", order);
    return order;
  }

  async openReturn(
    context: CommerceContext,
    orderId: string,
    input: { kind?: "return" | "rto"; reason: string },
  ) {
    authorize(context, "orders.return");
    const existing = await this.get(context, orderId);
    const kind = input.kind ?? "return";

    if (kind === "rto") {
      return this.initiateRto(context, orderId, input.reason);
    }

    if (!CUSTOMER_RETURN_ELIGIBLE.includes(existing.status)) {
      throw new OrderError(
        "INVALID_TRANSITION",
        `Cannot open customer return for order in status ${existing.status}.`,
      );
    }

    const order = await orderService.openReturn(orderId, {
      kind: "return",
      reason: input.reason,
    });

    await auditOrder(context, "order.return_opened", order, existing, {
      kind: "return",
      reason: input.reason,
    });
    await emitOrderEvent(context, "OrderReturnOpened", order);
    return order;
  }

  async approveReturn(context: CommerceContext, orderId: string) {
    authorize(context, "orders.return");
    const existing = await this.get(context, orderId);
    const order = await orderService.approveReturn(orderId);
    await auditOrder(context, "order.return_approved", order, existing);
    await emitOrderEvent(context, "OrderReturnApproved", order);
    return order;
  }

  async markReturnInTransit(context: CommerceContext, orderId: string) {
    authorize(context, "orders.return");
    const existing = await this.get(context, orderId);
    const order = await orderService.markReturnInTransit(orderId);
    await auditOrder(context, "order.return_in_transit", order, existing);
    await emitOrderEvent(context, "OrderReturnOpened", order, {
      phase: "in_transit",
    });
    return order;
  }

  async receiveReturn(context: CommerceContext, orderId: string) {
    authorize(context, "orders.return");
    const existing = await this.get(context, orderId);
    const order = await orderService.receiveReturn(orderId);
    await auditOrder(context, "order.return_received", order, existing);
    await emitOrderEvent(context, "OrderReturnReceived", order);
    return order;
  }

  async disposeReturn(
    context: CommerceContext,
    orderId: string,
    disposition: ReturnDisposition,
  ) {
    authorize(context, "orders.return");
    const existing = await this.get(context, orderId);

    if (!existing.returnCase || existing.returnCase.status !== "received") {
      throw new OrderError(
        "NO_OPEN_RETURN",
        `Order ${existing.orderNumber} must be received before disposition.`,
      );
    }

    for (const line of existing.lines) {
      if (disposition === "restock" || disposition === "refurbish") {
        await inventoryApplication.adjust(context, {
          productId: line.productId,
          warehouseId: existing.warehouseId ?? DEFAULT_WAREHOUSE_ID,
          delta: line.quantity,
          bucket: "available",
          reason: `order_return_${disposition}:${existing.orderNumber}`,
        });
      } else {
        await inventoryApplication.adjust(context, {
          productId: line.productId,
          warehouseId: existing.warehouseId ?? DEFAULT_WAREHOUSE_ID,
          delta: line.quantity,
          bucket: "damaged",
          reason: `order_return_scrap:${existing.orderNumber}`,
        });
      }
    }

    const order = await orderService.disposeReturn(orderId, disposition);
    await auditOrder(context, "order.return_disposed", order, existing, {
      disposition,
    });
    await emitOrderEvent(context, "OrderReturnDisposed", order, {
      disposition,
    });
    if (hasRtoCompleted(order)) {
      await auditOrder(context, "order.rto_completed", order, existing);
      await emitOrderEvent(context, "OrderRtoCompleted", order);
    }
    return order;
  }

  async cancel(
    context: CommerceContext,
    orderId: string,
    reason?: string,
  ) {
    authorize(context, "orders.cancel");
    assertWorkspaceAccess(context, context.workspaceId);

    const existing = await this.get(context, orderId);
    await releaseLines(context, existing.lines);

    const order = await orderService.cancel(orderId, reason);

    await auditOrder(context, "order.cancelled", order, existing, {
      reason: order.cancelReason,
    });
    await emitOrderEvent(context, "OrderCancelled", order, {
      reason: order.cancelReason,
    });

    return order;
  }

  async addNote(
    context: CommerceContext,
    orderId: string,
    body: string,
  ) {
    authorize(context, "orders.view");
    assertWorkspaceAccess(context, context.workspaceId);
    const existing = await this.get(context, orderId);
    const order = await orderService.addInternalNote(
      orderId,
      body,
      actorName(context),
    );
    await auditOrder(context, "order.note_added", order, existing, {
      note: body.slice(0, 120),
    });
    return order;
  }

  async addClaim(
    context: CommerceContext,
    orderId: string,
    input: {
      type:
        | "empty_box"
        | "wrong_item"
        | "courier_damage"
        | "lost_shipment"
        | "fake_return"
        | "weight_difference"
        | "damaged"
        | "missing_item";
      note?: string;
      evidence?: string[];
    },
  ) {
    authorize(context, "orders.return");
    assertWorkspaceAccess(context, context.workspaceId);
    const existing = await this.get(context, orderId);
    const order = await orderService.addClaim(orderId, input);
    await auditOrder(context, "order.claim_opened", order, existing, {
      claimType: input.type,
    });
    return order;
  }

  async generateDocument(
    context: CommerceContext,
    orderId: string,
    type: OrderDocumentType,
  ) {
    authorize(context, "orders.fulfil");
    assertWorkspaceAccess(context, context.workspaceId);
    const existing = await this.get(context, orderId);
    const order = await orderService.generateDocument(orderId, type);
    await auditOrder(context, "order.document_generated", order, existing, {
      documentType: type,
    });
    return order;
  }

  async bulk(
    context: CommerceContext,
    input: {
      orderIds: string[];
      action:
        | "confirm"
        | "accept"
        | "reserve"
        | "allocate"
        | "pick"
        | "pack"
        | "ship"
        | "cancel"
        | "hold"
        | "release_hold"
        | "generate_labels"
        | "print_labels"
        | "generate_invoice"
        | "export"
        | "print_pick_list"
        | "generate_manifest"
        | "mark_packed"
        | "mark_shipped";
      reason?: string;
    },
  ) {
    authorize(context, "orders.fulfil");
    assertWorkspaceAccess(context, context.workspaceId);

    const results: Array<{
      orderId: string;
      ok: boolean;
      message?: string;
      order?: Order;
    }> = [];

    for (const orderId of input.orderIds) {
      try {
        switch (input.action) {
          case "confirm":
          case "accept": {
            const order = await this.confirm(
              context,
              orderId,
              input.reason ?? "Bulk accepted / confirmed",
            );
            results.push({ orderId, ok: true, order });
            break;
          }
          case "cancel": {
            const order = await this.cancel(context, orderId, input.reason);
            results.push({ orderId, ok: true, order });
            break;
          }
          case "reserve": {
            const order = await this.reserve(context, orderId);
            results.push({ orderId, ok: true, order });
            break;
          }
          case "allocate": {
            const order = await this.allocate(context, orderId);
            results.push({ orderId, ok: true, order });
            break;
          }
          case "pick": {
            const order = await this.pick(context, orderId);
            results.push({ orderId, ok: true, order });
            break;
          }
          case "pack":
          case "mark_packed": {
            const order = await this.pack(context, orderId);
            results.push({ orderId, ok: true, order });
            break;
          }
          case "ship":
          case "mark_shipped": {
            const order = await this.ship(context, orderId, {});
            results.push({ orderId, ok: true, order });
            break;
          }
          case "hold": {
            const order = await this.hold(context, orderId, {
              reason: "manual_review",
              note: input.reason,
            });
            results.push({ orderId, ok: true, order });
            break;
          }
          case "release_hold": {
            const order = await this.releaseHold(context, orderId, {
              note: input.reason,
            });
            results.push({ orderId, ok: true, order });
            break;
          }
          case "generate_labels":
          case "print_labels": {
            const labeled = await this.downloadLabel(context, orderId);
            results.push({ orderId, ok: true, order: labeled.order });
            break;
          }
          case "generate_invoice": {
            const order = await this.generateDocument(
              context,
              orderId,
              "invoice",
            );
            results.push({ orderId, ok: true, order });
            break;
          }
          case "print_pick_list": {
            const order = await this.generateDocument(
              context,
              orderId,
              "packing_slip",
            );
            results.push({ orderId, ok: true, order });
            break;
          }
          case "generate_manifest": {
            const order = await this.generateDocument(
              context,
              orderId,
              "manifest",
            );
            results.push({ orderId, ok: true, order });
            break;
          }
          case "export": {
            const order = await this.get(context, orderId);
            results.push({ orderId, ok: true, order });
            break;
          }
          default: {
            results.push({
              orderId,
              ok: false,
              message: `Action ${input.action as string} is not executable in bulk yet.`,
            });
          }
        }
      } catch (error) {
        results.push({
          orderId,
          ok: false,
          message: error instanceof Error ? error.message : "Bulk action failed",
        });
      }
    }

    return {
      action: input.action,
      results,
      successCount: results.filter((row) => row.ok).length,
      failureCount: results.filter((row) => !row.ok).length,
    };
  }
}

export const ordersApplication = new OrdersApplicationService();

export type { Order };
export { OrderError, OrderNotFoundError };
