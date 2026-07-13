export interface Product {
  /* Identity */

  id: string;

  slug: string;

  sku: string;

  name: string;

  image: string;

  category: string;

  status: "Active" | "Draft" | "Archived";

  /* Inventory */

  inventory: {
    available: number;
    reserved: number;
    incoming: number;
  };

  /* Pricing */

  pricing: {
    costPrice: number;
    sellingPrice: number;
    profit: number;
    margin: number;
  };

  /* Performance */

  performance: {
    ordersToday: number;
    revenueToday: number;
    returnsPercentage: number;
    healthScore: number;
  };

  /* AI */

  aiRecommendations: AIRecommendation[];

  /* Marketplace Listings */

  listings: MarketplaceListing[];

  createdAt: string;

  updatedAt: string;
}

export interface MarketplaceListing {
  /* Identity */

  id: string;

  marketplace: string;

  title: string;

  marketplaceSku: string;

  /* Marketplace Specific ID */

  listingIdLabel: string;

  listingId: string;

  /* Pricing */

  sellingPrice: number;

  /* Inventory */

  availableStock: number;

  /* Orders */

  orders30Days: number;

  revenue30Days: number;

  /* Listing */

  status: string;

  listingStatus: "Live" | "Draft" | "Inactive";

  stockSync: boolean;

  lastSync: string;

  /* Future */

  healthScore?: number;

  buyBoxPercentage?: number;

  marketplaceUrl?: string;
}

export interface AIRecommendation {
  id: string;

  type:
    | "pricing"
    | "listing"
    | "inventory"
    | "seo";

  message: string;

  priority:
    | "low"
    | "medium"
    | "high";
}