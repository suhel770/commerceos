/**
 * CommerceOS V4 — Storage Location Domain Service
 * High-level orchestration for locations, RBAC, domain events, & audit trail
 */

import { DEFAULT_CAPABILITIES_BY_TYPE, type StorageCapability } from "../domain/capabilities";
import type { StorageDomainEvent, StorageDomainEventType } from "../domain/events";
import { StorageLocationEntity } from "../domain/location.entity";
import type { SecurityContext } from "../domain/types";
import type { IStorageLocationRepository, StorageLocationFilter } from "../repository/storage-location.repository.interface";
import { createStorageLocationSchema, updateStorageLocationSchema } from "../validation/location.schema";

export interface CreateStorageLocationInput {
  name: string;
  code: string;
  type: StorageLocationEntity["type"];
  parentLocationId?: string;
  address?: StorageLocationEntity["address"];
  marketplace?: StorageLocationEntity["marketplace"];
  isDefault?: boolean;
  capabilities?: StorageCapability[];
  metadata?: Record<string, unknown>;
  securityContext: SecurityContext;
}

export interface UpdateStorageLocationInput {
  name?: string;
  code?: string;
  parentLocationId?: string | null;
  address?: StorageLocationEntity["address"];
  marketplace?: StorageLocationEntity["marketplace"];
  isDefault?: boolean;
  capabilities?: StorageCapability[];
  metadata?: Record<string, unknown>;
}

export class StorageLocationService {
  private repository: IStorageLocationRepository;
  private eventHandlers: ((event: StorageDomainEvent) => void)[] = [];

  constructor(repository: IStorageLocationRepository) {
    this.repository = repository;
  }

  /**
   * Subscribe to Storage Domain Events
   */
  public onDomainEvent(handler: (event: StorageDomainEvent) => void): () => void {
    this.eventHandlers.push(handler);
    return () => {
      this.eventHandlers = this.eventHandlers.filter((h) => h !== handler);
    };
  }

  private publishEvent(event: StorageDomainEvent): void {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (err) {
        console.error(`[StorageLocationService] Event handler error for ${event.eventName}:`, err);
      }
    });
  }

  private createEvent<TName extends StorageDomainEventType, TPayload>(
    eventName: TName,
    aggregateId: string,
    securityContext: SecurityContext,
    payload: TPayload
  ): StorageDomainEvent {
    return {
      eventId: `evt-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      eventName,
      aggregateId,
      securityContext,
      payload,
      timestamp: new Date().toISOString(),
    } as StorageDomainEvent;
  }

  /**
   * Create a new Storage Location
   */
  public async createLocation(input: CreateStorageLocationInput): Promise<StorageLocationEntity> {
    const validated = createStorageLocationSchema.parse(input);
    const security = validated.securityContext as SecurityContext;

    // Code uniqueness check within tenant
    const existingCode = await this.repository.findByCode(validated.code, security);
    if (existingCode) {
      throw new Error(`[StorageLocationService] Storage location code '${validated.code}' already exists.`);
    }

    // Parent hierarchy validation
    if (validated.parentLocationId) {
      const parent = await this.repository.findById(validated.parentLocationId, security);
      if (!parent) {
        throw new Error(`[StorageLocationService] Parent location '${validated.parentLocationId}' not found.`);
      }
    }

    // Default flag handling
    if (validated.isDefault) {
      await this.repository.clearDefaultFlag(security);
    }

    const id = `loc-${validated.type.slice(0, 3)}-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const capabilities: StorageCapability[] =
      validated.capabilities && validated.capabilities.length > 0
        ? (validated.capabilities.filter(Boolean) as StorageCapability[])
        : [...DEFAULT_CAPABILITIES_BY_TYPE[validated.type]];

    const entity = new StorageLocationEntity({
      id,
      name: validated.name,
      code: validated.code,
      type: validated.type,
      lifecycleState: "active",
      parentLocationId: validated.parentLocationId,
      address: validated.address,
      marketplace: validated.marketplace,
      isDefault: validated.isDefault ?? false,
      isArchived: false,
      capabilities,
      tags: validated.tags ?? [],
      metadata: validated.metadata ?? {},
      securityContext: security,
      createdAt: now,
      updatedAt: now,
    });

    const saved = await this.repository.save(entity);

    this.publishEvent(
      this.createEvent("LocationCreated", saved.id, security, {
        locationId: saved.id,
        name: saved.name,
        code: saved.code,
        type: saved.type,
        lifecycleState: saved.lifecycleState,
        capabilities: saved.capabilities,
      })
    );

    return saved;
  }

  /**
   * Get location by ID
   */
  public async getLocationById(id: string, security: SecurityContext): Promise<StorageLocationEntity | null> {
    return this.repository.findById(id, security);
  }

  /**
   * List locations with filters
   */
  public async listLocations(security: SecurityContext, filter?: StorageLocationFilter): Promise<StorageLocationEntity[]> {
    return this.repository.list(security, filter);
  }

  /**
   * Update location metadata or configuration
   */
  public async updateLocation(
    id: string,
    input: UpdateStorageLocationInput,
    security: SecurityContext
  ): Promise<StorageLocationEntity> {
    const validated = updateStorageLocationSchema.parse(input);
    const location = await this.repository.findById(id, security);

    if (!location) {
      throw new Error(`[StorageLocationService] Location '${id}' not found.`);
    }

    if (validated.code && validated.code.toLowerCase() !== location.code.toLowerCase()) {
      const existing = await this.repository.findByCode(validated.code, security);
      if (existing && existing.id !== location.id) {
        throw new Error(`[StorageLocationService] Code '${validated.code}' is already used by another location.`);
      }
      location.code = validated.code;
    }

    if (validated.name) location.name = validated.name;
    if (validated.parentLocationId !== undefined) {
      if (validated.parentLocationId === location.id) {
        throw new Error(`[StorageLocationService] Cannot set location as its own parent.`);
      }
      location.parentLocationId = validated.parentLocationId ?? undefined;
    }
    if (validated.address) location.address = validated.address;
    if (validated.marketplace) location.marketplace = validated.marketplace;
    if (validated.metadata) location.metadata = { ...location.metadata, ...validated.metadata };
    if (validated.capabilities) location.setCapabilities(validated.capabilities as StorageCapability[]);

    if (validated.isDefault !== undefined) {
      if (validated.isDefault) {
        await this.repository.clearDefaultFlag(security);
        location.isDefault = true;
      } else {
        location.isDefault = false;
      }
    }

    location.updatedAt = new Date().toISOString();
    return this.repository.update(location);
  }

  /**
   * Archive location
   */
  public async archiveLocation(id: string, security: SecurityContext, reason?: string): Promise<boolean> {
    const location = await this.repository.findById(id, security);
    if (!location) return false;

    // Hierarchy check: ensure sub-locations are migrated or archived first
    const subLocations = await this.repository.findSubLocations(id, security);
    const activeSubs = subLocations.filter((s) => !s.isArchived);
    if (activeSubs.length > 0) {
      throw new Error(
        `[StorageLocationService] Cannot archive location '${location.name}'. It has ${activeSubs.length} active child locations.`
      );
    }

    location.archive();
    await this.repository.update(location);

    this.publishEvent(
      this.createEvent("LocationArchived", location.id, security, {
        locationId: location.id,
        reason,
      })
    );

    return true;
  }
}
