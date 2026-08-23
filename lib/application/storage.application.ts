/**
 * CommerceOS V4 — Storage Application Layer
 * Central composition container wiring Prisma Repositories -> Storage Services -> API/UI
 */

import { PrismaStorageLocationRepository } from "../storage/repository/prisma-storage-location.repository";
import { PrismaStorageStockRepository, type CreateStorageReceiptInput, type StorageOperationLogInput } from "../storage/repository/prisma-storage-stock.repository";
import { StorageLocationService } from "../storage/services/storage-location.service";
import type { SecurityContext, StorageLocationType, StorageAddress, StorageMarketplaceConnection } from "../storage/domain/types";
import type { StorageCapability } from "../storage/domain/capabilities";
import type { StorageLocationEntity } from "../storage/domain/location.entity";

export class StorageApplication {
  public readonly locationRepo: PrismaStorageLocationRepository;
  public readonly stockRepo: PrismaStorageStockRepository;
  public readonly locationService: StorageLocationService;

  constructor() {
    this.locationRepo = new PrismaStorageLocationRepository();
    this.stockRepo = new PrismaStorageStockRepository();
    this.locationService = new StorageLocationService(this.locationRepo);
  }

  /**
   * List Storage Locations for a Workspace
   */
  public async listLocations(
    security: SecurityContext,
    filter?: { type?: StorageLocationType; parentLocationId?: string; isArchived?: boolean; search?: string },
  ): Promise<StorageLocationEntity[]> {
    return this.locationService.listLocations(security, filter);
  }

  /**
   * Get Storage Location by ID
   */
  public async getLocationById(
    id: string,
    security: SecurityContext,
  ): Promise<StorageLocationEntity | null> {
    return this.locationService.getLocationById(id, security);
  }

  /**
   * Create a new Storage Location
   */
  public async createLocation(input: {
    name: string;
    code: string;
    type: StorageLocationType;
    parentLocationId?: string;
    address?: StorageAddress;
    marketplace?: StorageMarketplaceConnection;
    isDefault?: boolean;
    capabilities?: StorageCapability[];
    metadata?: Record<string, unknown>;
    securityContext: SecurityContext;
  }): Promise<StorageLocationEntity> {
    return this.locationService.createLocation(input);
  }

  /**
   * Update an existing Storage Location
   */
  public async updateLocation(
    id: string,
    input: {
      name?: string;
      code?: string;
      parentLocationId?: string | null;
      address?: StorageAddress;
      marketplace?: StorageMarketplaceConnection;
      isDefault?: boolean;
      capabilities?: StorageCapability[];
      metadata?: Record<string, unknown>;
    },
    security: SecurityContext,
  ): Promise<StorageLocationEntity> {
    return this.locationService.updateLocation(id, input, security);
  }

  /**
   * Archive a Storage Location
   */
  public async archiveLocation(id: string, security: SecurityContext): Promise<boolean> {
    return this.locationService.archiveLocation(id, security);
  }

  /**
   * List Physical Stock Balances
   */
  public async listStock(security: SecurityContext, storageLocationId?: string) {
    return this.stockRepo.listStock(security, storageLocationId);
  }

  /**
   * Create Goods Received Note (GRN) from Purchase Bill
   */
  public async createReceipt(security: SecurityContext, input: CreateStorageReceiptInput) {
    return this.stockRepo.createReceipt(security, input);
  }

  /**
   * Execute physical stock movement operation (Putaway, Transfer, Adjustment)
   */
  public async executeStockOperation(security: SecurityContext, input: StorageOperationLogInput) {
    return this.stockRepo.executeStockOperation(security, input);
  }

  /**
   * Reverse / Correct an existing storage receipt without deleting history
   */
  public async reverseReceipt(
    security: SecurityContext,
    input: import("../storage/repository/prisma-storage-stock.repository").ReverseStorageReceiptInput,
  ) {
    return this.stockRepo.reverseReceipt(security, input);
  }
}

export const storageApplication = new StorageApplication();
