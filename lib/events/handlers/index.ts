/**
 * CommerceOS Phase 5 — Outbox Event Handler Registry
 */
import type { OutboxEventHandler } from "../types";
import { InventoryEventHandler } from "./inventory.handler";
import { StorageEventHandler } from "./storage.handler";
import { PurchaseEventHandler } from "./purchase.handler";
import { ConsumableEventHandler } from "./consumable.handler";
import { AllocationEventHandler } from "./allocation.handler";

const handlers: OutboxEventHandler[] = [
  new InventoryEventHandler(),
  new StorageEventHandler(),
  new PurchaseEventHandler(),
  new ConsumableEventHandler(),
  new AllocationEventHandler(),
];

export function getOutboxHandler(eventType: string): OutboxEventHandler | undefined {
  return handlers.find((h) => h.handles(eventType));
}
