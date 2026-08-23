/**
 * CommerceOS V4 — Prisma Storage Location Repository
 * PostgreSQL-backed implementation of IStorageLocationRepository
 * Multi-tenant workspace isolation via organizationId + workspaceId
 */

import { db } from "@/lib/db";
import { StorageLocationEntity } from "../domain/location.entity";
import type { SecurityContext, StorageLocationType, StorageLifecycleState, StorageComplexityMode, SubLocationNode, StorageAddress, StorageMarketplaceConnection } from "../domain/types";
import type { StorageCapability } from "../domain/capabilities";
import type { IStorageLocationRepository, StorageLocationFilter } from "./storage-location.repository.interface";

export class PrismaStorageLocationRepository implements IStorageLocationRepository {
  /**
   * Helper: Ensure default warehouse exists for tenant workspace
   */
  private async ensureDefaultWarehouseId(workspaceId: string): Promise<string> {
    const existing = await db.warehouse.findFirst({
      where: { workspaceId },
      select: { id: true },
    });
    if (existing) return existing.id;

    const created = await db.warehouse.create({
      data: {
        workspaceId,
        code: "DEFAULT-WH",
        name: "Main Warehouse",
        type: "WAREHOUSE",
        active: true,
      },
      select: { id: true },
    });
    return created.id;
  }

  /**
   * Helper: Map Prisma database row to StorageLocationEntity domain object
   */
  private mapToEntity(row: {
    id: string;
    organizationId: string;
    workspaceId: string;
    warehouseId: string;
    parentLocationId: string | null;
    code: string;
    name: string;
    type: string;
    subLocationLevel: string | null;
    lifecycleState: string;
    storageComplexityMode: string;
    barcode: string | null;
    capacityMaxUnits: number | null;
    currentUnitsCount: number;
    isDefault: boolean;
    isArchived: boolean;
    capabilities: string[];
    tags: string[];
    metadata: unknown;
    createdAt: Date;
    updatedAt: Date;
  }): StorageLocationEntity {
    const meta = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
    const address = meta.address as StorageAddress | undefined;
    const marketplace = meta.marketplace as StorageMarketplaceConnection | undefined;
    const subLocations = (Array.isArray(meta.subLocations) ? meta.subLocations : []) as SubLocationNode[];

    return new StorageLocationEntity({
      id: row.id,
      name: row.name,
      code: row.code,
      type: row.type as StorageLocationType,
      lifecycleState: row.lifecycleState as StorageLifecycleState,
      storageComplexityMode: row.storageComplexityMode as StorageComplexityMode,
      subLocations,
      parentLocationId: row.parentLocationId ?? undefined,
      address,
      marketplace,
      isDefault: row.isDefault,
      isArchived: row.isArchived,
      capabilities: row.capabilities as StorageCapability[],
      tags: row.tags,
      metadata: meta,
      securityContext: {
        tenantId: row.organizationId,
        organizationId: row.organizationId,
        workspaceId: row.workspaceId,
      },
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  public async findById(id: string, security: SecurityContext): Promise<StorageLocationEntity | null> {
    const row = await db.storageLocation.findFirst({
      where: {
        id,
        organizationId: security.organizationId,
        workspaceId: security.workspaceId,
      },
    });
    if (!row) return null;
    return this.mapToEntity(row);
  }

  public async findByCode(code: string, security: SecurityContext): Promise<StorageLocationEntity | null> {
    const row = await db.storageLocation.findFirst({
      where: {
        code: { equals: code, mode: "insensitive" },
        organizationId: security.organizationId,
        workspaceId: security.workspaceId,
      },
    });
    if (!row) return null;
    return this.mapToEntity(row);
  }

  public async list(security: SecurityContext, filter?: StorageLocationFilter): Promise<StorageLocationEntity[]> {
    const whereClause: {
      organizationId: string;
      workspaceId: string;
      type?: string;
      parentLocationId?: string | null;
      isArchived?: boolean;
      isDefault?: boolean;
      OR?: Array<{ name?: { contains: string; mode: "insensitive" }; code?: { contains: string; mode: "insensitive" } }>;
    } = {
      organizationId: security.organizationId,
      workspaceId: security.workspaceId,
    };

    if (filter) {
      if (filter.type) whereClause.type = filter.type;
      if (filter.parentLocationId !== undefined) {
        whereClause.parentLocationId = filter.parentLocationId || null;
      }
      if (filter.isArchived !== undefined) whereClause.isArchived = filter.isArchived;
      if (filter.isDefault !== undefined) whereClause.isDefault = filter.isDefault;
      if (filter.search && filter.search.trim().length > 0) {
        const q = filter.search.trim();
        whereClause.OR = [
          { name: { contains: q, mode: "insensitive" } },
          { code: { contains: q, mode: "insensitive" } },
        ];
      }
    }

    const rows = await db.storageLocation.findMany({
      where: whereClause,
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    return rows.map((row) => this.mapToEntity(row));
  }

  public async save(location: StorageLocationEntity): Promise<StorageLocationEntity> {
    const warehouseId = await this.ensureDefaultWarehouseId(location.securityContext.workspaceId);

    const metaPayload = {
      ...(location.metadata || {}),
      address: location.address,
      marketplace: location.marketplace,
      subLocations: location.subLocations,
    };

    const created = await db.storageLocation.create({
      data: {
        id: location.id,
        organizationId: location.securityContext.organizationId,
        workspaceId: location.securityContext.workspaceId,
        warehouseId,
        parentLocationId: location.parentLocationId || null,
        code: location.code,
        name: location.name,
        type: location.type,
        lifecycleState: location.lifecycleState,
        storageComplexityMode: location.storageComplexityMode || "simple",
        isDefault: location.isDefault,
        isArchived: location.isArchived,
        capabilities: location.capabilities || [],
        tags: location.tags || [],
        metadata: metaPayload as any,
      },
    });

    return this.mapToEntity(created);
  }

  public async update(location: StorageLocationEntity): Promise<StorageLocationEntity> {
    const metaPayload = {
      ...(location.metadata || {}),
      address: location.address,
      marketplace: location.marketplace,
      subLocations: location.subLocations,
    };

    const updated = await db.storageLocation.update({
      where: {
        workspaceId_id: {
          workspaceId: location.securityContext.workspaceId,
          id: location.id,
        },
      },
      data: {
        name: location.name,
        code: location.code,
        parentLocationId: location.parentLocationId || null,
        lifecycleState: location.lifecycleState,
        storageComplexityMode: location.storageComplexityMode,
        isDefault: location.isDefault,
        isArchived: location.isArchived,
        capabilities: location.capabilities,
        tags: location.tags,
        metadata: metaPayload as any,
        updatedAt: new Date(),
      },
    });

    return this.mapToEntity(updated);
  }

  public async archive(id: string, security: SecurityContext): Promise<boolean> {
    const updated = await db.storageLocation.updateMany({
      where: {
        id,
        organizationId: security.organizationId,
        workspaceId: security.workspaceId,
      },
      data: {
        isArchived: true,
        lifecycleState: "archived",
        updatedAt: new Date(),
      },
    });

    return updated.count > 0;
  }

  public async findSubLocations(parentLocationId: string, security: SecurityContext): Promise<StorageLocationEntity[]> {
    return this.list(security, { parentLocationId });
  }

  public async clearDefaultFlag(security: SecurityContext): Promise<void> {
    await db.storageLocation.updateMany({
      where: {
        organizationId: security.organizationId,
        workspaceId: security.workspaceId,
        isDefault: true,
      },
      data: {
        isDefault: false,
        updatedAt: new Date(),
      },
    });
  }
}
