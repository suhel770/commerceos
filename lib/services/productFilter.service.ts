import type { Product } from "@/lib/types/product";
import type { ProductFilters } from "@/lib/types/product-filter";
import { calculateProductHealth } from "@/lib/products/health-score";
import { getUniversalProductId } from "@/lib/products/product-id-utils";

function inRange(
  value: number,
  range?: { min?: number; max?: number }
) {
  if (!range) return true;
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
    // 1. Search filter across Name, SKU, Product ID (PRD-), Brand, Category
    if (filters.search && filters.search.trim()) {
      const query = filters.search.toLowerCase().trim();
      const prdId = getUniversalProductId(product).toLowerCase();
      const name = (product.name || "").toLowerCase();
      const sku = (product.sku || "").toLowerCase();
      const brand = (product.brand || "").toLowerCase();
      const category = (product.category || "").toLowerCase();

      const matchesSearch =
        name.includes(query) ||
        sku.includes(query) ||
        prdId.includes(query) ||
        brand.includes(query) ||
        category.includes(query);

      if (!matchesSearch) {
        return false;
      }
    }

    // 2. Marketplace filter
    if (filters.marketplace && filters.marketplace !== "all") {
      const listings = product.listings || [];
      const hasMarketplace = listings.some(
        (listing) =>
          listing.marketplace &&
          listing.marketplace.toLowerCase() === filters.marketplace.toLowerCase()
      );

      if (!hasMarketplace) {
        return false;
      }
    }

    // 3. Category filter
    if (filters.category && filters.category !== "all") {
      const cat = (product.category || "").toLowerCase().trim();
      if (cat !== filters.category.toLowerCase().trim()) {
        return false;
      }
    }

    // 4. Status filter (Active, Draft, Inactive, Archived)
    if (filters.status && filters.status !== "all") {
      const st = (product.status || "").toLowerCase().trim();
      if (st !== filters.status.toLowerCase().trim()) {
        return false;
      }
    }

    // 5. Brands filter
    if (filters.brands && filters.brands.length > 0) {
      const brand = (product.brand || "").toLowerCase().trim();
      if (!filters.brands.some((b) => b.toLowerCase().trim() === brand)) {
        return false;
      }
    }

    // 6. Price & margin ranges
    const sellingPrice = product.pricing?.sellingPrice ?? 0;
    const costPrice = product.pricing?.costPrice ?? 0;
    const margin = product.pricing?.margin ?? 0;
    const available = product.inventory?.available ?? 0;

    if (
      !inRange(sellingPrice, filters.sellingPrice) ||
      !inRange(costPrice, filters.costPrice) ||
      !inRange(margin, filters.profitMargin) ||
      !inRange(available, filters.stockQuantity)
    ) {
      return false;
    }

    // 7. Stock status filter (in-stock, low-stock, out-of-stock)
    if (filters.stockStatus && filters.stockStatus.length > 0) {
      const stockStatus =
        available === 0
          ? "out-of-stock"
          : available <= 10
            ? "low-stock"
            : "in-stock";

      if (!filters.stockStatus.includes(stockStatus)) {
        return false;
      }
    }

    // 8. Marketplace count filter
    if (filters.marketplaceCount && filters.marketplaceCount.length > 0) {
      const counts = filters.marketplaceCount.map(Number);
      const listingsCount = (product.listings || []).length;
      const matchesCount = counts.some(
        (count) => (count === 1 ? listingsCount === 1 : listingsCount >= count)
      );

      if (!matchesCount) {
        return false;
      }
    }

    // 9. Product Health score filter
    if (filters.productHealth && filters.productHealth.length > 0) {
      const score = product.performance?.healthScore ?? calculateProductHealth(product).score;
      const health =
        score >= 90
          ? "excellent"
          : score >= 75
            ? "good"
            : "attention";

      if (!filters.productHealth.includes(health)) {
        return false;
      }
    }

    return true;
  });
}