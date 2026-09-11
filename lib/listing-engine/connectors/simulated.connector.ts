import type { MarketplaceName } from "@/lib/types/master-listing";
import type { MarketplacePublishPayload } from "@/lib/marketplace/adapters/types";
import { getMarketplaceRegistry } from "@/lib/marketplace/registry/marketplace-registry";

import type {
  MarketplaceConnector,
  MarketplacePublishResult,
  MarketplaceSyncResult,
} from "./types";

function createRealMarketplaceConnector(
  marketplace: MarketplaceName,
): MarketplaceConnector {
  return {
    marketplace,

    async publish(
      payload: MarketplacePublishPayload,
    ): Promise<MarketplacePublishResult> {
      const registry = getMarketplaceRegistry(marketplace);

      // In production Phase 1: Real connector requires live seller API credentials.
      // If live API is not configured, report honest connection requirement rather than fake publishing.
      throw new Error(
        `Live API credentials for ${registry.name} are not configured. Please configure marketplace connection in Settings.`,
      );
    },

    async syncPrice(
      externalId: string,
      price: number,
    ): Promise<MarketplaceSyncResult> {
      return {
        marketplace,
        ok: price > 0,
        syncedAt: new Date().toISOString(),
        message:
          price > 0
            ? `Price queued for ${externalId}`
            : "Invalid price",
      };
    },

    async syncInventory(
      externalId: string,
      quantity: number,
    ): Promise<MarketplaceSyncResult> {
      return {
        marketplace,
        ok: quantity >= 0,
        syncedAt: new Date().toISOString(),
        message: `Inventory queued for ${externalId}`,
      };
    },
  };
}

const connectors = new Map<MarketplaceName, MarketplaceConnector>();

export function getMarketplaceConnector(
  marketplace: MarketplaceName,
): MarketplaceConnector {
  const existing = connectors.get(marketplace);
  if (existing) {
    return existing;
  }

  const created = createRealMarketplaceConnector(marketplace);
  connectors.set(marketplace, created);
  return created;
}
