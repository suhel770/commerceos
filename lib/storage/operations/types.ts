/**
 * CommerceOS V4 — Storage Operation Engine Types
 */

import type { SecurityContext } from "../domain/types";

export type StorageOperationType =
  | "receive_stock"
  | "transfer_stock"
  | "adjust_stock"
  | "archive_location"
  | "activate_location"
  | "deactivate_location";

export type StorageOperationStatus =
  | "draft"
  | "pending"
  | "processing"
  | "completed"
  | "cancelled"
  | "failed";

export interface OperationProductLine {
  productId: string;
  sku: string;
  quantity: number;
}

export interface ReceiveOperationPayload {
  destinationLocationId: string;
  sourceReference: string; // e.g. PO Number
  lines: OperationProductLine[];
}

export interface TransferOperationPayload {
  sourceLocationId: string;
  destinationLocationId: string;
  lines: OperationProductLine[];
}

export interface AdjustOperationPayload {
  locationId: string;
  reason: "damage" | "lost" | "found" | "correction" | "expiry" | "manual";
  lines: OperationProductLine[]; // positive for found/correction up, negative for damage/lost
  notes?: string;
}

export interface LocationStateOperationPayload {
  locationId: string;
  reason?: string;
}

export type StorageOperationPayload =
  | ReceiveOperationPayload
  | TransferOperationPayload
  | AdjustOperationPayload
  | LocationStateOperationPayload;

export interface StorageOperation {
  id: string;
  type: StorageOperationType;
  status: StorageOperationStatus;
  payload: StorageOperationPayload;
  securityContext: SecurityContext;
  createdBy: string;
  executedBy?: string;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
  completedAt?: string;
  failureReason?: string;
}
