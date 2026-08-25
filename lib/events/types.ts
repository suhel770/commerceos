/**
 * CommerceOS Phase 5 — Canonical Domain Event Types
 * Every event type that can be emitted to the Outbox.
 */

// ---------------------------------------------------------------------------
// Event type constants
// ---------------------------------------------------------------------------

export const INVENTORY_ADJUSTED = "INVENTORY_ADJUSTED" as const;
export const INVENTORY_RESERVED = "INVENTORY_RESERVED" as const;
export const INVENTORY_RELEASED = "INVENTORY_RELEASED" as const;
export const INVENTORY_TRANSFERRED = "INVENTORY_TRANSFERRED" as const;
export const INVENTORY_DAMAGED = "INVENTORY_DAMAGED" as const;

export const STORAGE_RECEIVING_COMPLETED = "STORAGE_RECEIVING_COMPLETED" as const;
export const STORAGE_RECEIVING_REVERSED = "STORAGE_RECEIVING_REVERSED" as const;
export const STORAGE_TRANSFER_COMPLETED = "STORAGE_TRANSFER_COMPLETED" as const;
export const STORAGE_BIN_ADJUSTED = "STORAGE_BIN_ADJUSTED" as const;

export const PURCHASE_BILL_CREATED = "PURCHASE_BILL_CREATED" as const;
export const PURCHASE_BILL_TRANSITIONED = "PURCHASE_BILL_TRANSITIONED" as const;
export const PURCHASE_RECEIVING_COMPLETED = "PURCHASE_RECEIVING_COMPLETED" as const;
export const PURCHASE_REVERSED = "PURCHASE_REVERSED" as const;

export const CONSUMABLE_CONSUMED = "CONSUMABLE_CONSUMED" as const;
export const CONSUMABLE_ADJUSTED = "CONSUMABLE_ADJUSTED" as const;
export const CONSUMABLE_REVERSED = "CONSUMABLE_REVERSED" as const;

export const MARKETPLACE_ALLOCATION_CHANGED = "MARKETPLACE_ALLOCATION_CHANGED" as const;

export type CommerceEventType =
  | typeof INVENTORY_ADJUSTED
  | typeof INVENTORY_RESERVED
  | typeof INVENTORY_RELEASED
  | typeof INVENTORY_TRANSFERRED
  | typeof INVENTORY_DAMAGED
  | typeof STORAGE_RECEIVING_COMPLETED
  | typeof STORAGE_RECEIVING_REVERSED
  | typeof STORAGE_TRANSFER_COMPLETED
  | typeof STORAGE_BIN_ADJUSTED
  | typeof PURCHASE_BILL_CREATED
  | typeof PURCHASE_BILL_TRANSITIONED
  | typeof PURCHASE_RECEIVING_COMPLETED
  | typeof PURCHASE_REVERSED
  | typeof CONSUMABLE_CONSUMED
  | typeof CONSUMABLE_ADJUSTED
  | typeof CONSUMABLE_REVERSED
  | typeof MARKETPLACE_ALLOCATION_CHANGED;

// ---------------------------------------------------------------------------
// Aggregate types (the entity the event is about)
// ---------------------------------------------------------------------------

export type CommerceAggregateType =
  | "Inventory"
  | "StorageReceipt"
  | "StorageStock"
  | "PurchaseBill"
  | "ConsumableLedger"
  | "ChannelAllocation";

// ---------------------------------------------------------------------------
// Outbox input — what callers pass inside a transaction
// ---------------------------------------------------------------------------

export interface OutboxEventInput {
  organizationId: string;
  workspaceId: string;
  correlationId?: string;
  eventType: CommerceEventType;
  aggregateType: CommerceAggregateType;
  aggregateId: string;
  /** Safe payload — MUST NOT contain passwords, tokens, secrets */
  payload: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Outbox record — what is stored in the DB
// ---------------------------------------------------------------------------

export type OutboxEventStatus = "PENDING" | "PROCESSING" | "PROCESSED" | "FAILED";

export interface OutboxEventRecord {
  id: string;
  organizationId: string;
  workspaceId: string;
  correlationId?: string | null;
  eventType: string;
  aggregateType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  status: OutboxEventStatus;
  attempts: number;
  maxAttempts: number;
  availableAt: Date;
  processedAt?: Date | null;
  failedAt?: Date | null;
  lastError?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Handler interface
// ---------------------------------------------------------------------------

export interface OutboxEventHandler {
  /** Return true if this handler claims/handles the given eventType */
  handles(eventType: string): boolean;
  handle(event: OutboxEventRecord): Promise<void>;
}
