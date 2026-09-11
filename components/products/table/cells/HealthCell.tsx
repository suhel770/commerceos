"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { calculateProductHealth } from "@/lib/products/health-score";
import type { Product } from "@/lib/types/product";
import { HoverCard, HoverCardTrigger, HoverCardContent } from "@/components/ui/hover-card";

interface HealthCellProps {
  product: Product;
}

function getCheckDetail(label: string, passed: boolean, product: Product): string {
  if (label === "Product Name & Brand") {
    return passed ? `${product.name} · ${product.brand}` : "Missing name or brand";
  }
  if (label === "SKU Identifier") {
    return passed ? `SKU: ${product.sku}` : "Missing SKU";
  }
  if (label === "Category & Classification") {
    return passed ? `Category: ${product.category}` : "Missing category";
  }
  if (label === "Pricing Configured (Selling & Cost)") {
    return passed
      ? `Selling: ₹${product.pricing?.sellingPrice} · Cost: ₹${product.pricing?.costPrice}`
      : "Selling price or cost missing";
  }
  if (label === "Tax & HSN Code") {
    return passed ? `HSN: ${product.hsn}` : "Required tax information missing";
  }
  if (label === "Inventory Available (ATS > 0)") {
    return passed ? `ATS: ${product.inventory?.available}` : "Out of stock";
  }
  if (label === "Product Images & Media") {
    const galleryCount = product.gallery?.length || 0;
    const hasImage = product.image && product.image.trim().length > 0 && product.image !== "{}";
    const totalImages = galleryCount + (hasImage ? 1 : 0);
    return passed ? `${totalImages} images` : "No images configured";
  }
  if (label === "Channel / Marketplace Mapping") {
    if (passed && product.listings && product.listings.length > 0) {
      return product.listings.map((l) => `${l.marketplace} (${l.listingStatus})`).join(" · ");
    }
    return "No channel connected";
  }
  return "";
}

export default function HealthCell({ product }: HealthCellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const health = useMemo(() => calculateProductHealth(product), [product]);

  return (
    <div className="relative flex flex-col items-center justify-center">
      <HoverCard open={isOpen} onOpenChange={setIsOpen} openDelay={100} closeDelay={200}>
        <HoverCardTrigger asChild>
          <button
            type="button"
            onFocus={() => setIsOpen(true)}
            onBlur={() => setIsOpen(false)}
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex flex-col items-center justify-center cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-lg p-0.5"
            aria-label={`Product Health checklist: ${health.score}% ${health.grade}`}
          >
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold transition hover:opacity-90 ${health.badgeClass}`}
            >
              {health.score}%
            </span>
            <span className={`mt-0.5 text-xs font-medium ${health.colorClass}`}>
              {health.grade}
            </span>
          </button>
        </HoverCardTrigger>

        {/* Portaled floating popup content: escapes scroll and table clips */}
        <HoverCardContent
          side="left"
          sideOffset={12}
          className="w-72 bg-white border border-slate-200 shadow-xl rounded-2xl p-3.5 z-50 pointer-events-auto"
        >
          {/* Popover Header */}
          <div className="flex flex-col gap-1 border-b border-slate-100 pb-2.5 mb-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Product Health</span>
              <span className={`text-xs font-bold uppercase ${health.colorClass}`}>
                {health.score}% · {health.grade}
              </span>
            </div>

            {/* Visual Score Progress line */}
            <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden mt-0.5">
              <div
                className={`h-full transition-all duration-300 ${
                  health.score >= 90 ? "bg-emerald-500" :
                  health.score >= 70 ? "bg-blue-500" :
                  health.score >= 50 ? "bg-amber-500" : "bg-rose-500"
                }`}
                style={{ width: `${health.score}%` }}
              />
            </div>

            <p className="text-xs font-bold text-slate-800 mt-1.5 capitalize truncate">
              {product.name}
            </p>
            <p className="text-xs text-slate-400">
              SKU: {product.sku}
            </p>
          </div>

          {/* Checklist Items list */}
          <div className="space-y-2 text-xs font-semibold text-left">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Readiness checklist
            </p>
            {health.checks.map((check, idx) => {
              const detail = getCheckDetail(check.label, check.passed, product);
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => router.push(`/products/${product.slug}/edit`)}
                  className="w-full text-left flex items-start gap-2.5 hover:bg-slate-50/80 p-1.5 rounded-lg transition group/item cursor-pointer"
                >
                  <span
                    className={`text-xs mt-0.5 shrink-0 font-bold ${
                      check.passed ? "text-emerald-600" : "text-rose-500"
                    }`}
                  >
                    {check.passed ? "✓" : "✕"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`font-semibold transition ${
                        check.passed ? "text-slate-700" : "text-slate-900 group-hover/item:text-blue-600"
                      }`}
                    >
                      {check.label}
                    </p>
                    {detail && (
                      <p className="text-xs text-slate-400 leading-tight mt-0.5">
                        {detail}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </HoverCardContent>
      </HoverCard>
    </div>
  );
}