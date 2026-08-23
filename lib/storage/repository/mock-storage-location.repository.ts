/**
 * CommerceOS V4 — In-Memory Storage Location Repository
 * Mock Repository Implementation for API-First Testing & Pre-DB Execution
 */

import { StorageLocationEntity } from "../domain/location.entity";
import type { SecurityContext } from "../domain/types";
import type { IStorageLocationRepository, StorageLocationFilter } from "./storage-location.repository.interface";

export class MockStorageLocationRepository implements IStorageLocationRepository {
  private locations: Map<string, StorageLocationEntity> = new Map();

  constructor(initialSeed: StorageLocationEntity[] = []) {
    initialSeed.forEach((loc) => {
      this.locations.set(loc.id, loc);
    });
  }

  private isSameTenant(loc: StorageLocationEntity, security: SecurityContext): boolean {
    return (
      loc.securityContext.tenantId === security.tenantId &&
      loc.securityContext.organizationId === security.organizationId
    );
  }

  public async findById(id: string, security: SecurityContext): Promise<StorageLocationEntity | null> {
    const loc = this.locations.get(id);
    if (!loc || !this.isSameTenant(loc, security)) {
      return null;
    }
    return loc;
  }

  public async findByCode(code: string, security: SecurityContext): Promise<StorageLocationEntity | null> {
    for (const loc of this.locations.values()) {
      if (loc.code.toLowerCase() === code.toLowerCase() && this.isSameTenant(loc, security)) {
        return loc;
      }
    }
    return null;
  }

  public async list(security: SecurityContext, filter?: StorageLocationFilter): Promise<StorageLocationEntity[]> {
    let result = Array.from(this.locations.values()).filter((loc) => this.isSameTenant(loc, security));

    if (filter) {
      if (filter.type) {
        result = result.filter((loc) => loc.type === filter.type);
      }
      if (filter.parentLocationId !== undefined) {
        result = result.filter((loc) => loc.parentLocationId === filter.parentLocationId);
      }
      if (filter.isArchived !== undefined) {
        result = result.filter((loc) => loc.isArchived === filter.isArchived);
      }
      if (filter.isDefault !== undefined) {
        result = result.filter((loc) => loc.isDefault === filter.isDefault);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        result = result.filter(
          (loc) => loc.name.toLowerCase().includes(q) || loc.code.toLowerCase().includes(q)
        );
      }
    }

    return result;
  }

  public async save(location: StorageLocationEntity): Promise<StorageLocationEntity> {
    this.locations.set(location.id, location);
    return location;
  }

  public async update(location: StorageLocationEntity): Promise<StorageLocationEntity> {
    this.locations.set(location.id, location);
    return location;
  }

  public async archive(id: string, security: SecurityContext): Promise<boolean> {
    const loc = await this.findById(id, security);
    if (!loc) return false;
    loc.archive();
    this.locations.set(loc.id, loc);
    return true;
  }

  public async findSubLocations(parentLocationId: string, security: SecurityContext): Promise<StorageLocationEntity[]> {
    return this.list(security, { parentLocationId });
  }

  public async clearDefaultFlag(security: SecurityContext): Promise<void> {
    for (const loc of this.locations.values()) {
      if (this.isSameTenant(loc, security) && loc.isDefault) {
        loc.isDefault = false;
        loc.updatedAt = new Date().toISOString();
        this.locations.set(loc.id, loc);
      }
    }
  }
}
