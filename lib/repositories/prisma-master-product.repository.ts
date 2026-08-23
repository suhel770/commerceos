/**
 * CommerceOS V4 — Prisma Master Product Repository
 * PostgreSQL-backed implementation of MasterListingRepositoryContract
 * Maps between domain MasterListing objects and Prisma Product + MasterListing models
 */

import { db } from "@/lib/db";
import {
  ListingStatus,
  MarketplaceName,
  MarketplacePublishStatus,
  type MasterListing,
  type ValidationIssue,
} from "@/lib/types/master-listing";
import type { MasterListingRepositoryContract } from "./master-listing.repository.contract";

export class PrismaMasterProductRepository
  implements MasterListingRepositoryContract
{
  private defaultWorkspaceId = "ws-default";
  private defaultOrgId = "org-commerceos";

  /**
   * Helper: Map Prisma Product + MasterListing records to domain MasterListing
   */
  private mapToDomain(row: {
    id: string;
    workspaceId: string;
    sku: string;
    name: string;
    brand: string | null;
    category: string;
    subCategory: string | null;
    barcode: string | null;
    hsn: string | null;
    costPrice: { toString(): string } | number;
    sellingPrice: { toString(): string } | number;
    mrp: { toString(): string } | number;
    status: string;
    images: string[];
    createdAt: Date;
    updatedAt: Date;
    masterListing?: {
      id: string;
      revision: number;
      status: string;
      shortDescription: string | null;
      description: string | null;
      bulletPoints: string[];
      attributes?: Array<{ key: string; label: string; value: string; group: string }>;
    } | null;
  }): MasterListing {
    const cost = typeof row.costPrice === "number" ? row.costPrice : Number(row.costPrice.toString());
    const sell = typeof row.sellingPrice === "number" ? row.sellingPrice : Number(row.sellingPrice.toString());
    const mrpVal = typeof row.mrp === "number" ? row.mrp : Number(row.mrp.toString());

    const ml = row.masterListing;

    return {
      id: ml?.id || row.id,
      organizationId: this.defaultOrgId,
      workspaceId: row.workspaceId,
      revision: ml?.revision || 1,
      identity: {
        id: row.id,
        sku: row.sku,
        productName: row.name,
        shortName: ml?.shortDescription || undefined,
        brand: row.brand || "",
        category: row.category,
        subCategory: row.subCategory || undefined,
        barcode: row.barcode || undefined,
        hsn: row.hsn || undefined,
      },
      status: (ml?.status || row.status || "draft") as ListingStatus,
      media: (row.images || []).map((url, idx) => ({
        id: `media-${idx}`,
        kind: "image",
        url,
        isPrimary: idx === 0,
        sortOrder: idx,
      })),
      pricing: {
        costPrice: cost,
        sellingPrice: sell,
        mrp: mrpVal,
        currency: "INR",
      },
      commercials: {},
      inventory: {
        available: 0,
        reserved: 0,
        incoming: 0,
        safetyStock: 5,
        warehouseIds: ["DEFAULT-WH"],
      },
      supply: {},
      variants: [],
      compliance: { certifications: [], documents: [] },
      growth: {
        bulletPoints: ml?.bulletPoints || [],
        searchTerms: [],
        merchandisingTags: [],
      },
      attributes: (ml?.attributes || []).map((attr) => ({
        id: `${attr.group}-${attr.key}`,
        key: attr.key,
        label: attr.label,
        value: attr.value,
        group: attr.group,
      })),
      attributeMappings: [],
      marketplaces: [
        {
          marketplace: MarketplaceName.AMAZON,
          enabled: true,
          publishStatus: MarketplacePublishStatus.NOT_PUBLISHED,
          validationScore: 100,
          issues: [],
        },
        {
          marketplace: MarketplaceName.FLIPKART,
          enabled: true,
          publishStatus: MarketplacePublishStatus.NOT_PUBLISHED,
          validationScore: 100,
          issues: [],
        },
      ],
      validationIssues: [],
      aiInsights: [],
      activity: [],
      permissions: {
        canView: true,
        canEdit: true,
        canPublish: true,
        canArchive: true,
        canDelete: true,
        canManagePricing: true,
        canManageInventory: true,
        canUseAI: true,
      },
      audit: {
        createdAt: row.createdAt.toISOString(),
        updatedAt: row.updatedAt.toISOString(),
        createdBy: "system",
        updatedBy: "system",
        version: ml?.revision || 1,
      },
    };
  }

  public async getAll(): Promise<MasterListing[]> {
    const products = await db.product.findMany({
      where: { workspaceId: this.defaultWorkspaceId, intent: "sellable" },
      include: {
        masterListing: {
          include: { attributes: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return products.map((p) => this.mapToDomain(p));
  }

  public async getById(id: string): Promise<MasterListing | null> {
    const product = await db.product.findFirst({
      where: {
        workspaceId: this.defaultWorkspaceId,
        OR: [{ id }, { masterListing: { id } }],
      },
      include: {
        masterListing: {
          include: { attributes: true },
        },
      },
    });

    if (!product) return null;
    return this.mapToDomain(product);
  }

  public async getBySku(sku: string): Promise<MasterListing | null> {
    const product = await db.product.findFirst({
      where: {
        workspaceId: this.defaultWorkspaceId,
        sku: { equals: sku, mode: "insensitive" },
      },
      include: {
        masterListing: {
          include: { attributes: true },
        },
      },
    });

    if (!product) return null;
    return this.mapToDomain(product);
  }

  public async create(listing: MasterListing): Promise<MasterListing> {
    const workspaceId = listing.workspaceId || this.defaultWorkspaceId;
    const productId = listing.identity.id || listing.id;

    return db.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          id: productId,
          workspaceId,
          sku: listing.identity.sku,
          name: listing.identity.productName,
          brand: listing.identity.brand || null,
          category: listing.identity.category || "General",
          subCategory: listing.identity.subCategory || null,
          barcode: listing.identity.barcode || null,
          hsn: listing.identity.hsn || null,
          costPrice: listing.pricing?.costPrice || 0,
          sellingPrice: listing.pricing?.sellingPrice || 0,
          mrp: listing.pricing?.mrp || 0,
          status: listing.status || "draft",
          images: (listing.media || []).map((m) => m.url),
        },
      });

      const masterListing = await tx.masterListing.create({
        data: {
          id: listing.id,
          workspaceId,
          productId: product.id,
          revision: listing.revision || 1,
          status: (listing.status || "DRAFT") as any,
          shortDescription: listing.identity.shortName || null,
          description: listing.growth?.metaDescription || null,
          bulletPoints: listing.growth?.bulletPoints || [],
        },
      });

      if (listing.attributes && listing.attributes.length > 0) {
        for (const attr of listing.attributes) {
          await tx.masterAttribute.create({
            data: {
              masterListingId: masterListing.id,
              key: attr.key,
              label: attr.label || attr.key,
              value: String(attr.value || ""),
              group: attr.group || "general",
            },
          });
        }
      }

      const fullRow = await tx.product.findUnique({
        where: { id: product.id },
        include: { masterListing: { include: { attributes: true } } },
      });

      return this.mapToDomain(fullRow!);
    });
  }

  public async update(
    id: string,
    updates: Partial<MasterListing>,
  ): Promise<MasterListing | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const productId = existing.identity.id;

    await db.$transaction(async (tx) => {
      if (updates.identity || updates.pricing || updates.status || updates.media) {
        await tx.product.update({
          where: { id: productId },
          data: {
            name: updates.identity?.productName ?? existing.identity.productName,
            sku: updates.identity?.sku ?? existing.identity.sku,
            brand: updates.identity?.brand ?? existing.identity.brand,
            category: updates.identity?.category ?? existing.identity.category,
            costPrice: updates.pricing?.costPrice ?? existing.pricing.costPrice,
            sellingPrice: updates.pricing?.sellingPrice ?? existing.pricing.sellingPrice,
            mrp: updates.pricing?.mrp ?? existing.pricing.mrp,
            status: updates.status ?? existing.status,
            images: updates.media ? updates.media.map((m) => m.url) : undefined,
            updatedAt: new Date(),
          },
        });
      }

      if (updates.revision || updates.status || updates.growth || updates.identity?.shortName) {
        await tx.masterListing.updateMany({
          where: { productId },
          data: {
            revision: updates.revision ?? existing.revision + 1,
            status: (updates.status ?? existing.status) as any,
            shortDescription: updates.identity?.shortName ?? existing.identity.shortName,
            description: updates.growth?.metaDescription ?? existing.growth?.metaDescription,
            bulletPoints: updates.growth?.bulletPoints ?? existing.growth?.bulletPoints,
            updatedAt: new Date(),
          },
        });
      }
    });

    return this.getById(id);
  }

  public async updateWithRevision(
    id: string,
    updates: Partial<MasterListing>,
    expectedRevision: number,
  ): Promise<MasterListing | null> {
    const existing = await this.getById(id);
    if (!existing || existing.revision !== expectedRevision) {
      return null;
    }
    return this.update(id, { ...updates, revision: expectedRevision + 1 });
  }

  public async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;

    await db.product.delete({
      where: { id: existing.identity.id },
    });
    return true;
  }

  public async archive(id: string): Promise<MasterListing | null> {
    return this.update(id, { status: ListingStatus.ARCHIVED });
  }

  public async updatePricing(
    id: string,
    sellingPrice: number,
    mrp: number,
    costPrice: number,
  ): Promise<MasterListing | null> {
    return this.update(id, {
      pricing: { sellingPrice, mrp, costPrice, currency: "INR" },
    });
  }

  public async updateInventory(
    id: string,
    available: number,
  ): Promise<MasterListing | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    return {
      ...existing,
      inventory: {
        ...existing.inventory,
        available,
      },
    };
  }

  public async replaceValidationIssues(
    id: string,
    issues: ValidationIssue[],
  ): Promise<MasterListing | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    return { ...existing, validationIssues: issues };
  }

  public async updateMarketplaceStatus(
    id: string,
    marketplace: MarketplaceName,
    status: MarketplacePublishStatus,
  ): Promise<MasterListing | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const marketplaces = existing.marketplaces.map((m) => {
      if (m.marketplace === marketplace) {
        return { ...m, publishStatus: status };
      }
      return m;
    });

    return { ...existing, marketplaces };
  }

  public async publish(id: string): Promise<MasterListing | null> {
    return this.update(id, { status: ListingStatus.PUBLISHED });
  }

  public async markReady(id: string): Promise<MasterListing | null> {
    return this.update(id, { status: ListingStatus.READY });
  }
}
