/**
 * CommerceOS V4 — Storage Operation Events
 */

import type { BaseStorageDomainEvent } from "../domain/events";
import type { StorageOperation } from "./types";
import type { ActivityEventItem } from "@/components/storage/StorageRecentActivity";

export type StorageOperationDomainEventType =
  | "OperationCreated"
  | "OperationStarted"
  | "OperationCompleted"
  | "OperationFailed"
  | "ActivityCreated";

export type OperationCreatedEvent = BaseStorageDomainEvent<
  "OperationCreated",
  {
    operation: StorageOperation;
  }
>;

export type OperationStartedEvent = BaseStorageDomainEvent<
  "OperationStarted",
  {
    operationId: string;
    startedAt: string;
  }
>;

export type OperationCompletedEvent = BaseStorageDomainEvent<
  "OperationCompleted",
  {
    operationId: string;
    completedAt: string;
  }
>;

export type OperationFailedEvent = BaseStorageDomainEvent<
  "OperationFailed",
  {
    operationId: string;
    reason: string;
    failedAt: string;
  }
>;

export type ActivityCreatedEvent = BaseStorageDomainEvent<
  "ActivityCreated",
  {
    activity: ActivityEventItem;
  }
>;

export type StorageOperationEvent =
  | OperationCreatedEvent
  | OperationStartedEvent
  | OperationCompletedEvent
  | OperationFailedEvent
  | ActivityCreatedEvent;
