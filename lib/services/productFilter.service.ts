import type { Product } from "@/lib/types/product";
import type { ProductFilters } from "@/lib/types/product-filter";

function inRange(
  value: number,
  range: ProductFilters["sellingPrice"],
) {
  return (
    (range.min === undefined || value >= range.min) &&
    (range.max === undefined || value <= range.max)
  );
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

    if (
      filters.brands.length > 0 &&
      !filters.brands.some(
        (brand) =>
          brand.toLowerCase() ===
          product.brand.toLowerCase(),
      )
    ) {
      return false;
    }

    if (
      !inRange(
        product.pricing.sellingPrice,
        filters.sellingPrice,
      ) ||
      !inRange(
        product.pricing.costPrice,
        filters.costPrice,
      ) ||
      !inRange(
        product.pricing.margin,
        filters.profitMargin,
      ) ||
      !inRange(
        product.inventory.available,
        filters.stockQuantity,
      )
    ) {
      return false;
    }

    if (filters.stockStatus.length > 0) {
      const available =
        product.inventory.available;
      const stockStatus =
        available === 0
          ? "out-of-stock"
          : available <= 20
            ? "low-stock"
            : "in-stock";

      if (
        !filters.stockStatus.includes(
          stockStatus,
        )
      ) {
        return false;
      }
    }

    if (filters.marketplaceCount.length > 0) {
      const counts =
        filters.marketplaceCount.map(Number);
      const matchesCount = counts.some(
        (count) =>
          count === 1
            ? product.listings.length === 1
            : product.listings.length >= count,
      );

      if (!matchesCount) {
        return false;
      }
    }

    if (filters.productHealth.length > 0) {
      const score =
        product.performance.healthScore;
      const health =
        score >= 90
          ? "excellent"
          : score >= 75
            ? "good"
            : "attention";

      if (
        !filters.productHealth.includes(
          health,
        )
      ) {
        return false;
      }
    }

    return true;
  });
}