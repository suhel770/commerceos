"use client";

import { Product } from "@/lib/types/product";
import ProductTableHeader from "./ProductTableHeader";
import ProductRow from "./ProductRow";

interface ProductDataTableProps {
  products: Product[];
  loading?: boolean;
}

export default function ProductDataTable({
  products,
  loading = false,
}: ProductDataTableProps) {
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
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      <table className="w-full border-collapse">

        <ProductTableHeader />

        <tbody>

          {products.map((product) => (

            <ProductRow
              key={product.slug}
              product={product}
            />

          ))}

        </tbody>

      </table>

    </div>
  );
}