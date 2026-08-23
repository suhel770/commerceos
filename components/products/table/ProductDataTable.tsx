"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Package, ArrowRight, Plus } from "lucide-react";
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
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  const allSelected = useMemo(() => {
    if (products.length === 0) return false;
    return selectedProducts.length === products.length;
  }, [products, selectedProducts]);

  const toggleProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      }
      return [...prev, productId];
    });
  };

  const toggleAllProducts = () => {
    if (allSelected) {
      setSelectedProducts([]);
      return;
    }
    setSelectedProducts(products.map((product) => product.id));
  };

  if (loading) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-6 text-center text-slate-500 shadow-2xs">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mb-3" />
        <p className="text-xs font-semibold text-slate-600">Loading sellable product catalog...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-2xs">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 mb-4">
          <Package className="h-6 w-6" />
        </div>

        <h2 className="text-base font-bold text-slate-900">
          No sellable products available
        </h2>

        <p className="mt-1.5 max-w-md text-xs font-medium text-slate-500">
          Products appear here when their SKU is approved as sellable in Inventory and received in Storage.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/inventory"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            Go to Inventory <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/storage"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            Check Storage Receiving
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {selectedProducts.length > 0 && (
        <BulkActionBar
          selectedCount={selectedProducts.length}
          onClear={() => setSelectedProducts([])}
        />
      )}

      <div className="overflow-x-auto rounded-2xl border border-slate-200/90 bg-white shadow-2xs">
        <table className="w-full border-collapse">
          <ProductTableHeader
            allSelected={allSelected}
            onToggleAll={toggleAllProducts}
          />

          <tbody className="divide-y divide-slate-100">
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