import { listingEngine } from "@/lib/listing-engine"
import { masterListingRepository } from "@/lib/repositories/masterListing.repository"
import { validateMasterListing } from "@/lib/domain/master-product/validate-master-listing"

import {
  AIInsight,
  ListingStatus,
  MarketplaceName,
  MarketplacePublishStatus,
  MasterAttribute,
  MasterListing,
  ValidationIssue,
  ValidationSeverity,
} from "@/lib/types/master-listing"

class MasterListingService {
  /* -------------------------------------------------------------------------- */
  /*                                   Queries                                  */
  /* -------------------------------------------------------------------------- */

  async getAll(): Promise<MasterListing[]> {
    return masterListingRepository.getAll()
  }

  async getById(id: string): Promise<MasterListing | null> {
    return masterListingRepository.getById(id)
  }

  async getBySku(sku: string): Promise<MasterListing | null> {
    return masterListingRepository.getBySku(sku)
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Commands                                  */
  /* -------------------------------------------------------------------------- */

  async create(listing: MasterListing) {
    return masterListingRepository.create(listing)
  }

  async update(
    id: string,
    updates: Partial<MasterListing>,
  ) {
    return masterListingRepository.update(id, updates)
  }

  async updateWithRevision(
    id: string,
    updates: Partial<MasterListing>,
    expectedRevision: number,
  ) {
    return masterListingRepository.updateWithRevision(
      id,
      updates,
      expectedRevision,
    )
  }

  async archive(id: string) {
    return masterListingRepository.archive(id)
  }

  async delete(id: string) {
    return masterListingRepository.delete(id)
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Pricing                                  */
  /* -------------------------------------------------------------------------- */

  async updatePricing(
    id: string,
    sellingPrice: number,
    mrp: number,
    costPrice: number,
  ) {
    if (sellingPrice > mrp) {
      throw new Error(
        "Selling price cannot be greater than MRP.",
      )
    }

    if (costPrice > sellingPrice) {
      throw new Error(
        "Cost price cannot exceed selling price.",
      )
    }

    return masterListingRepository.updatePricing(
      id,
      sellingPrice,
      mrp,
      costPrice,
    )
  }

  getProfit(listing: MasterListing) {
    return (
      listing.pricing.sellingPrice -
      listing.pricing.costPrice
    )
  }

  getProfitMargin(listing: MasterListing) {
    const profit = this.getProfit(listing)

    return Number(
      (
        (profit / listing.pricing.sellingPrice) *
        100
      ).toFixed(2),
    )
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Inventory                                  */
  /* -------------------------------------------------------------------------- */

  async updateInventory(
    id: string,
    quantity: number,
  ) {
    if (quantity < 0) {
      throw new Error(
        "Inventory cannot be negative."
      )
    }

    return masterListingRepository.updateInventory(
      id,
      quantity,
    )
  }

  getAvailableInventory(listing: MasterListing) {
    return (
      listing.inventory.available -
      listing.inventory.reserved
    )
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Attributes                                 */
  /* -------------------------------------------------------------------------- */

  async upsertAttribute(
    id: string,
    attribute: MasterAttribute,
  ) {
    const listing =
      await masterListingRepository.getById(id)

    if (!listing) return null

    const attributes = [...listing.attributes]

    const index = attributes.findIndex(
      (a) => a.key === attribute.key,
    )

    if (index === -1) {
      attributes.push(attribute)
    } else {
      attributes[index] = attribute
    }

    return masterListingRepository.update(id, {
      attributes,
    })
  }

  async removeAttribute(
    id: string,
    key: string,
  ) {
    const listing =
      await masterListingRepository.getById(id)

    if (!listing) return null

    return masterListingRepository.update(id, {
      attributes: listing.attributes.filter(
        (a) => a.key !== key,
      ),
    })
  }

  /* -------------------------------------------------------------------------- */
  /*                                  AI                                        */
  /* -------------------------------------------------------------------------- */

  async addAIInsight(
    id: string,
    insight: AIInsight,
  ) {
    const listing =
      await masterListingRepository.getById(id)

    if (!listing) return null

    return masterListingRepository.update(id, {
      aiInsights: [
        ...listing.aiInsights,
        insight,
      ],
    })
  }

  async markInsightApplied(
    id: string,
    insightId: string,
  ) {
    const listing =
      await masterListingRepository.getById(id)

    if (!listing) return null

    return masterListingRepository.update(id, {
      aiInsights: listing.aiInsights.map(
        (insight) =>
          insight.id === insightId
            ? {
                ...insight,
                applied: true,
              }
            : insight,
      ),
    })
  }

  /* -------------------------------------------------------------------------- */
  /*                                Validation                                  */
  /* -------------------------------------------------------------------------- */

  async validate(id: string) {
    const listing =
      await masterListingRepository.getById(id)

    if (!listing) return null

    const result =
      validateMasterListing(
        listing,
      )

    await masterListingRepository.replaceValidationIssues(
      id,
      result.issues,
    )

    if (result.valid) {
      await masterListingRepository.markReady(
        id,
      )
    }

    return result.issues
  }

  isPublishReady(
    listing: MasterListing,
  ): boolean {
    return (
      listing.status ===
        ListingStatus.READY &&
      listing.validationIssues.length ===
        0
    )
  }

  /* -------------------------------------------------------------------------- */
  /*                              Marketplace                                   */
  /* -------------------------------------------------------------------------- */

  async updateMarketplaceStatus(
    id: string,
    marketplace: MarketplaceName,
    status: MarketplacePublishStatus,
  ) {
    return masterListingRepository.updateMarketplaceStatus(
      id,
      marketplace,
      status,
    )
  }

  async publish(
    id: string,
    marketplace?: MarketplaceName,
  ) {
    const listing =
      await masterListingRepository.getById(id)

    if (!listing) return null

    const result = await listingEngine.publish(
      id,
      marketplace,
    )

    return result.listing
  }

  async replaceValidationIssues(
    id: string,
    issues: ValidationIssue[],
  ) {
    return masterListingRepository.replaceValidationIssues(
      id,
      issues,
    )
  }
}

export const masterListingService =
  new MasterListingService()

export default masterListingService