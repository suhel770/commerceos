"use client";

import type { Product } from "@/lib/types/product";
import SalesChannelRow from "./SalesChannelRow";
import WorkspaceCard from "@/components/ui/WorkspaceCard";


interface SalesChannelsCardProps {
  product: Product;
}

export default function SalesChannelsCard({
  product,
}: SalesChannelsCardProps) {
  
  return (
  <WorkspaceCard
    height="h-[560px]"
    header={
      <div className="flex items-center justify-between px-5 py-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Sales Channels
          </h2>

          <p className="mt-0.5 text-sm text-slate-500">
            Connected to {product.listings.length} sales channels
          </p>
        </div>

        <button className="text-sm font-medium text-blue-600 transition hover:text-blue-700">
          View All
        </button>
      </div>
    }

  >
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
  </WorkspaceCard>
);
}