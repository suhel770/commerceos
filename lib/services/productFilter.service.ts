import type { Product } from "@/lib/types/product";

export interface ProductFilters {
  search: string;
  marketplace: string;
  category: string;
  status: string;
}

export function filterProducts(
  products: Product[],
  filters: ProductFilters
): Product[] {
  return products.filter((product) => {
    // Search
    if (filters.search.trim()) {
      const query = filters.search.toLowerCase();

      const matchesSearch =
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query);

      if (!matchesSearch) {
        return false;
      }
    }

    // Marketplace
    if (filters.marketplace !== "all") {
      const hasMarketplace = product.listings.some(
        (listing) =>
          listing.marketplace.toLowerCase() ===
          filters.marketplace.toLowerCase()
      );

      if (!hasMarketplace) {
        return false;
      }
    }

    // Category
    if (filters.category !== "all") {
      if (
        product.category.toLowerCase() !==
        filters.category.toLowerCase()
      ) {
        return false;
      }
    }

    // Status
    if (filters.status !== "all") {
      if (
        product.status.toLowerCase() !==
        filters.status.toLowerCase()
      ) {
        return false;
      }
    }

    return true;
  });
}