/**
 * CommerceOS V4 — Storage Capability Resolver
 * Dynamically resolves operational capabilities for locations
 */

import { DEFAULT_CAPABILITIES_BY_TYPE, type StorageCapability } from "../domain/capabilities";
import type { StorageLocationEntity } from "../domain/location.entity";
import type { StorageLocationType } from "../domain/types";

export class StorageCapabilityResolver {
  /**
   * Resolves capabilities for a given location type and custom overrides
   */
  public resolveCapabilities(type: StorageLocationType, customCapabilities?: StorageCapability[]): StorageCapability[] {
    const defaults = DEFAULT_CAPABILITIES_BY_TYPE[type] || [];
    if (!customCapabilities || customCapabilities.length === 0) {
      return [...defaults];
    }
    return Array.from(new Set(customCapabilities));
  }

  /**
   * Evaluates active operational capabilities for a location entity
   */
  public evaluateOperationalCapabilities(location: StorageLocationEntity): StorageCapability[] {
    if (location.lifecycleState !== "active") {
      return [];
    }
    return location.capabilities;
  }
}

export const storageCapabilityResolver = new StorageCapabilityResolver();
