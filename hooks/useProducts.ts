"use client";

import { useEffect, useState } from "react";

import { Product } from "@/lib/types/product";
import { productRepository } from "@/lib/repositories/product.repository";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data =
          await productRepository.findAll();

        setProducts(data);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return {
    products,
    loading,
  };
}