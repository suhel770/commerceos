import ProductMapper from "@/lib/mappers/product.mapper";

import masterListingService from "@/lib/services/masterListing.service";

import type { Product } from "@/lib/types/product";
import {
  MarketplaceName,
  type AIInsight,
  type MasterAttribute,
  type MasterListing,
  type ValidationIssue,
} from "@/lib/types/master-listing";

/**
 * Studio Service
 *
 * Product Studio Facade
 *
 * UI
 *  ↓
 * StudioService
 *  ↓
 * ProductMapper
 *  ↓
 * MasterListingService
 */

export class StudioService {
  /**
   * Convert Product -> Master Listing
   */
  static async load(
    product: Product,
  ): Promise<MasterListing> {
    const savedListing =
      await masterListingService.getById(
        product.id,
      );

    if (savedListing) {
      const seen =
        new Set<MarketplaceName>();

      const marketplaces =
        savedListing.marketplaces.flatMap(
          (connection) => {
            if (
              !seen.has(
                connection.marketplace,
              )
            ) {
              seen.add(
                connection.marketplace,
              );

              return [connection];
            }

            if (
              connection.marketplace ===
                MarketplaceName.SHOPIFY &&
              !seen.has(
                MarketplaceName.WOOCOMMERCE,
              )
            ) {
              seen.add(
                MarketplaceName.WOOCOMMERCE,
              );

              return [
                {
                  ...connection,
                  marketplace:
                    MarketplaceName.WOOCOMMERCE,
                },
              ];
            }

            return [];
          },
        );

      const seeded =
        ProductMapper.toMasterListing(
          product,
        );

      return {
        ...seeded,
        ...savedListing,
        organizationId:
          savedListing.organizationId ??
          seeded.organizationId,
        revision:
          savedListing.revision ?? 0,
        media:
          savedListing.media?.length
            ? savedListing.media.map(
                (item, index) => ({
                  ...item,
                  kind:
                    item.kind ??
                    "image",
                  sortOrder:
                    item.sortOrder ??
                    index,
                }),
              )
            : seeded.media,
        commercials:
          savedListing.commercials ??
          seeded.commercials,
        supply:
          savedListing.supply ??
          seeded.supply,
        variants:
          savedListing.variants
            ?.length
            ? savedListing.variants
            : seeded.variants,
        compliance:
          savedListing.compliance ??
          seeded.compliance,
        growth:
          savedListing.growth ??
          seeded.growth,
        activity:
          savedListing.activity
            ?.length
            ? savedListing.activity
            : seeded.activity,
        marketplaces:
          marketplaces.length
            ? marketplaces
            : seeded.marketplaces,
      };
    }

    return ProductMapper.toMasterListing(
      product,
    );
  }

  /**
   * Save Draft
   */
  static async saveDraft(
    listing: MasterListing,
  ): Promise<MasterListing> {
    const savedAt =
      new Date().toISOString();
    const nextListing = {
      ...listing,
      activity: [
        {
          id: crypto.randomUUID(),
          type: "product.updated",
          title:
            "Master product updated",
          description:
            "Draft changes were saved.",
          actorId: "user-owner",
          actorName: "Owner",
          timestamp: savedAt,
        },
        ...listing.activity,
      ].slice(0, 200),
      audit: {
        ...listing.audit,
        updatedAt: savedAt,
        updatedBy: "user-owner",
      },
    };
    const existing =
      await masterListingService.getById(
        listing.id,
      );
    const updated = existing
      ? await masterListingService.updateWithRevision(
          listing.id,
          nextListing,
          listing.revision,
        )
      : await masterListingService.create(
          nextListing,
        );

    if (!updated) {
      throw new Error(
        "Unable to save draft.",
      );
    }

    return updated;
  }

  /**
   * Validation
   */
  static async validate(
    listingId: string,
  ) {
    return masterListingService.validate(
      listingId,
    );
  }

  static async replaceValidationIssues(
    listingId: string,
    issues: ValidationIssue[],
  ) {
    return masterListingService.replaceValidationIssues(
      listingId,
      issues,
    );
  }

  /**
   * Publish
   */
  static async publish(
    listingId: string,
    marketplace?: MarketplaceName,
  ) {
    const published =
      await masterListingService.publish(
      listingId,
      marketplace,
    );

    if (!published) {
      return null;
    }

    const publishedAt =
      new Date().toISOString();

    return masterListingService.update(
      listingId,
      {
        activity: [
          {
            id: crypto.randomUUID(),
            type:
              "listing.published",
            title: marketplace
              ? `${marketplace} published`
              : "Listings published",
            description: marketplace
              ? `Published to ${marketplace}.`
              : "Published to all enabled channels.",
            actorId:
              "user-owner",
            actorName: "Owner",
            timestamp:
              publishedAt,
          },
          ...published.activity,
        ].slice(0, 200),
      },
    );
  }

  /**
   * Pricing
   */
  static async updatePricing(
    listingId: string,
    sellingPrice: number,
    mrp: number,
    costPrice: number,
  ) {
    return masterListingService.updatePricing(
      listingId,
      sellingPrice,
      mrp,
      costPrice,
    );
  }

  /**
   * Inventory
   */
  static async updateInventory(
    listingId: string,
    quantity: number,
  ) {
    return masterListingService.updateInventory(
      listingId,
      quantity,
    );
  }

  /**
   * Attributes
   */
  static async upsertAttribute(
    listingId: string,
    attribute: MasterAttribute,
  ) {
    return masterListingService.upsertAttribute(
      listingId,
      attribute,
    );
  }

  static async removeAttribute(
    listingId: string,
    key: string,
  ) {
    return masterListingService.removeAttribute(
      listingId,
      key,
    );
  }

  /**
   * AI
   */
  static async addInsight(
    listingId: string,
    insight: AIInsight,
  ) {
    return masterListingService.addAIInsight(
      listingId,
      insight,
    );
  }

  static async applyInsight(
    listingId: string,
    insightId: string,
  ) {
    return masterListingService.markInsightApplied(
      listingId,
      insightId,
    );
  }

  /**
   * Refresh Listing
   */
  static async reload(
    listingId: string,
  ) {
    return masterListingService.getById(
      listingId,
    );
  }
}

export default StudioService;