"use client";

import type { Product } from "@/lib/types/product";

import TopMetadataStrip from "./TopMetadataStrip";
import ProductGallery from "./ProductGallery";
import ProductSummary from "./ProductSummary";
import ProductActions from "./ProductActions";

interface HeroWorkspaceProps {
  product: Product;
}

export default function HeroWorkspace({
  product,
}: HeroWorkspaceProps) {
  return (
    <section className="space-y-4">

      {/* Top Metadata Strip */}

      <TopMetadataStrip product={product} />

      {/* Hero */}

      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
        "
      >
        <div
          className="
            grid
            grid-cols-[360px_minmax(0,1fr)_340px]
          "
        >
          {/* Gallery */}

          <div className="border-r border-slate-200 p-6">

            <ProductGallery
              product={product}
            />

          </div>

          {/* Summary */}

          <div className="p-6">

            <ProductSummary
              product={product}
            />

          </div>

          {/* Actions */}

          <div className="border-l border-slate-200 bg-slate-50 p-6">

            <ProductActions
              product={product}
            />

          </div>

        </div>

      </div>

    </section>
  );
}