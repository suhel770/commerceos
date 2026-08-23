/**
 * CommerceOS V4 — Storage Capability Service
 * Dynamic capability evaluation for location nodes
 */

import type { StorageCapability } from "../domain/capabilities";
import { StorageLocationEntity } from "../domain/location.entity";

export class StorageCapabilityService {
  /**
   * Evaluate whether a location supports a required operational capability
   */
  public canPerform(location: StorageLocationEntity, capability: StorageCapability): boolean {
    return location.hasCapability(capability);
  }

  /**
   * Asserts that a location possesses a required capability, throwing an error if absent
   */
  public assertCapability(location: StorageLocationEntity, capability: StorageCapability): void {
    if (!this.canPerform(location, capability)) {
      throw new Error(
        `[StorageCapabilityService] Location '${location.name}' (${location.code}) does not support required capability '${capability}'.`
      );
    }
  }

  /**
   * Filter a list of locations to only those supporting a given capability
   */
  public filterCapableLocations(
    locations: StorageLocationEntity[],
    capability: StorageCapability
  ): StorageLocationEntity[] {
    return locations.filter((loc) => this.canPerform(loc, capability));
  }
}

export const storageCapabilityService = new StorageCapabilityService();
