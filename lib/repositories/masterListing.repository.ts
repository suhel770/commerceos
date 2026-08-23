import { masterListings } from "@/lib/mocks/master-listing"
import {
  ListingStatus,
  MarketplaceName,
  MarketplacePublishStatus,
  MasterListing,
  ValidationIssue,
} from "@/lib/types/master-listing"
import type { MasterListingRepositoryContract } from "./master-listing.repository.contract"

class MasterListingRepository
  implements MasterListingRepositoryContract
{
  private readonly storageKey = "commerceos.master-listings.v2"

  private listings = structuredClone(masterListings)

  private load(): void {
    if (typeof window === "undefined") return

    const stored = window.localStorage.getItem(this.storageKey)

    if (!stored) {
      // Clear legacy storage v1 if present
      try {
        window.localStorage.removeItem("commerceos.master-listings.v1")
      } catch {}
      return
    }

    try {
      const parsed = JSON.parse(
        stored,
      ) as MasterListing[]

      this.listings = parsed
        .filter((l) => !l.identity?.productName?.includes("StrideKids") && !l.identity?.sku?.startsWith("SR-"))
        .map(
          (listing) => ({
            ...listing,
            organizationId:
              listing.organizationId ??
              "org-commerceos",
            revision:
              listing.revision ?? 0,
          }),
        )
    } catch {
      window.localStorage.removeItem(this.storageKey)
    }
  }

  private persist(): void {
    if (typeof window === "undefined") return

    window.localStorage.setItem(
      this.storageKey,
      JSON.stringify(this.listings),
    )
  }

  async getAll(): Promise<MasterListing[]> {
    this.load()

    return structuredClone(this.listings)
  }

  async getById(id: string): Promise<MasterListing | null> {
    this.load()

    const listing = this.listings.find((l) => l.id === id)

    if (!listing) return null

    return structuredClone(listing)
  }

  async getBySku(sku: string): Promise<MasterListing | null> {
    this.load()

    const listing = this.listings.find(
      (l) => l.identity.sku === sku,
    )

    if (!listing) return null

    return structuredClone(listing)
  }

  async create(
    listing: MasterListing,
  ): Promise<MasterListing> {
    this.load()

    const existingIndex = this.listings.findIndex(
      (item) => item.id === listing.id,
    )

    if (existingIndex >= 0) {
      this.listings[existingIndex] = structuredClone(listing)
    } else {
      this.listings.push(structuredClone(listing))
    }

    this.persist()

    return structuredClone(listing)
  }

  async update(
    id: string,
    updates: Partial<MasterListing>,
  ): Promise<MasterListing | null> {
    this.load()

    const index = this.listings.findIndex(
      (l) => l.id === id,
    )

    if (index === -1) {
      const candidate = {
        ...updates,
        id,
      } as MasterListing

      if (!candidate.identity) return null

      this.listings.push(candidate)
      this.persist()

      return structuredClone(candidate)
    }

    const updated: MasterListing = {
      ...this.listings[index],
      ...updates,
      audit: {
        ...this.listings[index].audit,
        updatedAt: new Date().toISOString(),
        version:
          this.listings[index].audit.version + 1,
      },
      revision:
        this.listings[index].revision +
        1,
    }

    this.listings[index] = updated
    this.persist()

    return structuredClone(updated)
  }

  async updateWithRevision(
    id: string,
    updates: Partial<MasterListing>,
    expectedRevision: number,
  ): Promise<MasterListing | null> {
    const listing =
      await this.getById(id)

    if (!listing) return null

    if (
      listing.revision !==
      expectedRevision
    ) {
      throw new RevisionConflictError(
        expectedRevision,
        listing.revision,
      )
    }

    return this.update(
      id,
      updates,
    )
  }

  async delete(id: string): Promise<boolean> {
    this.load()

    const index = this.listings.findIndex(
      (l) => l.id === id,
    )

    if (index === -1) return false

    this.listings.splice(index, 1)
    this.persist()

    return true
  }

  async archive(
    id: string,
  ): Promise<MasterListing | null> {
    return this.update(id, {
      status: ListingStatus.ARCHIVED,
    })
  }

  async updatePricing(
    id: string,
    sellingPrice: number,
    mrp: number,
    costPrice: number,
  ): Promise<MasterListing | null> {
    const listing = await this.getById(id)

    if (!listing) return null

    return this.update(id, {
      pricing: {
        ...listing.pricing,
        sellingPrice,
        mrp,
        costPrice,
      },
    })
  }

  async updateInventory(
    id: string,
    available: number,
  ): Promise<MasterListing | null> {
    const listing = await this.getById(id)

    if (!listing) return null

    return this.update(id, {
      inventory: {
        ...listing.inventory,
        available,
      },
    })
  }

  async replaceValidationIssues(
    id: string,
    issues: ValidationIssue[],
  ): Promise<MasterListing | null> {
    this.load()

    const index =
      this.listings.findIndex(
        (listing) =>
          listing.id === id,
      )

    if (index === -1) {
      return null
    }

    this.listings[index] = {
      ...this.listings[index],
      validationIssues:
        structuredClone(issues),
    }
    this.persist()

    return structuredClone(
      this.listings[index],
    )
  }

  async updateMarketplaceStatus(
    id: string,
    marketplace: MarketplaceName,
    status: MarketplacePublishStatus,
  ): Promise<MasterListing | null> {
    const listing = await this.getById(id)

    if (!listing) return null

    return this.update(id, {
      marketplaces: listing.marketplaces.map((m) =>
        m.marketplace === marketplace
          ? {
              ...m,
              publishStatus: status,
              lastSyncedAt:
                new Date().toISOString(),
            }
          : m,
      ),
    })
  }

  async publish(
    id: string,
  ): Promise<MasterListing | null> {
    return this.update(id, {
      status: ListingStatus.PUBLISHED,
    })
  }

  async markReady(
    id: string,
  ): Promise<MasterListing | null> {
    return this.update(id, {
      status: ListingStatus.READY,
    })
  }
}

import { PrismaMasterProductRepository } from "./prisma-master-product.repository";

export { MasterListingRepository };
export const masterListingRepository: MasterListingRepositoryContract =
  new PrismaMasterProductRepository();

export class RevisionConflictError extends Error {
  readonly code = "REVISION_CONFLICT"

  constructor(
    readonly expected: number,
    readonly actual: number,
  ) {
    super(
      `Expected revision ${expected}, but found ${actual}.`,
    )
    this.name = "RevisionConflictError"
  }
}