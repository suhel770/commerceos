/**
 * CommerceOS Inventory Engine v1 - Reservation Engine
 * Prevents overselling across Shopify, Amazon, Flipkart, and B2B channels.
 * Supports Soft Locks (15-min cart timers), Hard Locks (order confirmed), Release, and Fulfillment.
 */

export type ReservationMode = "soft" | "hard";

export interface StockReservation {
  reservationId: string;
  orderId: string;
  sku: string;
  warehouseId?: string;
  quantity: number;
  mode: ReservationMode;
  channel: string;
  createdAt: string;
  expiresAt?: string;
  status: "active" | "fulfilled" | "released" | "expired";
}

export function createStockReservation(params: {
  orderId: string;
  sku: string;
  quantity: number;
  mode: ReservationMode;
  channel?: string;
  warehouseId?: string;
  ttlMinutes?: number;
}): StockReservation {
  const now = new Date();
  const ttl = params.ttlMinutes ?? (params.mode === "soft" ? 15 : undefined);
  const expiresAt = ttl ? new Date(now.getTime() + ttl * 60 * 1000).toISOString() : undefined;

  return {
    reservationId: `res-${crypto.randomUUID().slice(0, 8)}`,
    orderId: params.orderId,
    sku: params.sku,
    warehouseId: params.warehouseId,
    quantity: Math.max(1, params.quantity),
    mode: params.mode,
    channel: params.channel ?? "web",
    createdAt: now.toISOString(),
    expiresAt,
    status: "active",
  };
}

export function releaseReservation(reservation: StockReservation): StockReservation {
  return {
    ...reservation,
    status: "released",
  };
}

export function fulfillReservation(reservation: StockReservation): StockReservation {
  return {
    ...reservation,
    status: "fulfilled",
  };
}
