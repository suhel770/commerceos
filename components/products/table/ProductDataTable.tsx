"use client";

import { useMemo, useState } from "react";

import { Product } from "@/lib/types/product";

import ProductTableHeader from "./ProductTableHeader";
import ProductRow from "./ProductRow";
import BulkActionBar from "./BulkActionBar";

interface ProductDataTableProps {
  products: Product[];
  loading?: boolean;
}

export default function ProductDataTable({
  products,
  loading = false,
}: ProductDataTableProps) {
  const [selectedProducts, setSelectedProducts] =
    useState<string[]>([]);

  const allSelected = useMemo(() => {
    if (products.length === 0) return false;

    return (
      selectedProducts.length === products.length
    );
  }, [products, selectedProducts]);

  const toggleProduct = (productId: string) => {
    setSelectedProducts((previous) => {
      if (previous.includes(productId)) {
        return previous.filter(
          (id) => id !== productId
        );
      }

      return [...previous, productId];
    });
  };

  const toggleAllProducts = () => {
    if (allSelected) {
      setSelectedProducts([]);
      return;
    }

    setSelectedProducts(
      products.map((product) => product.id)
    );
  };

    if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500">
        Loading products...
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold text-slate-900">
          No Products Found
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Connect a marketplace or create your first product.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">

        {selectedProducts.length > 0 && (
          <BulkActionBar
            selectedCount={selectedProducts.length}
            onClear={() => setSelectedProducts([])}
          />
        )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

        <table className="w-full border-collapse">

          <ProductTableHeader
            allSelected={allSelected}
            onToggleAll={toggleAllProducts}
          />

          <tbody>

            {products.map((product) => (
              <ProductRow
                key={product.id}
                product={product}
                selected={selectedProducts.includes(product.id)}
                onToggle={() => toggleProduct(product.id)}
              />
            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}