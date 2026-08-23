/**
 * CommerceOS V4 — Storage Domain Events (Phase 2 Extended)
 */

import type { StorageCapability } from "./capabilities";
import type { SecurityContext, StorageLocationType, StorageLifecycleState } from "./types";

export type StorageDomainEventType =
  | "LocationCreated"
  | "LocationUpdated"
  | "LocationActivated"
  | "LocationArchived"
  | "LocationCapabilityChanged"
  | "LocationParentChanged"
  | "LocationCodeGenerated"
  | "StockReceived"
  | "StockTransferred"
  | "StockAdjusted"
  | "MarketplaceSynced"
  | "CycleCountCompleted"
  | "DamageReported";

export interface BaseStorageDomainEvent<TName extends string, TPayload> {
  eventId: string;
  eventName: TName;
  aggregateId: string;
  securityContext: SecurityContext;
  payload: TPayload;
  timestamp: string; // ISO 8601
}

export type StorageLocationCreatedEvent = BaseStorageDomainEvent<
  "LocationCreated",
  {
    locationId: string;
    name: string;
    code: string;
    type: StorageLocationType;
    lifecycleState: StorageLifecycleState;
    capabilities: StorageCapability[];
  }
>;

export type StorageLocationUpdatedEvent = BaseStorageDomainEvent<
  "LocationUpdated",
  {
    locationId: string;
    changedFields: string[];
    actorId?: string;
  }
>;

export type StorageLocationActivatedEvent = BaseStorageDomainEvent<
  "LocationActivated",
  {
    locationId: string;
    previousState: StorageLifecycleState;
  }
>;

export type StorageLocationArchivedEvent = BaseStorageDomainEvent<
  "LocationArchived",
  {
    locationId: string;
    reason?: string;
  }
>;

export type StorageLocationCapabilityChangedEvent = BaseStorageDomainEvent<
  "LocationCapabilityChanged",
  {
    locationId: string;
    previousCapabilities: StorageCapability[];
    newCapabilities: StorageCapability[];
  }
>;

export type StorageLocationParentChangedEvent = BaseStorageDomainEvent<
  "LocationParentChanged",
  {
    locationId: string;
    oldParentId?: string;
    newParentId?: string;
  }
>;

export type StorageLocationCodeGeneratedEvent = BaseStorageDomainEvent<
  "LocationCodeGenerated",
  {
    locationId: string;
    generatedCode: string;
    patternUsed: string;
  }
>;

export type StorageDomainEvent =
  | StorageLocationCreatedEvent
  | StorageLocationUpdatedEvent
  | StorageLocationActivatedEvent
  | StorageLocationArchivedEvent
  | StorageLocationCapabilityChangedEvent
  | StorageLocationParentChangedEvent
  | StorageLocationCodeGeneratedEvent;
