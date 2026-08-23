import type { MarketplaceName } from "@/lib/types/master-listing";
import type { MarketplacePublishPayload } from "@/lib/marketplace/adapters/types";

import type {
  MarketplaceConnector,
  MarketplacePublishResult,
  MarketplaceSyncResult,
} from "./types";

function externalIdFor(
  marketplace: MarketplaceName,
  sku: string,
): string {
  const token = sku.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase();

  switch (marketplace) {
    case "amazon":
      return `B0${token.padEnd(8, "X").slice(0, 8)}`;
    case "flipkart":
      return `FSN${token.padEnd(10, "0").slice(0, 10)}`;
    case "meesho":
      return `MSH${token.padEnd(8, "0").slice(0, 8)}`;
    case "shopify":
      return `gid://shopify/Product/${token || "0001"}`;
    case "ajio":
      return `AJ${token.padEnd(8, "0").slice(0, 8)}`;
    case "myntra":
      return `MYN${token.padEnd(8, "0").slice(0, 8)}`;
    default:
      return `${marketplace.toUpperCase()}-${token || "LISTING"}`;
  }
}

function createSimulatedConnector(
  marketplace: MarketplaceName,
): MarketplaceConnector {
  return {
    marketplace,

    async publish(
      payload: MarketplacePublishPayload,
    ): Promise<MarketplacePublishResult> {
      // Simulated failure path for deterministic retry testing when SKU ends with FAIL
      if (payload.externalSku.toUpperCase().endsWith("FAIL")) {
        throw new Error(
          `${marketplace} simulated API rejected SKU ${payload.externalSku}.`,
        );
      }

      const externalId = externalIdFor(
        marketplace,
        payload.externalSku,
      );

      return {
        marketplace,
        externalId,
        listingUrl: `https://commerceos.local/marketplaces/${marketplace}/listings/${externalId}`,
        raw: {
          provider: "simulated",
          title: payload.title,
          price: payload.price,
          quantity: payload.quantity,
        },
      };
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
            ? `Price synced for ${externalId}`
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
        message: `Inventory synced for ${externalId}`,
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

  const created = createSimulatedConnector(marketplace);
  connectors.set(marketplace, created);
  return created;
}
