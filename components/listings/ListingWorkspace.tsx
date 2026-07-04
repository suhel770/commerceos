"use client";

import { useState } from "react";
import type { Listing } from "@/lib/data/listings";

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
  listing: Listing;
}

export default function ListingWorkspace({
  listing,
}: ListingWorkspaceProps) {
  const [activeTab, setActiveTab] =
    useState<ListingTab>("overview");

  return (
    <div className="space-y-4">

      <ListingHeader listing={listing} />

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
          <ListingOverview listing={listing} />
        )}

        {activeTab === "inventory" && (
          <ListingInventory listing={listing} />
        )}

        {activeTab === "pricing" && (
          <ListingPricing listing={listing} />
        )}

        {activeTab === "images" && (
          <ListingImages listing={listing} />
        )}

        {activeTab === "seo" && (
          <ListingSeo listing={listing} />
        )}

        {activeTab === "history" && (
          <ListingHistory listing={listing} />
        )}

      </div>

    </div>
  );
}