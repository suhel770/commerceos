"use client";

import { useState } from "react";

import type { Product } from "@/lib/types/product";

import HeroWorkspace from "./hero/HeroWorkspace";
import OverviewWorkspace from "./overview/OverviewWorkspace";
import ListingsWorkspace from "./listings/ListingsWorkspace";
import InventoryWorkspace from "./inventory/InventoryWorkspace";
import PackagingConsumablesWorkspace from "./consumables/PackagingConsumablesWorkspace";
import OrdersWorkspace from "./orders/OrdersWorkspace";
import ReturnsWorkspace from "./returns/ReturnsWorkspace";
import AnalyticsWorkspace from "./analytics/AnalyticsWorkspace";
import AIStudioWorkspace from "./ai/AIStudioWorkspace";
import ActivityWorkspace from "./activity/ActivityWorkspace";
import type { ProductWorkspaceTab } from "./types";

interface ProductWorkspaceProps {
  product: Product;
}

/** Bible Product Overview order first; cross-module tabs follow. */
const tabs: Array<[ProductWorkspaceTab, string]> = [
  ["overview", "Overview"],
  ["listings", "Listings"],
  ["performance", "Performance"],
  ["inventory", "Inventory"],
  ["consumables", "Packaging & Consumables"],
  ["activity", "Activity"],
  ["orders", "Orders"],
  ["returns", "Returns"],
  ["ai", "AI Studio"],
];

export default function ProductWorkspace({
  product,
}: ProductWorkspaceProps) {
  const [activeWorkspace, setActiveWorkspace] =
    useState<ProductWorkspaceTab>("overview");
  const [returnsFormKey, setReturnsFormKey] = useState(0);

  const navigate = (tab: ProductWorkspaceTab) => {
    setActiveWorkspace(tab);
    if (tab === "returns") {
      setReturnsFormKey((key) => key + 1);
    }
  };

  return (
    <div className="space-y-6">

      <HeroWorkspace
        product={product}
        onNavigate={navigate}
      />

      <div className="sticky top-0 z-30 -mx-1 bg-slate-100/95 px-1 py-1.5 backdrop-blur-xl">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex min-w-max" role="tablist" aria-label="Product workspaces">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeWorkspace === key}
                onClick={() => navigate(key)}
                className={`border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
                  activeWorkspace === key
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-500 hover:text-slate-900"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeWorkspace === "overview" && (
        <OverviewWorkspace
          product={product}
          onNavigate={navigate}
        />
      )}

      {activeWorkspace === "listings" && (
        <ListingsWorkspace product={product} />
      )}

      {activeWorkspace === "performance" && (
        <AnalyticsWorkspace product={product} />
      )}

      {activeWorkspace === "inventory" && (
        <InventoryWorkspace product={product} />
      )}

      {activeWorkspace === "consumables" && (
        <PackagingConsumablesWorkspace product={product} />
      )}

      {activeWorkspace === "activity" && (
        <ActivityWorkspace product={product} />
      )}

      {activeWorkspace === "orders" && (
        <OrdersWorkspace product={product} />
      )}

      {activeWorkspace === "returns" && (
        <ReturnsWorkspace
          key={returnsFormKey}
          product={product}
        />
      )}

      {activeWorkspace === "ai" && (
        <AIStudioWorkspace product={product} />
      )}

    </div>
  );
}
