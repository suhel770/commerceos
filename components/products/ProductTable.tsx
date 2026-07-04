import {
  Search,
  Filter,
  Download,
} from "lucide-react";

import { products } from "@/lib/data/products";
import ProductCard from "./ProductCard";

export default function ProductTable() {
  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

      {/* Toolbar */}

      <div className="flex flex-col gap-5 border-b border-slate-200 p-6 lg:flex-row lg:items-center lg:justify-between">

        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Product Catalog
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {products.length} Products across all marketplaces
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              placeholder="Search products..."
              className="h-11 w-72 rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
            />

          </div>

          <button className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium transition hover:bg-slate-50">
            <Filter size={17} />
            Filter
          </button>

          <button className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium transition hover:bg-slate-50">
            <Download size={17} />
            Export
          </button>

        </div>

      </div>

      <div className="divide-y divide-slate-200">

        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
          />
        ))}

      </div>

    </div>
  );
}