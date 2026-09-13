import { MarketplaceName, type MasterListing } from "@/lib/types/master-listing";
import { getMarketplaceAdapter } from "@/lib/marketplace/adapters/generic.adapter";
import { categoryMappingService } from "@/lib/marketplace/taxonomy/category-mapping.service";
import { marketplaceConnectionService } from "@/lib/marketplace/connection/connection.service";
import { getMarketplaceRegistry } from "@/lib/marketplace/registry/marketplace-registry";
import { brandApprovalService } from "@/lib/services/brand-approval.service";

export interface ChannelReadinessScore {
  marketplace: MarketplaceName;
  marketplaceName: string;
  isConnected: boolean;
  score: number; // 0 to 100
  status: "READY" | "ACTION_REQUIRED" | "NOT_CONFIGURED" | "NOT_CONNECTED";
  categoryMapped: boolean;
  mappedCategoryName?: string;
  brandApproved?: boolean;
  blockers: string[];
  warnings: string[];
  attributesComplete: number; // count
  attributesRequired: number; // count
}

export class ChannelReadinessService {
  /**
   * Computes genuine, real-data channel readiness across all supported marketplaces.
   */
  async computeAllChannelsReadiness(
    workspaceId: string,
    listing: MasterListing,
  ): Promise<ChannelReadinessScore[]> {
    const connections = await marketplaceConnectionService.getConnections(workspaceId);
    const activeConnectionMap = new Map(
      connections
        .filter((c) => c.enabled)
        .map((c) => [String(c.marketplace).toLowerCase(), c]),
    );

    const channels: MarketplaceName[] = [
      MarketplaceName.AMAZON,
      MarketplaceName.FLIPKART,
      MarketplaceName.MEESHO,
      MarketplaceName.MYNTRA,
      MarketplaceName.AJIO,
      MarketplaceName.SHOPIFY,
    ];

    const results: ChannelReadinessScore[] = [];

    for (const channel of channels) {
      const registry = getMarketplaceRegistry(channel);
      const isConnected = activeConnectionMap.has(String(channel).toLowerCase());
      const adapter = getMarketplaceAdapter(channel);

      // 1. Adapter validation
      const validation = adapter.readiness(listing);
      const blockers = validation.blockers.map((b) => b.description || b.title);
      const warnings = validation.warnings.map((w) => w.description || w.title);

      // 2. Category mapping validation
      const mapping = await categoryMappingService.resolveMapping(
        workspaceId,
        listing.identity.category || "",
        channel,
      );

      const categoryMapped = Boolean(mapping && mapping.marketplaceCategoryId);
      if (!categoryMapped) {
        blockers.push(`Category '${listing.identity.category}' is not mapped to ${registry.name} taxonomy.`);
      }

      // 3. Brand authorization validation
      const brandApproved = brandApprovalService.isBrandApproved(listing.identity.brand, channel);
      if (!brandApproved && isConnected) {
        if (channel === MarketplaceName.AMAZON) {
          blockers.push(`Brand Approval required for '${listing.identity.brand}' on Amazon (Error 5665).`);
        } else if (channel === MarketplaceName.FLIPKART) {
          blockers.push(`Brand Authorization Letter required for '${listing.identity.brand}' on Flipkart.`);
        }
      } else if (!brandApproved) {
        if (channel === MarketplaceName.AMAZON) {
          warnings.push(`Brand '${listing.identity.brand}' will require Amazon Brand Approval (Error 5665) upon connection.`);
        } else if (channel === MarketplaceName.FLIPKART) {
          warnings.push(`Brand '${listing.identity.brand}' will require Flipkart Brand Authorization upon connection.`);
        }
      }

      // 4. Score calculation
      let score = validation.score;
      if (!categoryMapped) {
        score = Math.max(0, score - 25);
      }

      // 5. Status determination
      let status: ChannelReadinessScore["status"] = "ACTION_REQUIRED";
      if (!isConnected) {
        status = "NOT_CONNECTED";
      } else if (score >= 90 && blockers.length === 0) {
        status = "READY";
      } else if (!listing.identity.productName || !listing.identity.sku) {
        status = "NOT_CONFIGURED";
      } else {
        status = "ACTION_REQUIRED";
      }

      results.push({
        marketplace: channel,
        marketplaceName: registry.name,
        isConnected,
        score,
        status,
        categoryMapped,
        mappedCategoryName: mapping?.marketplaceCategoryName,
        brandApproved,
        blockers,
        warnings,
        attributesComplete: listing.attributes.length,
        attributesRequired: 5,
      });
    }

    return results;
  }
}

export const channelReadinessService = new ChannelReadinessService();
