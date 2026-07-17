export interface Product {
  id: string;
  slug: string;

  /* Identity */
  name: string;
  brand: string;
  sku: string;
  image: string;

  category: string;
  subCategory?: string;
  productType?: string;

  status:
    | "Active"
    | "Draft"
    | "Archived"
    | "Inactive"
    | "Out of Stock";

  hsn?: string;
  gtin?: string;
  manufacturer?: string;
  countryOfOrigin?: string;

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
    mrp: number;
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

  aiRecommendations: AIRecommendation[];
  listings: MarketplaceListing[];

  createdAt: string;
  updatedAt: string;
}