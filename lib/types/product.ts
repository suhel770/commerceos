export type ProductStatus =
  | "Active"
  | "Draft"
  | "Inactive"
  | "Archived"
  | "Out of Stock";

export interface Product {
  /* -------------------------------------------------------------------------- */
  /* Identity */
  /* -------------------------------------------------------------------------- */

  id: string;

  slug: string;

  sku: string;

  name: string;

  brand: string;

  image: string;

  status: ProductStatus;

  /* -------------------------------------------------------------------------- */
  /* Classification */
  /* -------------------------------------------------------------------------- */

  category: string;

  subCategory?: string;

  productType?: string;

  department?: string;

  collection?: string;

  tags?: string[];

  /* -------------------------------------------------------------------------- */
  /* Compliance */
  /* -------------------------------------------------------------------------- */

  hsn?: string;

  gstRate?: number;

  countryOfOrigin?: string;

  manufacturer?: string;

  manufacturerAddress?: string;

  /* -------------------------------------------------------------------------- */
  /* Description */
  /* -------------------------------------------------------------------------- */

  shortDescription?: string;

  description?: string;

  bulletPoints?: string[];

  /* -------------------------------------------------------------------------- */
  /* Media */
  /* -------------------------------------------------------------------------- */

  gallery?: string[];

  video?: string;

  /* -------------------------------------------------------------------------- */
  /* Inventory */
  /* -------------------------------------------------------------------------- */

  inventory: {
    available: number;

    reserved: number;

    incoming: number;
  };

  /* -------------------------------------------------------------------------- */
  /* Pricing */
  /* -------------------------------------------------------------------------- */

  pricing: {
    costPrice: number;

    sellingPrice: number;

    mrp: number;

    profit: number;

    margin: number;
  };

  /* -------------------------------------------------------------------------- */
  /* Performance */
  /* -------------------------------------------------------------------------- */

  performance: {
    ordersToday: number;

    revenueToday: number;

    returnsPercentage: number;

    healthScore: number;
  };

  /* -------------------------------------------------------------------------- */
  /* AI */
  /* -------------------------------------------------------------------------- */

  aiRecommendations: AIRecommendation[];

  /* -------------------------------------------------------------------------- */
  /* Marketplace */
  /* -------------------------------------------------------------------------- */

  listings: MarketplaceListing[];

  /* -------------------------------------------------------------------------- */
  /* Audit */
  /* -------------------------------------------------------------------------- */

  createdAt: string;

  updatedAt: string;
}

export interface MarketplaceListing {
  id: string;

  marketplace: string;

  title: string;

  marketplaceSku: string;

  listingIdLabel: string;

  listingId: string;

  sellingPrice: number;

  availableStock: number;

  orders30Days: number;

  revenue30Days: number;

  status: string;

  listingStatus: "Live" | "Draft" | "Inactive";

  stockSync: boolean;

  lastSync: string;

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
    | "seo"
    | "marketing"
    | "content"
    | "compliance";

  message: string;

  priority: "low" | "medium" | "high";
}