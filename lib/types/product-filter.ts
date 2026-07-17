export interface ProductRangeFilter {
  min?: number;
  max?: number;
}

export interface ProductFilters {
  // Toolbar
  search: string;
  marketplace: string;
  category: string;
  status: string;

  // More Filters
  brands: string[];

  sellingPrice: ProductRangeFilter;

  costPrice: ProductRangeFilter;

  profitMargin: ProductRangeFilter;

  stockQuantity: ProductRangeFilter;

  stockStatus: string[];

  marketplaceCount: string[];

  productHealth: string[];
}

export const defaultProductFilters: ProductFilters = {
  search: "",
  marketplace: "all",
  category: "all",
  status: "all",

  brands: [],

  sellingPrice: {},

  costPrice: {},

  profitMargin: {},

  stockQuantity: {},

  stockStatus: [],

  marketplaceCount: [],

  productHealth: [],
};