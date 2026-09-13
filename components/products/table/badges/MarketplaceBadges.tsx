"use client";

import React from "react";
import { MarketplaceListing } from "@/lib/types/product";
import { Sparkles } from "lucide-react";

interface MarketplaceBadgesProps {
  listings?: MarketplaceListing[];
  onBadgeClick?: (marketplace: string) => void;
}

const marketplaceStyles: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  amazon: { bg: "bg-amber-50/90", text: "text-amber-800", border: "border-amber-200", dot: "bg-emerald-500" },
  Amazon: { bg: "bg-amber-50/90", text: "text-amber-800", border: "border-amber-200", dot: "bg-emerald-500" },
  flipkart: { bg: "bg-blue-50/90", text: "text-blue-800", border: "border-blue-200", dot: "bg-emerald-500" },
  Flipkart: { bg: "bg-blue-50/90", text: "text-blue-800", border: "border-blue-200", dot: "bg-emerald-500" },
  meesho: { bg: "bg-pink-50/90", text: "text-pink-800", border: "border-pink-200", dot: "bg-emerald-500" },
  Meesho: { bg: "bg-pink-50/90", text: "text-pink-800", border: "border-pink-200", dot: "bg-emerald-500" },
  shopify: { bg: "bg-emerald-50/90", text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-500" },
  Shopify: { bg: "bg-emerald-50/90", text: "text-emerald-800", border: "border-emerald-200", dot: "bg-emerald-500" },
};

export default function MarketplaceBadges({ listings = [], onBadgeClick }: MarketplaceBadgesProps) {
  if (!listings || listings.length === 0) {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (onBadgeClick) onBadgeClick("ALL");
        }}
        title="Click to configure Universal Listing"
        className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-semibold text-slate-500 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/50 transition cursor-pointer"
      >
        <Sparkles className="h-3 w-3 text-blue-500" /> Universal Setup
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      {listings.map((listing) => {
        const style = marketplaceStyles[listing.marketplace] || {
          bg: "bg-slate-50",
          text: "text-slate-700",
          border: "border-slate-200",
          dot: "bg-emerald-500",
        };

        const isLive =
          listing.listingStatus === "Live" ||
          listing.status === "Live" ||
          (listing as unknown as { publishStatus?: string }).publishStatus === "PUBLISHED";
        const dotColor = isLive ? "bg-emerald-500" : "bg-amber-400";

        return (
          <button
            key={listing.id || listing.marketplace}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (onBadgeClick) onBadgeClick(listing.marketplace);
            }}
            title={`${listing.marketplace}: ${isLive ? "Live & Synced" : "Ready / Pending Sync"} (Click to inspect)`}
            className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-bold transition hover:scale-105 cursor-pointer shadow-2xs ${style.bg} ${style.text} ${style.border}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${dotColor} shrink-0 ring-1 ring-white`} />
            <span>{listing.marketplace}</span>
          </button>
        );
      })}
    </div>
  );
}