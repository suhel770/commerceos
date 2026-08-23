/**
 * CommerceOS V4 — Universal Storage Location Engine
 * Primary Facade Engine managing location lifecycle, registrations, validations,
 * search, hierarchy tree resolution, and audit trail logging.
 */

import { storageCapabilityResolver } from "./capability.resolver";
import { storageHierarchyResolver } from "./hierarchy.resolver";
import { storageLabelGeneratorEngine } from "./label-generator.engine";
import { storageLifecycleEngine } from "./lifecycle.engine";
import { storageSearchEngine } from "./search.engine";
import { storageValidationEngine } from "./validation.engine";
import { storageAuditEngine } from "./audit.engine";

import { DEFAULT_CAPABILITIES_BY_TYPE, type StorageCapability } from "../domain/capabilities";
import type { StorageDomainEvent, StorageDomainEventType } from "../domain/events";
import { StorageLocationEntity } from "../domain/location.entity";
import type {
  SecurityContext,
  StorageHierarchyNode,
  StorageLifecycleState,
  StorageLocationProperties,
  StorageLocationType,
  StorageSearchQuery,
} from "../domain/types";
import type { IStorageLocationRepository } from "../repository/storage-location.repository.interface";
import { createStorageLocationSchema, updateStorageLocationSchema } from "../validation/location.schema";

export interface RegisterLocationInput {
  name: string;
  code?: string; // Optional: auto-generated if omitted
  type: StorageLocationType;
  parentLocationId?: string;
  address?: StorageLocationEntity["address"];
  marketplace?: StorageLocationEntity["marketplace"];
  isDefault?: boolean;
  capabilities?: StorageCapability[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  securityContext: SecurityContext;
}

export interface UpdateLocationInput {
  name?: string;
  code?: string;
  parentLocationId?: string | null;
  address?: StorageLocationEntity["address"];
  marketplace?: StorageLocationEntity["marketplace"];
  isDefault?: boolean;
  capabilities?: StorageCapability[];
  tags?: string[];
  metadata?: Record<string, unknown>;
  reason?: string;
}

export class StorageLocationEngine {
  private repository: IStorageLocationRepository;
  private eventListeners: ((event: StorageDomainEvent) => void)[] = [];

  constructor(repository: IStorageLocationRepository) {
    this.repository = repository;
  }

  public onEvent(listener: (event: StorageDomainEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  private publishEvent(event: StorageDomainEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error(`[StorageLocationEngine] Domain Event Listener Error (${event.eventName}):`, err);
      }
    });
  }

  private createDomainEvent<TName extends StorageDomainEventType, TPayload>(
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
   * Register a new Storage Location node
   */
  public async registerLocation(input: RegisterLocationInput): Promise<StorageLocationEntity> {
    const security = input.securityContext;

    // Auto-generate code if omitted
    const count = (await this.repository.list(security)).length + 1;
    const finalCode = input.code
      ? input.code.trim().toUpperCase()
      : storageLabelGeneratorEngine.generateCode(input.type, input.marketplace?.fcReferenceCode, count);

    const validatedInput = createStorageLocationSchema.parse({
      ...input,
      code: finalCode,
    });

    // Uniqueness & reserved code check
    await storageValidationEngine.validateUniqueness(finalCode, validatedInput.name, null, security, this.repository);

    // Parent hierarchy validation
    await storageValidationEngine.validateParentHierarchy(null, validatedInput.parentLocationId, security, this.repository);

    // Clear default flag if setting new default
    if (validatedInput.isDefault) {
      await this.repository.clearDefaultFlag(security);
    }

    const id = `loc-${validatedInput.type.slice(0, 3)}-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const resolvedCapabilities = storageCapabilityResolver.resolveCapabilities(
      validatedInput.type,
      validatedInput.capabilities as StorageCapability[] | undefined
    );

    const entity = new StorageLocationEntity({
      id,
      name: validatedInput.name,
      code: finalCode,
      type: validatedInput.type,
      lifecycleState: "draft", // Starts in Draft
      parentLocationId: validatedInput.parentLocationId,
      address: validatedInput.address,
      marketplace: validatedInput.marketplace,
      isDefault: validatedInput.isDefault ?? false,
      isArchived: false,
      capabilities: resolvedCapabilities,
      tags: validatedInput.tags ?? [],
      metadata: validatedInput.metadata ?? {},
      securityContext: security,
      createdAt: now,
      updatedAt: now,
    });

    const saved = await this.repository.save(entity);

    // Audit log
    storageAuditEngine.logChange({
      locationId: saved.id,
      action: "RegisterLocation",
      fieldChanged: "entity",
      oldValue: null,
      newValue: saved.toJSON(),
      security,
    });

    // Publish event
    this.publishEvent(
      this.createDomainEvent("LocationCreated", saved.id, security, {
        locationId: saved.id,
        name: saved.name,
        code: saved.code,
        type: saved.type,
        lifecycleState: saved.lifecycleState,
        capabilities: saved.capabilities,
      })
    );

    if (!input.code) {
      this.publishEvent(
        this.createDomainEvent("LocationCodeGenerated", saved.id, security, {
          locationId: saved.id,
          generatedCode: saved.code,
          patternUsed: `AUTO_LABEL_${saved.type}`,
        })
      );
    }

    return saved;
  }

  /**
   * Transition location lifecycle state
   */
  public async transitionLifecycle(
    locationId: string,
    targetState: StorageLifecycleState,
    security: SecurityContext,
    reason?: string
  ): Promise<StorageLocationEntity> {
    const location = await this.repository.findById(locationId, security);
    if (!location) {
      throw new Error(`[StorageLocationEngine] Location '${locationId}' not found.`);
    }

    const oldState = location.lifecycleState;
    storageLifecycleEngine.transition(location, targetState);
    const updated = await this.repository.update(location);

    storageAuditEngine.logChange({
      locationId: updated.id,
      action: "TransitionLifecycle",
      fieldChanged: "lifecycleState",
      oldValue: oldState,
      newValue: targetState,
      reason,
      security,
    });

    if (targetState === "active") {
      this.publishEvent(
        this.createDomainEvent("LocationActivated", updated.id, security, {
          locationId: updated.id,
          previousState: oldState,
        })
      );
    } else if (targetState === "archived") {
      this.publishEvent(
        this.createDomainEvent("LocationArchived", updated.id, security, {
          locationId: updated.id,
          reason,
        })
      );
    }

    return updated;
  }

  /**
   * Update location parameters
   */
  public async updateLocation(
    locationId: string,
    input: UpdateLocationInput,
    security: SecurityContext
  ): Promise<StorageLocationEntity> {
    const validated = updateStorageLocationSchema.parse(input);
    const location = await this.repository.findById(locationId, security);
    if (!location) {
      throw new Error(`[StorageLocationEngine] Location '${locationId}' not found.`);
    }

    const oldState = location.toJSON();

    if (validated.code && validated.code.toUpperCase() !== location.code.toUpperCase()) {
      await storageValidationEngine.validateUniqueness(validated.code, validated.name || location.name, location.id, security, this.repository);
      location.code = validated.code.toUpperCase();
    }

    if (validated.parentLocationId !== undefined) {
      await storageValidationEngine.validateParentHierarchy(
        location.id,
        validated.parentLocationId ?? undefined,
        security,
        this.repository
      );

      const oldParent = location.parentLocationId;
      location.parentLocationId = validated.parentLocationId ?? undefined;

      this.publishEvent(
        this.createDomainEvent("LocationParentChanged", location.id, security, {
          locationId: location.id,
          oldParentId: oldParent,
          newParentId: location.parentLocationId,
        })
      );
    }

    if (validated.name) location.name = validated.name;
    if (validated.address) location.address = validated.address;
    if (validated.marketplace) location.marketplace = validated.marketplace;
    if (validated.metadata) location.metadata = { ...location.metadata, ...validated.metadata };
    if (validated.tags) location.tags = Array.from(new Set(validated.tags));

    if (validated.capabilities) {
      const oldCaps = location.capabilities;
      location.setCapabilities(validated.capabilities as StorageCapability[]);

      this.publishEvent(
        this.createDomainEvent("LocationCapabilityChanged", location.id, security, {
          locationId: location.id,
          previousCapabilities: oldCaps,
          newCapabilities: location.capabilities,
        })
      );
    }

    if (validated.isDefault) {
      await this.repository.clearDefaultFlag(security);
      location.isDefault = true;
    }

    location.updatedAt = new Date().toISOString();
    const updated = await this.repository.update(location);

    storageAuditEngine.logChange({
      locationId: updated.id,
      action: "UpdateLocation",
      fieldChanged: "metadata",
      oldValue: oldState,
      newValue: updated.toJSON(),
      reason: input.reason,
      security,
    });

    this.publishEvent(
      this.createDomainEvent("LocationUpdated", updated.id, security, {
        locationId: updated.id,
        changedFields: Object.keys(validated),
        actorId: security.actorId,
      })
    );

    return updated;
  }

  /**
   * Multi-faceted search and filter
   */
  public async searchLocations(query: StorageSearchQuery, security: SecurityContext): Promise<StorageLocationEntity[]> {
    const all = await this.repository.list(security);
    return storageSearchEngine.search(all, query);
  }

  /**
   * Hierarchy tree topology builder
   */
  public async getHierarchyTree(security: SecurityContext): Promise<StorageHierarchyNode[]> {
    return storageHierarchyResolver.buildHierarchyTree(security, this.repository);
  }

  public async getLocationById(id: string, security: SecurityContext): Promise<StorageLocationEntity | null> {
    return this.repository.findById(id, security);
  }

  public async getLocation(id: string, security?: SecurityContext): Promise<StorageLocationEntity | null> {
    const sec = security ?? {
      tenantId: "tenant-default",
      organizationId: "org-commerceos",
      workspaceId: "ws-default",
    };
    return this.getLocationById(id, sec);
  }

  public async createLocation(input: RegisterLocationInput, security?: SecurityContext): Promise<StorageLocationEntity> {
    const payload = {
      ...input,
      securityContext: input.securityContext || security || {
        tenantId: "tenant-default",
        organizationId: "org-commerceos",
        workspaceId: "ws-default",
      },
    };
    return this.registerLocation(payload);
  }

  public async activateLocation(id: string, security: SecurityContext): Promise<StorageLocationEntity> {
    return this.transitionLifecycle(id, "active", security);
  }
}
