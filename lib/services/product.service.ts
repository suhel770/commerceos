import type { Product } from "@/lib/types/product";
import type { ProductFilters } from "@/lib/types/product-filter";
import { filterProducts } from "@/lib/services/productFilter.service";
import { safeResponseJson } from "@/lib/api/client";

export async function getAllProducts(
  filters?: ProductFilters
): Promise<Product[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.search) params.set("search", filters.search);
    if (filters?.category && filters.category !== "all") params.set("category", filters.category);
    if (filters?.status && filters.status !== "all") params.set("status", filters.status);

    const res = await fetch(`/api/v1/products${params.toString() ? `?${params.toString()}` : ""}`);
    const payload = await safeResponseJson(res);
    const list: Product[] =
      payload?.success && Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : [];

    if (!filters) return list;
    return filterProducts(list, filters);
  } catch {
    return [];
  }
}

export async function getProductById(
  id: string
): Promise<Product | undefined> {
  try {
    const res = await fetch(`/api/v1/products/${id}`);
    const payload = await safeResponseJson(res);
    return payload?.success ? payload.data : undefined;
  } catch {
    return undefined;
  }
}