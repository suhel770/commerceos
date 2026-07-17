import type { Product } from "@/lib/types/product";
import { productRepository } from "@/lib/repositories/product.repository";

import type { ProductFilters } from "@/lib/types/product-filter";



export async function getAllProducts(
  filters?: ProductFilters
): Promise<Product[]> {
  const products = await productRepository.findAll();

  if (!filters) {
    return products;
  }

  let filtered = [...products];

  // Search
  if (filters.search.trim()) {
    const query = filters.search.trim().toLowerCase();

    filtered = filtered.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.brand.toLowerCase().includes(query)
    );
  }

  // Marketplace
  if (filters.marketplace !== "all") {
    filtered = filtered.filter((product) =>
      product.listings.some(
        (listing) =>
          listing.marketplace.toLowerCase() ===
          filters.marketplace.toLowerCase()
      )
    );
  }

  // Category
  if (filters.category !== "all") {
    filtered = filtered.filter(
      (product) =>
        product.category.toLowerCase() ===
        filters.category.toLowerCase()
    );
  }

  // Status
  if (filters.status !== "all") {
    filtered = filtered.filter(
      (product) =>
        product.status.toLowerCase() ===
        filters.status.toLowerCase()
    );
  }

  return filtered;
}

export async function getProductById(id: string) {
  return productRepository.findById(id);
}