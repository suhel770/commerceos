"use client";

import type { Product } from "@/lib/types/product";
import type { ProductWorkspaceNavigate } from "../types";

import TopMetadataStrip from "./TopMetadataStrip";
import ProductGallery from "./ProductGallery";
import ProductSummary from "./ProductSummary";
import ProductActions from "./ProductActions";

interface HeroWorkspaceProps {
  product: Product;
  onNavigate: ProductWorkspaceNavigate;
}

export default function HeroWorkspace({
  product,
  onNavigate,
}: HeroWorkspaceProps) {
  return (
    <section className="space-y-4">
      <TopMetadataStrip product={product} />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-[300px_minmax(0,1fr)_280px]">
          <div className="border-r border-slate-200 p-5">
            <ProductGallery product={product} />
          </div>

          <div className="min-w-0 p-5">
            <ProductSummary product={product} onNavigate={onNavigate} />
          </div>

          <div className="border-l border-slate-200 bg-slate-50 p-5">
            <ProductActions product={product} onNavigate={onNavigate} />
          </div>
        </div>
      </div>
    </section>
  );
}
