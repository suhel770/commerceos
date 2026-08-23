/**
 * CommerceOS Procurement Engine v4 - Domain Event Bus
 * Publishes procurement domain events for downstream modules (Inventory, Warehouse, Finance, GST).
 * Loose coupling only — Procurement NEVER mutates downstream engines directly.
 */

import type { BusinessIntent, PurchaseBill } from "../purchase/types";

export interface ProcurementBillRecordedEvent {
  eventId: string;
  eventType: "procurement.bill.recorded";
  timestamp: string;
  billId: string;
  vendorId: string;
  lines: Array<{
    lineId: string;
    description: string;
    sku?: string;
    quantity: number;
    unitPrice: number;
    intent: BusinessIntent;
    freightMode?: "expense" | "landed_cost";
  }>;
  financials: {
    taxableAmount: number;
    gstAmount: number;
    grandTotal: number;
  };
}

export type ProcurementDomainEvent = ProcurementBillRecordedEvent;

type EventListener = (event: ProcurementDomainEvent) => void;

const listeners: EventListener[] = [];

export function subscribeToProcurementEvents(listener: EventListener): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function publishProcurementBillRecorded(bill: PurchaseBill): ProcurementBillRecordedEvent {
  const event: ProcurementBillRecordedEvent = {
    eventId: `evt-${crypto.randomUUID().slice(0, 8)}`,
    eventType: "procurement.bill.recorded",
    timestamp: new Date().toISOString(),
    billId: bill.id,
    vendorId: bill.vendorId,
    lines: bill.lines.map((l) => ({
      lineId: l.id,
      description: l.description,
      sku: l.sku,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      intent: l.intent ?? "sellable",
      freightMode: l.freightMode,
    })),
    financials: {
      taxableAmount: bill.subtotal - bill.discountAmount,
      gstAmount: bill.taxAmount,
      grandTotal: bill.totalAmount,
    },
  };

  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch {
      // Ignore downstream listener errors to guarantee procurement isolation
    }
  });

  return event;
}
