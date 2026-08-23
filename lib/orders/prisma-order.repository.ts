/**
 * CommerceOS V4 — Prisma Order Repository
 * PostgreSQL-backed implementation of IOrderRepository querying db.order & db.orderItem
 * Enforces organizationId + workspaceId tenant isolation.
 */

import { db } from "@/lib/db";
import { MarketplaceName, OrderStatus as PrismaOrderStatus, PaymentStatus as PrismaPaymentStatus } from "@/generated/prisma/client";
import type { IOrderRepository, OrderListFilter } from "./order.repository.interface";
import type { Order, OrderLine, OrderStatus, PaymentStatus } from "./types";

export class PrismaOrderRepository implements IOrderRepository {
  private defaultWorkspaceId = "ws-default";
  private defaultOrgId = "org-commerceos";

  /**
   * Map Prisma Order + OrderItem records to domain Order object
   */
  private mapToDomain(row: {
    id: string;
    workspaceId: string;
    orderNumber: string;
    channel: string;
    externalOrderId: string | null;
    status: string;
    paymentStatus: string;
    shippingMode: string;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    shippingAddress: string | null;
    warehouseId: string | null;
    subtotal: { toString(): string } | number;
    taxTotal: { toString(): string } | number;
    shippingTotal: { toString(): string } | number;
    totalAmount: { toString(): string } | number;
    cancelledAt: Date | null;
    cancelReason: string | null;
    createdAt: Date;
    updatedAt: Date;
    items?: Array<{
      id: string;
      productId: string;
      warehouseId: string | null;
      sku: string;
      productName: string;
      quantity: number;
      unitPrice: { toString(): string } | number;
      taxAmount: { toString(): string } | number;
      totalPrice: { toString(): string } | number;
    }>;
  }): Order {
    const parseNum = (val: { toString(): string } | number) =>
      typeof val === "number" ? val : Number(val.toString());

    // Map Prisma status enum back to domain OrderStatus
    let domainStatus: OrderStatus = "Imported";
    const st = row.status.toUpperCase();
    if (st === "CONFIRMED") domainStatus = "Confirmed";
    else if (st === "PROCESSING") domainStatus = "Allocated";
    else if (st === "SHIPPED") domainStatus = "Shipped";
    else if (st === "DELIVERED") domainStatus = "Delivered";
    else if (st === "CANCELLED") domainStatus = "Cancelled";
    else domainStatus = "Imported";

    const lines: OrderLine[] = (row.items || []).map((item) => {
      const uPrice = parseNum(item.unitPrice);
      const tTax = parseNum(item.taxAmount);
      const tPrice = parseNum(item.totalPrice);
      return {
        id: item.id,
        productId: item.productId,
        sku: item.sku,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: uPrice,
        taxRate: item.quantity > 0 ? (tTax / (uPrice * item.quantity)) * 100 : 18,
        taxAmount: tTax,
        totalPrice: tPrice,
        status: domainStatus,
      };
    });

    let domainPayStatus: PaymentStatus = "pending";
    if (row.paymentStatus.toLowerCase() === "paid") domainPayStatus = "paid";
    else if (row.paymentStatus.toLowerCase() === "failed") domainPayStatus = "failed";

    return {
      id: row.id,
      organizationId: this.defaultOrgId,
      workspaceId: row.workspaceId,
      orderNumber: row.orderNumber,
      externalOrderId: row.externalOrderId || undefined,
      channel: (row.channel.toLowerCase() as Order["channel"]) || "amazon",
      status: domainStatus,
      paymentStatus: domainPayStatus,
      shippingMode: (row.shippingMode.toLowerCase() as Order["shippingMode"]) || "marketplace",
      priority: "normal",
      tags: [],
      customer: {
        name: row.customerName,
        email: row.customerEmail || undefined,
        phone: row.customerPhone || undefined,
        city: row.shippingAddress || undefined,
      },
      warehouseId: row.warehouseId || undefined,
      lines,
      totals: {
        subtotal: parseNum(row.totalAmount),
        currency: "INR",
      },
      shipments: [],
      holds: [],
      documents: [],
      claims: [],
      internalNotes: [],
      activity: [],
      timeline: [],
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  public async list(filter?: OrderListFilter): Promise<Order[]> {
    const workspaceId = filter?.workspaceId || this.defaultWorkspaceId;
    const where: { workspaceId: string; status?: PrismaOrderStatus; createdAt?: { gte?: Date; lte?: Date } } = {
      workspaceId,
    };

    if (filter?.status) {
      const st = filter.status.toLowerCase();
      if (st === "confirmed") where.status = PrismaOrderStatus.CONFIRMED;
      else if (st === "shipped") where.status = PrismaOrderStatus.SHIPPED;
      else if (st === "delivered" || st === "settled" || st === "closed") where.status = PrismaOrderStatus.DELIVERED;
      else if (st === "cancelled") where.status = PrismaOrderStatus.CANCELLED;
      else if (st === "allocated" || st === "picked" || st === "packed" || st === "onhold" || st === "reserved") where.status = PrismaOrderStatus.PROCESSING;
      else where.status = PrismaOrderStatus.PENDING;
    }

    if (filter?.dateFrom || filter?.dateTo) {
      where.createdAt = {};
      if (filter.dateFrom) where.createdAt.gte = new Date(`${filter.dateFrom}T00:00:00`);
      if (filter.dateTo) where.createdAt.lte = new Date(`${filter.dateTo}T23:59:59.999`);
    }

    const rows = await db.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return rows.map((r) => this.mapToDomain(r));
  }

  public async getById(orderId: string): Promise<Order | undefined> {
    const row = await db.order.findFirst({
      where: {
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
      include: { items: true },
    });

    if (!row) return undefined;
    return this.mapToDomain(row);
  }

  public async save(order: Order): Promise<Order> {
    const workspaceId = order.workspaceId || this.defaultWorkspaceId;

    // Convert domain OrderStatus to Prisma OrderStatus enum
    let prismaStatus: PrismaOrderStatus = PrismaOrderStatus.PENDING;
    const st = order.status.toLowerCase();
    if (st === "confirmed") prismaStatus = PrismaOrderStatus.CONFIRMED;
    else if (st === "shipped") prismaStatus = PrismaOrderStatus.SHIPPED;
    else if (st === "delivered" || st === "settled" || st === "closed") prismaStatus = PrismaOrderStatus.DELIVERED;
    else if (st === "cancelled") prismaStatus = PrismaOrderStatus.CANCELLED;
    else if (st === "allocated" || st === "picked" || st === "packed" || st === "onhold" || st === "reserved") prismaStatus = PrismaOrderStatus.PROCESSING;

    // Convert channel
    let prismaChannel: MarketplaceName = MarketplaceName.AMAZON;
    const ch = order.channel.toLowerCase();
    if (ch === "flipkart") prismaChannel = MarketplaceName.FLIPKART;
    else if (ch === "meesho") prismaChannel = MarketplaceName.MEESHO;
    else if (ch === "shopify") prismaChannel = MarketplaceName.SHOPIFY;
    else if (ch === "woocommerce") prismaChannel = MarketplaceName.WOOCOMMERCE;

    let prismaPayStatus: PrismaPaymentStatus = PrismaPaymentStatus.UNPAID;
    if (order.paymentStatus === "paid") prismaPayStatus = PrismaPaymentStatus.PAID;
    else if (order.paymentStatus === "failed") prismaPayStatus = PrismaPaymentStatus.FAILED;

    return db.$transaction(async (tx) => {
      // Upsert main Order record
      const savedOrder = await tx.order.upsert({
        where: {
          workspaceId_orderNumber: {
            workspaceId,
            orderNumber: order.orderNumber,
          },
        },
        create: {
          id: order.id,
          workspaceId,
          orderNumber: order.orderNumber,
          channel: prismaChannel,
          externalOrderId: order.externalOrderId || null,
          status: prismaStatus,
          paymentStatus: prismaPayStatus,
          shippingMode: order.shippingMode?.toUpperCase() || "STANDARD",
          customerName: order.customer.name,
          customerEmail: order.customer.email || null,
          customerPhone: order.customer.phone || null,
          shippingAddress: order.customer.city || null,
          warehouseId: order.warehouseId || null,
          subtotal: order.totals?.subtotal ?? 0,
          taxTotal: 0,
          shippingTotal: 0,
          totalAmount: order.totals?.subtotal ?? 0,
        },
        update: {
          status: prismaStatus,
          paymentStatus: prismaPayStatus,
          shippingMode: order.shippingMode?.toUpperCase() || "STANDARD",
          customerName: order.customer.name,
          customerEmail: order.customer.email || null,
          customerPhone: order.customer.phone || null,
          shippingAddress: order.customer.city || null,
          warehouseId: order.warehouseId || null,
          subtotal: order.totals?.subtotal ?? 0,
          taxTotal: 0,
          shippingTotal: 0,
          totalAmount: order.totals?.subtotal ?? 0,
          updatedAt: new Date(),
        },
      });

      // Upsert OrderItems for each line
      if (order.lines && order.lines.length > 0) {
        for (const line of order.lines) {
          // Ensure valid Product ID exists in PostgreSQL if needed
          let validProductId = line.productId;
          const existingProd = await tx.product.findFirst({
            where: { workspaceId, id: line.productId },
            select: { id: true },
          });

          if (!existingProd) {
            const prodBySku = await tx.product.findFirst({
              where: { workspaceId, sku: line.sku },
              select: { id: true },
            });
            if (prodBySku) {
              validProductId = prodBySku.id;
            } else {
              // Create placeholder product record to satisfy OrderItem foreign key
              const newProd = await tx.product.create({
                data: {
                  id: line.productId || `prod-${line.sku}`,
                  workspaceId,
                  sku: line.sku,
                  name: line.productName || line.sku,
                  category: "General",
                  costPrice: line.unitPrice,
                  sellingPrice: line.unitPrice,
                  mrp: line.unitPrice,
                  status: "Active",
                },
                select: { id: true },
              });
              validProductId = newProd.id;
            }
          }

          // Delete existing item or create
          await tx.orderItem.deleteMany({
            where: { id: line.id },
          });

          await tx.orderItem.create({
            data: {
              id: line.id,
              workspaceId,
              orderId: savedOrder.id,
              productId: validProductId,
              warehouseId: order.warehouseId || null,
              sku: line.sku,
              productName: line.productName,
              quantity: line.quantity,
              unitPrice: line.unitPrice,
              taxAmount: (line as any).taxAmount ?? (line.unitPrice * line.quantity * 0.18),
              totalPrice: (line as any).totalPrice ?? (line.unitPrice * line.quantity * 1.18),
            },
          });
        }
      }

      const fullOrder = await tx.order.findUnique({
        where: { id: savedOrder.id },
        include: { items: true },
      });

      return this.mapToDomain(fullOrder!);
    });
  }

  public async nextOrderNumber(): Promise<string> {
    const count = await db.order.count({
      where: { workspaceId: this.defaultWorkspaceId },
    });
    return `ORD-${1000 + count + 1}`;
  }
}
