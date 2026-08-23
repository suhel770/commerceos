import type { MarketplaceName } from "@/lib/types/master-listing";
import type { MarketplacePublishPayload } from "@/lib/marketplace/adapters/types";

export interface MarketplacePublishResult {
  marketplace: MarketplaceName;
  externalId: string;
  listingUrl?: string;
  raw?: Record<string, unknown>;
}

export interface MarketplaceSyncResult {
  marketplace: MarketplaceName;
  ok: boolean;
  syncedAt: string;
  message?: string;
}

export interface MarketplaceConnector {
  marketplace: MarketplaceName;
  publish(
    payload: MarketplacePublishPayload,
  ): Promise<MarketplacePublishResult>;
  syncPrice(
    externalId: string,
    price: number,
  ): Promise<MarketplaceSyncResult>;
  syncInventory(
    externalId: string,
    quantity: number,
  ): Promise<MarketplaceSyncResult>;
}
