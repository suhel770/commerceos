"use client";

import { useState } from "react";
import type {
  MarketplaceListing,
  Product,
} from "@/lib/types/product";

import ListingHeader from "./ListingHeader";
import ListingTabs, { ListingTab } from "./ListingTabs";

import MarketplaceHealth from "./MarketplaceHealth";
import ListingValidation from "./ListingValidation";
import SyncStatus from "./SyncStatus";

import ListingOverview from "./ListingOverview";
import ListingInventory from "./ListingInventory";
import ListingPricing from "./ListingPricing";
import ListingImages from "./ListingImages";
import ListingSeo from "./ListingSeo";
import ListingHistory from "./ListingHistory";

interface ListingWorkspaceProps {
  product: Product;
  listing: MarketplaceListing;
}

export default function ListingWorkspace({
  product,
  listing,
}: ListingWorkspaceProps) {
  const [activeTab, setActiveTab] =
    useState<ListingTab>("overview");

  return (
    <div className="space-y-4">

      <ListingHeader product={product} listing={listing} />

      <ListingTabs
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Dashboard Widgets - ONLY Overview */}

      {activeTab === "overview" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <MarketplaceHealth />
          <ListingValidation />
          <SyncStatus />
        </div>
      )}

      {/* Workspace */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">

        {activeTab === "overview" && (
          <ListingOverview product={product} listing={listing} />
        )}

        {activeTab === "inventory" && (
          <ListingInventory productId={product.id} listingId={listing.id} />
        )}

        {activeTab === "pricing" && (
          <ListingPricing productId={product.id} listingId={listing.id} />
        )}

        {activeTab === "images" && (
          <ListingImages productId={product.id} listingId={listing.id} />
        )}

        {activeTab === "seo" && (
          <ListingSeo productId={product.id} listingId={listing.id} />
        )}

        {activeTab === "history" && (
          <ListingHistory productId={product.id} listingId={listing.id} />
        )}

      </div>

    </div>
  );
}
