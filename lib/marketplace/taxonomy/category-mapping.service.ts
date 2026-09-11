import type { MarketplaceName } from "@/lib/types/master-listing";

export interface CategoryMappingResult {
  marketplace: MarketplaceName;
  commerceCategory: string;
  marketplaceCategoryId: string;
  marketplaceCategoryName: string;
  marketplaceVertical: string;
  confidenceScore: number;
  isAutomatic: boolean;
}

/**
 * Standard baseline marketplace vertical mappings for common retail categories.
 * Used for intelligent auto-suggestion when no custom workspace mapping is stored yet.
 */
const BASELINE_TAXONOMY_MAP: Record<
  string,
  Record<string, { id: string; name: string; vertical: string }>
> = {
  "kids sandals": {
    AMAZON: { id: "amzn.cat.shoes.sandals.kids", name: "Kids' Sandals", vertical: "SHOES" },
    FLIPKART: { id: "flip.cat.footwear.kids_sandals", name: "Kids Sandals & Clogs", vertical: "footwear_kids" },
    MEESHO: { id: "msh.cat.kids_footwear", name: "Kids Footwear & Sandals", vertical: "kids_sandals" },
    MYNTRA: { id: "myn.cat.sandals_kids", name: "Kids Flat Sandals", vertical: "Sandals" },
    AJIO: { id: "ajio.cat.footwear.kids", name: "Kids Casual Sandals", vertical: "Footwear" },
    SHOPIFY: { id: "shopify.cat.apparel_footwear", name: "Apparel & Accessories > Shoes", vertical: "shoes" },
    WOOCOMMERCE: { id: "woo.cat.kids_shoes", name: "Kids > Footwear", vertical: "clothing" },
    ONDC: { id: "ondc.ret.12.kids_footwear", name: "ONDC Fashion > Kids Footwear", vertical: "footwear" },
  },
  "footwear": {
    AMAZON: { id: "amzn.cat.shoes.general", name: "Shoes & Handbags", vertical: "SHOES" },
    FLIPKART: { id: "flip.cat.footwear.general", name: "Footwear", vertical: "footwear" },
    MEESHO: { id: "msh.cat.footwear", name: "Footwear", vertical: "footwear" },
    MYNTRA: { id: "myn.cat.footwear", name: "Footwear", vertical: "Footwear" },
    AJIO: { id: "ajio.cat.footwear", name: "Footwear", vertical: "Footwear" },
    SHOPIFY: { id: "shopify.cat.shoes", name: "Shoes", vertical: "shoes" },
    WOOCOMMERCE: { id: "woo.cat.shoes", name: "Shoes", vertical: "clothing" },
    ONDC: { id: "ondc.ret.12.footwear", name: "ONDC Fashion > Footwear", vertical: "footwear" },
  },
  "apparel": {
    AMAZON: { id: "amzn.cat.apparel.general", name: "Clothing & Accessories", vertical: "APPAREL" },
    FLIPKART: { id: "flip.cat.clothing.general", name: "Clothing", vertical: "clothing" },
    MEESHO: { id: "msh.cat.clothing", name: "Women/Men Clothing", vertical: "apparel" },
    MYNTRA: { id: "myn.cat.apparel", name: "Apparel", vertical: "Apparel" },
    AJIO: { id: "ajio.cat.clothing", name: "Clothing", vertical: "Clothing" },
    SHOPIFY: { id: "shopify.cat.apparel", name: "Apparel & Accessories", vertical: "apparel" },
    WOOCOMMERCE: { id: "woo.cat.clothing", name: "Clothing", vertical: "clothing" },
    ONDC: { id: "ondc.ret.12.apparel", name: "ONDC Fashion > Apparel", vertical: "apparel" },
  },
};

/**
 * Pure baseline taxonomy resolution function (Zero database dependencies, 100% safe in client bundles)
 */
export function resolveBaselineCategoryMapping(
  commerceCategory: string,
  marketplace: MarketplaceName | string,
): CategoryMappingResult {
  const cleanCat = (commerceCategory || "").trim().toLowerCase();
  const channelKey = String(marketplace).toUpperCase();

  const baseline = BASELINE_TAXONOMY_MAP[cleanCat]?.[channelKey];
  if (baseline) {
    return {
      marketplace: marketplace as MarketplaceName,
      commerceCategory,
      marketplaceCategoryId: baseline.id,
      marketplaceCategoryName: baseline.name,
      marketplaceVertical: baseline.vertical,
      confidenceScore: 0.95,
      isAutomatic: true,
    };
  }

  // Fuzzy match root category (e.g. "Kids Footwear" -> "footwear")
  for (const [key, mapping] of Object.entries(BASELINE_TAXONOMY_MAP)) {
    if (cleanCat.includes(key) && mapping[channelKey]) {
      const match = mapping[channelKey]!;
      return {
        marketplace: marketplace as MarketplaceName,
        commerceCategory,
        marketplaceCategoryId: match.id,
        marketplaceCategoryName: match.name,
        marketplaceVertical: match.vertical,
        confidenceScore: 0.85,
        isAutomatic: true,
      };
    }
  }

  // Generic Fallback
  return {
    marketplace: marketplace as MarketplaceName,
    commerceCategory,
    marketplaceCategoryId: `cat.${channelKey.toLowerCase()}.${cleanCat.replace(/\s+/g, "_") || "general"}`,
    marketplaceCategoryName: commerceCategory || "General Merchandise",
    marketplaceVertical: "GENERAL_MERCHANDISE",
    confidenceScore: 0.5,
    isAutomatic: true,
  };
}

export class CategoryMappingService {
  /**
   * Resolves category mapping for a given CommerceOS category and marketplace.
   * Checks database first if on server, falls back to baseline taxonomy engine.
   */
  async resolveMapping(
    workspaceId: string,
    commerceCategory: string,
    marketplace: MarketplaceName | string,
  ): Promise<CategoryMappingResult | null> {
    const channelKey = String(marketplace).toUpperCase();

    // 1. Query Database if running in server environment
    if (typeof window === "undefined") {
      try {
        const { db } = await import("@/lib/db");
        if ((db as any)?.marketplaceCategoryMapping) {
          const dbMapping = await (db as any).marketplaceCategoryMapping.findUnique({
            where: {
              workspaceId_commerceCategory_marketplace: {
                workspaceId,
                commerceCategory,
                marketplace: channelKey as any,
              },
            },
          }).catch(() => null);

          if (dbMapping) {
            return {
              marketplace: marketplace as MarketplaceName,
              commerceCategory,
              marketplaceCategoryId: dbMapping.marketplaceCategoryId,
              marketplaceCategoryName: dbMapping.marketplaceCategoryName,
              marketplaceVertical: dbMapping.marketplaceVertical,
              confidenceScore: dbMapping.confidenceScore,
              isAutomatic: false,
            };
          }
        }
      } catch {
        // Graceful fallback to baseline taxonomy
      }
    }

    // 2. Baseline Taxonomy Resolution
    return resolveBaselineCategoryMapping(commerceCategory, marketplace);
  }

  /**
   * Persists a custom category mapping for a tenant workspace.
   */
  async saveMapping(
    workspaceId: string,
    commerceCategory: string,
    marketplace: MarketplaceName | string,
    mappingData: {
      marketplaceCategoryId: string;
      marketplaceCategoryName: string;
      marketplaceVertical: string;
    },
  ): Promise<void> {
    if (typeof window !== "undefined") return;
    const channelKey = String(marketplace).toUpperCase();
    const { db } = await import("@/lib/db");

    await (db as any).marketplaceCategoryMapping?.upsert({
      where: {
        workspaceId_commerceCategory_marketplace: {
          workspaceId,
          commerceCategory,
          marketplace: channelKey as any,
        },
      },
      create: {
        workspaceId,
        commerceCategory,
        marketplace: channelKey as any,
        marketplaceCategoryId: mappingData.marketplaceCategoryId,
        marketplaceCategoryName: mappingData.marketplaceCategoryName,
        marketplaceVertical: mappingData.marketplaceVertical,
        status: "MAPPED",
        confidenceScore: 1.0,
      },
      update: {
        marketplaceCategoryId: mappingData.marketplaceCategoryId,
        marketplaceCategoryName: mappingData.marketplaceCategoryName,
        marketplaceVertical: mappingData.marketplaceVertical,
        status: "MAPPED",
        confidenceScore: 1.0,
      },
    });
  }
}

export const categoryMappingService = new CategoryMappingService();
