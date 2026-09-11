"use client";

import { useEffect, useState } from "react";

import type { Product } from "@/lib/types/product";

import { getAllProducts } from "@/lib/services/product.service";
import type { ProductFilters } from "@/lib/types/product-filter";

export function useProducts(
  filters?: ProductFilters,
  refreshTrigger?: number
) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);

      try {
        const data = await getAllProducts(filters);

        setProducts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, [filters, refreshTrigger]);

  return {
    products,
    loading,
  };
}