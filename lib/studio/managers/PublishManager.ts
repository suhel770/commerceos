import type {
  MarketplaceName,
} from "@/lib/types/master-listing";

import {
  MarketplacePublishStatus,
} from "@/lib/types/master-listing";

import StudioEngine from "../StudioEngine";

export interface PublishResult {
  success: boolean;

  marketplace?: MarketplaceName;

  message: string;

  publishedAt: string;
}

export default class PublishManager {
  constructor(
    private readonly engine: StudioEngine,
  ) {}

  /**
   * Publish Listing
   */
  async publish(
    marketplace?: MarketplaceName,
  ): Promise<PublishResult> {
    this.engine.markPublishing(
      true,
    );

    try {
      /**
       * Always validate first.
       */
      const validation =
        await this.engine.validate();

      if (!validation.valid) {
        throw new Error(
          "Publishing blocked because validation failed.",
        );
      }

      /**
       * Ensure latest draft is saved.
       */
      await this.engine.save();

      /**
       * Publish
       */
      const published =
        await this.engine.gateway.publish(
          this.engine.listing.id,
          marketplace,
        );

      if (!published) {
        throw new Error(
          "Published listing could not be reloaded.",
        );
      }

      this.engine.replaceListing(
        published,
      );

      /**
       * Update marketplace status
       */
      if (marketplace) {
        this.updateMarketplaceStatus(
          marketplace,
          MarketplacePublishStatus.PUBLISHED,
        );
      }

      const publishedAt =
        new Date().toISOString();

      this.engine.activity.record({
        type: "listing.published",

        title: marketplace
          ? `${marketplace} Published`
          : "Listing Published",

        description: marketplace
          ? `Listing published to ${marketplace}.`
          : "Listing published successfully.",

        timestamp: publishedAt,
      });

      return {
        success: true,

        marketplace,

        message:
          "Published successfully.",

        publishedAt,
      };
    } catch (error) {
      this.engine.activity.record({
        type: "listing.publish.failed",

        title:
          "Publishing Failed",

        description:
          error instanceof Error
            ? error.message
            : "Unknown publishing error.",

        timestamp:
          new Date().toISOString(),
      });

      throw error;
    } finally {
      this.engine.markPublishing(
        false,
      );
    }
  }

  /**
   * Publish to all connected marketplaces
   */
  async publishAll() {
    const marketplaces =
      this.engine.listing.marketplaces;

    const results: PublishResult[] =
      [];

    for (const connection of marketplaces) {
      if (!connection.enabled) {
        continue;
      }

      results.push(
        await this.publish(
          connection.marketplace,
        ),
      );
    }

    return results;
  }

  /**
   * Update marketplace publish state
   */
  private updateMarketplaceStatus(
    marketplace: MarketplaceName,
    status: MarketplacePublishStatus,
  ) {
    const updated =
      this.engine.listing.marketplaces.map(
        (connection) =>
          connection.marketplace ===
          marketplace
            ? {
                ...connection,

                publishStatus:
                  status,

                lastSyncedAt:
                  new Date().toISOString(),
              }
            : connection,
      );

    this.engine.draft.update({
      marketplaces: updated,
    });
  }

  /**
   * Check whether listing can publish
   */
  async canPublish() {
    const validation =
      await this.engine.validate();

    return validation.valid;
  }
}   