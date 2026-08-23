/**
 * CommerceOS V4 — Storage Location Domain Entity
 * Encapsulates core location logic, lifecycle transitions, and capability evaluation
 */

import { DEFAULT_CAPABILITIES_BY_TYPE, type StorageCapability } from "./capabilities";
import { VALID_LIFECYCLE_TRANSITIONS } from "./constants";
import type {
  SecurityContext,
  StorageAddress,
  StorageComplexityMode,
  StorageLifecycleState,
  StorageLocationProperties,
  StorageLocationType,
  StorageMarketplaceConnection,
  SubLocationNode,
} from "./types";

export class StorageLocationEntity implements StorageLocationProperties {
  public readonly id: string;
  public name: string;
  public code: string;
  public readonly type: StorageLocationType;
  public lifecycleState: StorageLifecycleState;
  public storageComplexityMode: StorageComplexityMode;
  public subLocations: SubLocationNode[];
  public parentLocationId?: string;
  public address?: StorageAddress;
  public marketplace?: StorageMarketplaceConnection;
  public isDefault: boolean;
  public isArchived: boolean;
  public capabilities: StorageCapability[];
  public tags: string[];
  public metadata: Record<string, unknown>;
  public readonly securityContext: SecurityContext;
  public readonly locationScope: "internal" | "external_fulfillment";
  public readonly createdAt: string;
  public updatedAt: string;

  constructor(props: StorageLocationProperties & { capabilities?: StorageCapability[]; status?: any }) {
    this.id = props.id;
    this.name = props.name;
    this.code = props.code;
    this.type = props.type;
    this.locationScope = props.type === "amazon_fba" || props.type === "flipkart_fulfillment" || props.type === "3pl" || props.type === "transit"
      ? "external_fulfillment"
      : "internal";
    this.lifecycleState = props.lifecycleState || (props as any).status || "active";
    this.storageComplexityMode = props.storageComplexityMode ?? "simple";
    this.subLocations = props.subLocations ?? [];
    this.parentLocationId = props.parentLocationId;
    this.address = props.address;
    this.marketplace = props.marketplace;
    this.isDefault = props.isDefault;
    this.isArchived = props.isArchived || props.lifecycleState === "archived";
    this.capabilities = props.capabilities ?? [...DEFAULT_CAPABILITIES_BY_TYPE[props.type]];
    this.tags = props.tags ?? [];
    this.metadata = props.metadata ?? {};
    this.securityContext = props.securityContext;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;

    this.validateInvariants();
  }

  private validateInvariants(): void {
    if (!this.id || this.id.trim().length === 0) {
      throw new Error("[StorageLocationEntity] Storage location ID cannot be empty.");
    }
    if (!this.name || this.name.trim().length === 0) {
      throw new Error("[StorageLocationEntity] Storage location name cannot be empty.");
    }
    if (!this.code || this.code.trim().length === 0) {
      throw new Error("[StorageLocationEntity] Storage location code cannot be empty.");
    }
    if (!this.securityContext.tenantId || !this.securityContext.organizationId) {
      throw new Error("[StorageLocationEntity] SecurityContext (tenantId & organizationId) is required.");
    }
    if (this.parentLocationId && this.parentLocationId === this.id) {
      throw new Error("[StorageLocationEntity] Storage location cannot be its own parent.");
    }
  }

  /**
   * Evaluates if capability is operational on this node
   */
  public hasCapability(capability: StorageCapability): boolean {
    if (this.lifecycleState !== "active") {
      return false;
    }
    return this.capabilities.includes(capability);
  }

  /**
   * Transition lifecycle state
   */
  public transitionLifecycle(newState: StorageLifecycleState): void {
    const validTransitions = VALID_LIFECYCLE_TRANSITIONS[this.lifecycleState];
    if (!validTransitions.includes(newState)) {
      throw new Error(
        `[StorageLocationEntity] Invalid lifecycle transition from '${this.lifecycleState}' to '${newState}'.`
      );
    }
    this.lifecycleState = newState;
    if (newState === "archived") {
      this.isArchived = true;
    }
    this.updatedAt = new Date().toISOString();
  }

  public archive(): void {
    this.transitionLifecycle("archived");
  }

  public activate(): void {
    this.transitionLifecycle("active");
  }

  public setCapabilities(newCapabilities: StorageCapability[]): void {
    this.capabilities = Array.from(new Set(newCapabilities));
    this.updatedAt = new Date().toISOString();
  }

  public toJSON(): StorageLocationProperties & { capabilities: StorageCapability[] } {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      type: this.type,
      lifecycleState: this.lifecycleState,
      storageComplexityMode: this.storageComplexityMode,
      subLocations: [...this.subLocations],
      parentLocationId: this.parentLocationId,
      address: this.address,
      marketplace: this.marketplace,
      isDefault: this.isDefault,
      isArchived: this.isArchived,
      locationScope: this.locationScope,
      capabilities: [...this.capabilities],
      tags: [...this.tags],
      metadata: { ...this.metadata },
      securityContext: { ...this.securityContext },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
