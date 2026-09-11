import type { MarketplaceName } from "@/lib/types/master-listing";

export type MarketplaceCategoryType = "MARKETPLACE" | "STORE" | "NETWORK" | "B2B";
export type MarketplaceAuthType = "OAUTH2" | "API_KEY" | "TOKEN_SECRET" | "BASIC";

export type MarketplaceCapability =
  | "CATALOG_PUBLISH"
  | "CATALOG_UPDATE"
  | "PRICE_SYNC"
  | "INVENTORY_SYNC"
  | "ORDER_SYNC"
  | "ORDER_FULFILLMENT"
  | "RETURN_MANAGEMENT"
  | "BUY_BOX_MONITORING"
  | "IMAGE_HOSTING";

export interface MarketplaceRegistryDefinition {
  code: MarketplaceName;
  name: string;
  countryCode: string;
  category: MarketplaceCategoryType;
  logoUrl?: string;
  documentationUrl?: string;
  capabilities: MarketplaceCapability[];
  authType: MarketplaceAuthType;
  active: boolean;
  supportedRegions: string[];
  requiresSellerId: boolean;
  requiresBrandApproval: boolean;
  requiresGstCompliance: boolean;
  defaultTaxRate?: number;
}
