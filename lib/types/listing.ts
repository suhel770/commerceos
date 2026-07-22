import { MarketplaceId } from "../marketplace/registry";

export type ListingStatus =
  | "Draft"
  | "Live"
  | "Inactive"
  | "Error";

export interface MarketplaceListing {

  id: string;

  marketplace: MarketplaceId;

  listingId?: string;

  sku?: string;

  title: string;

  sellingPrice: number;

  mrp?: number;

  stockSync: boolean;

  status: ListingStatus;

  lastSyncedAt?: Date;
}