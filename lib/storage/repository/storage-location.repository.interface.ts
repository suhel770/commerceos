/**
 * CommerceOS V4 — Storage Location Repository Interface
 * Typed contract for multi-tenant location storage adapters
 */

import type { StorageLocationEntity } from "../domain/location.entity";
import type { SecurityContext, StorageLocationType } from "../domain/types";

export interface StorageLocationFilter {
  type?: StorageLocationType;
  parentLocationId?: string;
  isArchived?: boolean;
  isDefault?: boolean;
  search?: string;
}

export interface IStorageLocationRepository {
  findById(id: string, security: SecurityContext): Promise<StorageLocationEntity | null>;
  findByCode(code: string, security: SecurityContext): Promise<StorageLocationEntity | null>;
  list(security: SecurityContext, filter?: StorageLocationFilter): Promise<StorageLocationEntity[]>;
  save(location: StorageLocationEntity): Promise<StorageLocationEntity>;
  update(location: StorageLocationEntity): Promise<StorageLocationEntity>;
  archive(id: string, security: SecurityContext): Promise<boolean>;
  findSubLocations(parentLocationId: string, security: SecurityContext): Promise<StorageLocationEntity[]>;
  clearDefaultFlag(security: SecurityContext): Promise<void>;
}
