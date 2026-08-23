/**
 * CommerceOS V4 — Storage Validation Engine
 * Validates domain rules:
 * - Duplicate codes & names
 * - Reserved system keywords
 * - Circular parent-child references
 * - Inactive or archived parents
 * - Capability conflicts
 */

import { RESERVED_LOCATION_CODES } from "../domain/constants";
import type { StorageLocationEntity } from "../domain/location.entity";
import type { SecurityContext } from "../domain/types";
import type { IStorageLocationRepository } from "../repository/storage-location.repository.interface";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class StorageValidationEngine {
  /**
   * Asserts code is not a reserved system keyword
   */
  public validateReservedCode(code: string): void {
    const upper = code.trim().toUpperCase();
    if (RESERVED_LOCATION_CODES.includes(upper)) {
      throw new Error(`[StorageValidationEngine] Code '${code}' is a reserved system keyword.`);
    }
  }

  /**
   * Validates code and name uniqueness within a multi-tenant scope
   */
  public async validateUniqueness(
    code: string,
    name: string,
    excludeId: string | null,
    security: SecurityContext,
    repository: IStorageLocationRepository
  ): Promise<void> {
    this.validateReservedCode(code);

    const existingCode = await repository.findByCode(code, security);
    if (existingCode && existingCode.id !== excludeId) {
      throw new Error(`[StorageValidationEngine] Duplicate location code '${code}' already exists.`);
    }

    const allLocations = await repository.list(security);
    const existingName = allLocations.find(
      (loc) => loc.name.toLowerCase() === name.toLowerCase() && loc.id !== excludeId
    );
    if (existingName) {
      throw new Error(`[StorageValidationEngine] Duplicate location name '${name}' already exists.`);
    }
  }

  /**
   * Validates parent node status and prevents circular parent relationships
   */
  public async validateParentHierarchy(
    targetLocationId: string | null,
    proposedParentId: string | undefined,
    security: SecurityContext,
    repository: IStorageLocationRepository
  ): Promise<void> {
    if (!proposedParentId) return;

    if (targetLocationId && proposedParentId === targetLocationId) {
      throw new Error(`[StorageValidationEngine] Circular reference: location cannot be its own parent.`);
    }

    const parent = await repository.findById(proposedParentId, security);
    if (!parent) {
      throw new Error(`[StorageValidationEngine] Proposed parent location '${proposedParentId}' does not exist.`);
    }

    if (parent.lifecycleState === "archived") {
      throw new Error(`[StorageValidationEngine] Cannot assign an archived location '${parent.name}' as parent.`);
    }

    if (parent.lifecycleState === "inactive") {
      throw new Error(`[StorageValidationEngine] Cannot assign an inactive location '${parent.name}' as parent.`);
    }

    // Traverse upwards to detect circular references
    let currentParent: StorageLocationEntity | null = parent;
    const visited = new Set<string>();
    if (targetLocationId) visited.add(targetLocationId);

    while (currentParent) {
      if (visited.has(currentParent.id)) {
        throw new Error(
          `[StorageValidationEngine] Circular hierarchy detected: '${proposedParentId}' leads back to location.`
        );
      }
      visited.add(currentParent.id);
      if (!currentParent.parentLocationId) break;
      currentParent = await repository.findById(currentParent.parentLocationId, security);
    }
  }
}

export const storageValidationEngine = new StorageValidationEngine();
