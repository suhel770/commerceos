/**
 * CommerceOS Inventory Engine v1 - Domain Event Bus
 * Publishes inventory events for Storefront Sync, Reporting, AI, and Finance.
 */

export interface AtsChangedEvent {
  eventId: string;
  eventType: "inventory.ats.changed";
  timestamp: string;
  sku: string;
  warehouseId?: string;
  oldAts: number;
  newAts: number;
}

export interface LowStockAlertEvent {
  eventId: string;
  eventType: "inventory.low_stock";
  timestamp: string;
  sku: string;
  currentAts: number;
  reorderPoint: number;
}

export type InventoryDomainEvent = AtsChangedEvent | LowStockAlertEvent;

type InventoryEventListener = (event: InventoryDomainEvent) => void;

const listeners: InventoryEventListener[] = [];

export function subscribeToInventoryEvents(listener: InventoryEventListener): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function publishAtsChanged(sku: string, oldAts: number, newAts: number, warehouseId?: string): AtsChangedEvent {
  const event: AtsChangedEvent = {
    eventId: `evt-inv-${crypto.randomUUID().slice(0, 8)}`,
    eventType: "inventory.ats.changed",
    timestamp: new Date().toISOString(),
    sku,
    warehouseId,
    oldAts,
    newAts,
  };

  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch {
      // isolated error handling
    }
  });

  return event;
}
