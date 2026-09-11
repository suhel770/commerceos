import { db } from "@/lib/db";
import {
  ListingStatus,
  MarketplaceName,
  MarketplacePublishStatus,
  type MasterListing,
  type ValidationIssue,
  type MediaKind,
} from "@/lib/types/master-listing";
import type { MasterListingRepositoryContract } from "./master-listing.repository.contract";

export class RevisionConflictError extends Error {
  constructor(expected: number, actual: number) {
    super(`Revision conflict. Expected: ${expected}, Actual: ${actual}`);
    this.name = "RevisionConflictError";
  }
}

/**
 * Transforms a real database Product record into the standard MasterListing domain model.
 */
function productToMasterListing(product: any): MasterListing {
  const masterListing = product.masterListing;
  const costPrice = Number(product.costPrice ?? 0);
  const sellingPrice = Number(product.sellingPrice ?? 0);
  const mrp = Number(product.mrp ?? 0);
  const availableStock = product.inventoryItems?.reduce((sum: number, item: any) => sum + (item.availableSellable ?? item.quantityOnHand ?? 0), 0) ?? 0;

  const images = (product.images as string[]) ?? [];

  return {
    id: masterListing?.id ?? product.id,
    organizationId: product.workspace?.organizationId ?? "org-commerceos",
    workspaceId: product.workspaceId ?? "ws-default",
    revision: masterListing?.revision ?? 1,
    status: (masterListing?.status as ListingStatus) ?? ListingStatus.DRAFT,
    identity: {
      id: product.id,
      sku: product.sku,
      productName: product.name,
      shortName: product.name,
      brand: product.brand ?? "",
      category: product.category ?? "General",
      subCategory: product.subCategory ?? "",
      barcode: product.barcode ?? "",
      hsn: product.hsn ?? "",
      taxCode: product.gstRate ? `${product.gstRate}% GST` : "",
    },
    media: images.map((url, idx) => ({
      id: `media-${idx + 1}`,
      kind: "image" as MediaKind,
      url,
      thumbnail: url,
      isPrimary: idx === 0,
      sortOrder: idx,
    })),
    pricing: {
      mrp,
      sellingPrice,
      costPrice,
      currency: "INR",
      taxPercentage: Number(product.gstRate ?? 18),
    },
    commercials: {
      minimumPrice: costPrice,
      maximumPrice: mrp || sellingPrice,
      weightGrams: 0,
      packageLengthCm: 0,
      packageWidthCm: 0,
      packageHeightCm: 0,
    },
    inventory: {
      available: availableStock,
      reserved: 0,
      incoming: 0,
      safetyStock: 0,
      warehouseIds: [],
    },
    supply: {
      primarySupplier: undefined,
      supplierSku: undefined,
      leadTimeDays: undefined,
      minimumOrderQuantity: undefined,
      reorderQuantity: undefined,
    },
    variants: [],
    compliance: {
      countryOfOrigin: "IN",
      warranty: undefined,
      legalMetrology: undefined,
      certifications: [],
      documents: [],
    },
    growth: {
      seoTitle: product.name,
      metaDescription: masterListing?.description ?? "",
      searchTerms: [],
      bulletPoints: masterListing?.bulletPoints ?? [],
      merchandisingTags: [],
    },
    attributes: (masterListing?.attributes ?? []).map((attr: any) => ({
      id: attr.id,
      key: attr.key,
      label: attr.label,
      value: attr.value,
      group: attr.group ?? "general",
    })),
    attributeMappings: [],
    marketplaces: (masterListing?.marketplaceListings ?? []).map((mkt: any) => ({
      marketplace: mkt.connection?.marketplace as MarketplaceName,
      status: mkt.publishStatus as MarketplacePublishStatus,
      externalListingId: mkt.externalListingId ?? undefined,
      listingUrl: undefined,
      validationScore: 100,
      validationIssues: [],
      enabled: mkt.publishStatus === MarketplacePublishStatus.PUBLISHED,
    })),
    aiInsights: [],
    validationIssues: [],
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
      createdAt: product.createdAt?.toISOString?.() ?? new Date().toISOString(),
      updatedAt: product.updatedAt?.toISOString?.() ?? new Date().toISOString(),
      createdBy: "system",
      updatedBy: "system",
      version: masterListing?.revision ?? 1,
    },
    activity: [],
  };
}

class MasterListingRepository implements MasterListingRepositoryContract {
  async getAll(): Promise<MasterListing[]> {
    try {
      const products = await db.product.findMany({
        include: {
          workspace: true,
          masterListing: {
            include: {
              attributes: true,
              marketplaceListings: {
                include: { connection: true },
              },
            },
          },
          inventoryItems: true,
        },
      });

      return products.map(productToMasterListing);
    } catch {
      return [];
    }
  }

  async getById(id: string): Promise<MasterListing | null> {
    try {
      // 1. Try finding by product id or productId or slug
      let product = await db.product.findFirst({
        where: {
          OR: [
            { id },
            { productId: id },
            { sku: id },
            { slug: id },
          ],
        },
        include: {
          workspace: true,
          masterListing: {
            include: {
              attributes: true,
              marketplaceListings: {
                include: { connection: true },
              },
            },
          },
          inventoryItems: true,
        },
      });

      if (!product) {
        // Try finding by masterListing id
        const ml = await db.masterListing.findUnique({
          where: { id },
          include: {
            product: {
              include: {
                workspace: true,
                inventoryItems: true,
              },
            },
            attributes: true,
            marketplaceListings: {
              include: { connection: true },
            },
          },
        });

        if (ml?.product) {
          product = {
            ...ml.product,
            masterListing: ml,
          } as any;
        }
      }

      if (!product) {
        return null;
      }

      return productToMasterListing(product);
    } catch {
      return null;
    }
  }

  async getBySku(sku: string): Promise<MasterListing | null> {
    try {
      const product = await db.product.findFirst({
        where: { sku },
        include: {
          workspace: true,
          masterListing: {
            include: {
              attributes: true,
              marketplaceListings: {
                include: { connection: true },
              },
            },
          },
          inventoryItems: true,
        },
      });

      if (!product) return null;
      return productToMasterListing(product);
    } catch {
      return null;
    }
  }

  async create(listing: MasterListing): Promise<MasterListing> {
    return listing;
  }

  async update(
    id: string,
    updates: Partial<MasterListing>,
  ): Promise<MasterListing | null> {
    const existing = await this.getById(id);
    if (!existing) return null;

    const merged: MasterListing = {
      ...existing,
      ...updates,
      audit: {
        ...existing.audit,
        updatedAt: new Date().toISOString(),
        version: existing.audit.version + 1,
      },
      revision: existing.revision + 1,
    };

    return merged;
  }

  async updateWithRevision(
    id: string,
    updates: Partial<MasterListing>,
    expectedRevision: number,
  ): Promise<MasterListing | null> {
    const listing = await this.getById(id);
    if (!listing) return null;

    if (listing.revision !== expectedRevision) {
      throw new RevisionConflictError(expectedRevision, listing.revision);
    }

    return this.update(id, updates);
  }

  async delete(id: string): Promise<boolean> {
    return true;
  }

  async archive(id: string): Promise<MasterListing | null> {
    return this.update(id, {
      status: ListingStatus.ARCHIVED,
    });
  }

  async updatePricing(
    id: string,
    sellingPrice: number,
    mrp: number,
    costPrice: number,
  ): Promise<MasterListing | null> {
    const listing = await this.getById(id);
    if (!listing) return null;

    return this.update(id, {
      pricing: {
        ...listing.pricing,
        sellingPrice,
        mrp,
        costPrice,
      },
    });
  }

  async updateInventory(
    id: string,
    available: number,
  ): Promise<MasterListing | null> {
    const listing = await this.getById(id);
    if (!listing) return null;

    return this.update(id, {
      inventory: {
        ...listing.inventory,
        available,
      },
    });
  }

  async replaceValidationIssues(
    id: string,
    issues: ValidationIssue[],
  ): Promise<MasterListing | null> {
    const listing = await this.getById(id);
    if (!listing) return null;

    return this.update(id, {
      validationIssues: issues,
    });
  }

  async updateMarketplaceStatus(
    id: string,
    marketplace: MarketplaceName,
    status: MarketplacePublishStatus,
  ): Promise<MasterListing | null> {
    const listing = await this.getById(id);
    if (!listing) return null;

    const marketplaces = listing.marketplaces.map((m) =>
      m.marketplace === marketplace ? { ...m, status } : m,
    );

    return this.update(id, { marketplaces });
  }

  async publish(id: string): Promise<MasterListing | null> {
    return this.update(id, {
      status: ListingStatus.PUBLISHED,
    });
  }

  async markReady(id: string): Promise<MasterListing | null> {
    return this.update(id, {
      status: ListingStatus.READY,
    });
  }
}

export const masterListingRepository = new MasterListingRepository();