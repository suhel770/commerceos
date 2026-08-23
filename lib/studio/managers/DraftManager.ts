import type {
  MasterAttribute,
  MasterListing,
} from "@/lib/types/master-listing";

import StudioEngine from "../StudioEngine";

export default class DraftManager {
  constructor(
    private readonly engine: StudioEngine,
  ) {}

  /**
   * Replace entire listing
   */
  replace(
    listing: MasterListing,
  ) {
    this.engine.replaceListing(
      structuredClone(listing),
    );

    this.engine.markDirty(false);
  }

  /**
   * Generic update
   */
  update(
    updates: Partial<MasterListing>,
  ) {
    this.engine.update(updates);
  }

  /**
   * Identity
   */
  updateIdentity(
    updates: Partial<
      MasterListing["identity"]
    >,
  ) {
    this.engine.update({
      identity: {
        ...this.engine.listing.identity,
        ...updates,
      },
    });
  }

  /**
   * Pricing
   */
  updatePricing(
    updates: Partial<
      MasterListing["pricing"]
    >,
  ) {
    this.engine.update({
      pricing: {
        ...this.engine.listing.pricing,
        ...updates,
      },
    });
  }

  /**
   * Inventory
   */
  updateInventory(
    updates: Partial<
      MasterListing["inventory"]
    >,
  ) {
    this.engine.update({
      inventory: {
        ...this.engine.listing.inventory,
        ...updates,
      },
    });
  }

  /**
   * Media
   */
  updateMedia(
    media: MasterListing["media"],
  ) {
    this.engine.update({
      media,
    });
  }

  /**
   * Audit
   */
  touch() {
    this.engine.update({
      audit: {
        ...this.engine.listing.audit,
        updatedAt:
          new Date().toISOString(),
      },
    });
  }

  /**
   * Attribute Upsert
   */
  updateAttribute(
    attribute: MasterAttribute,
  ) {
    const attributes = [
      ...this.engine.listing.attributes,
    ];

    const index =
      attributes.findIndex(
        (item) =>
          item.key ===
          attribute.key,
      );

    if (index >= 0) {
      attributes[index] =
        attribute;
    } else {
      attributes.push(attribute);
    }

    this.engine.update({
      attributes,
    });
  }

  /**
   * Remove Attribute
   */
  removeAttribute(
    key: string,
  ) {
    this.engine.update({
      attributes:
        this.engine.listing.attributes.filter(
          (item) =>
            item.key !== key,
        ),
    });
  }

  /**
   * Marketplace Connection
   */
  updateMarketplace(
    marketplace: string,
    updates: Record<
      string,
      unknown
    >,
  ) {
    const connections =
      this.engine.listing.marketplaces.map(
        (connection) =>
          connection.marketplace ===
          marketplace
            ? {
                ...connection,
                ...updates,
              }
            : connection,
      );

    this.engine.update({
      marketplaces: connections,
    });
  }

  /**
   * Validation Issues
   */
  replaceValidation(
    issues:
      MasterListing["validationIssues"],
  ) {
    this.engine.replaceListing({
      ...this.engine.listing,
      validationIssues: issues,
    });
  }

  /**
   * AI Insights
   */
  replaceInsights() {
    this.engine.update({
      aiInsights: [
        ...this.engine.listing
          .aiInsights,
      ],
    });
  }

  /**
   * Rollback
   */
  rollback(
    listing: MasterListing,
  ) {
    this.engine.replaceListing(
      structuredClone(listing),
    );

    this.engine.markDirty(false);
  }

  /**
   * Export Snapshot
   */
  snapshot(): MasterListing {
    return structuredClone(
      this.engine.listing,
    );
  }
}