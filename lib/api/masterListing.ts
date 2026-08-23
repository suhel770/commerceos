import masterListingService from "@/lib/services/masterListing.service"

import {
  AIInsight,
  MarketplaceName,
  MasterAttribute,
  MasterListing,
} from "@/lib/types/master-listing"

export const masterListingApi = {
  /* -------------------------------------------------------------------------- */
  /*                                  Queries                                   */
  /* -------------------------------------------------------------------------- */

  getAll(): Promise<MasterListing[]> {
    return masterListingService.getAll()
  },

  getById(id: string): Promise<MasterListing | null> {
    return masterListingService.getById(id)
  },

  getBySku(sku: string): Promise<MasterListing | null> {
    return masterListingService.getBySku(sku)
  },

  /* -------------------------------------------------------------------------- */
  /*                                  Commands                                  */
  /* -------------------------------------------------------------------------- */

  create(listing: MasterListing) {
    return masterListingService.create(listing)
  },

  update(
    id: string,
    updates: Partial<MasterListing>,
  ) {
    return masterListingService.update(id, updates)
  },

  archive(id: string) {
    return masterListingService.archive(id)
  },

  delete(id: string) {
    return masterListingService.delete(id)
  },

  /* -------------------------------------------------------------------------- */
  /*                                  Pricing                                   */
  /* -------------------------------------------------------------------------- */

  updatePricing(
    id: string,
    sellingPrice: number,
    mrp: number,
    costPrice: number,
  ) {
    return masterListingService.updatePricing(
      id,
      sellingPrice,
      mrp,
      costPrice,
    )
  },

  /* -------------------------------------------------------------------------- */
  /*                                 Inventory                                  */
  /* -------------------------------------------------------------------------- */

  updateInventory(
    id: string,
    quantity: number,
  ) {
    return masterListingService.updateInventory(
      id,
      quantity,
    )
  },

  /* -------------------------------------------------------------------------- */
  /*                                 Attributes                                 */
  /* -------------------------------------------------------------------------- */

  upsertAttribute(
    id: string,
    attribute: MasterAttribute,
  ) {
    return masterListingService.upsertAttribute(
      id,
      attribute,
    )
  },

  removeAttribute(
    id: string,
    key: string,
  ) {
    return masterListingService.removeAttribute(
      id,
      key,
    )
  },

  /* -------------------------------------------------------------------------- */
  /*                                     AI                                     */
  /* -------------------------------------------------------------------------- */

  addAIInsight(
    id: string,
    insight: AIInsight,
  ) {
    return masterListingService.addAIInsight(
      id,
      insight,
    )
  },

  markInsightApplied(
    id: string,
    insightId: string,
  ) {
    return masterListingService.markInsightApplied(
      id,
      insightId,
    )
  },

  /* -------------------------------------------------------------------------- */
  /*                                 Validation                                 */
  /* -------------------------------------------------------------------------- */

  validate(id: string) {
    return masterListingService.validate(id)
  },

  /* -------------------------------------------------------------------------- */
  /*                                 Publishing                                 */
  /* -------------------------------------------------------------------------- */

  publish(
    id: string,
    marketplace?: MarketplaceName,
  ) {
    return masterListingService.publish(
      id,
      marketplace,
    )
  },
}

export default masterListingApi