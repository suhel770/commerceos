"use client";

import Link from "next/link";
import { Globe } from "lucide-react";
import type { Product } from "@/lib/types/product";
import SalesChannelRow from "./SalesChannelRow";
import WorkspaceCard from "@/components/ui/WorkspaceCard";

interface SalesChannelsCardProps {
  product: Product;
  onViewAll?: () => void;
}

export default function SalesChannelsCard({
  product,
  onViewAll,
}: SalesChannelsCardProps) {
  const hasChannels = product.listings && product.listings.length > 0;

  return (
    <WorkspaceCard
      height="h-auto"
      header={
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <Globe size={16} className="text-slate-400" />
              <span>Sales Channels</span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 font-semibold">
              Connected to {product.listings.length} channel{product.listings.length === 1 ? "" : "s"}
            </p>
          </div>

          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-bold text-blue-600 transition hover:text-blue-700 cursor-pointer"
          >
            View Listings
          </button>
        </div>
      }
    >
      {!hasChannels ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <Globe size={24} className="text-slate-300 animate-pulse mb-2" />
          <p className="text-xs font-bold text-slate-700">No Marketplaces Connected</p>
          <p className="text-[10px] text-slate-400 max-w-xs mt-0.5 leading-snug">
            List this product on Amazon, Flipkart, or Shopify to track performance and inventory sync.
          </p>
          <Link
            href="/settings"
            className="mt-3 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 transition cursor-pointer"
          >
            Connect Marketplace
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {product.listings.map((listing) => (
            <SalesChannelRow
              key={listing.id}
              marketplace={listing.marketplace}
              marketplaceSku={listing.marketplaceSku}
              listingIdLabel={listing.listingIdLabel}
              listingId={listing.listingId}
              sellingPrice={listing.sellingPrice}
              availableStock={listing.availableStock}
              orders30Days={listing.orders30Days}
              revenue30Days={listing.revenue30Days}
              status={listing.status}
              listingStatus={listing.listingStatus}
              stockSync={listing.stockSync}
              lastSync={listing.lastSync}
              healthScore={listing.healthScore}
              marketplaceUrl={listing.marketplaceUrl}
            />
          ))}
        </div>
      )}
    </WorkspaceCard>
  );
}