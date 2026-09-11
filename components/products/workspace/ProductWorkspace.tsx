"use client";

import { useState, useEffect, useMemo } from "react";
import { safeResponseJson } from "@/lib/api/client";

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
const allTabs: Array<[ProductWorkspaceTab, string]> = [
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
  const [trackConsumables, setTrackConsumables] = useState(true);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("commerceos_track_consumables");
      if (cached !== null) {
        setTrackConsumables(cached === "true");
      }
    } catch {}

    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<boolean>;
      if (typeof customEvent.detail === "boolean") {
        setTrackConsumables(customEvent.detail);
      }
    };
    window.addEventListener("commerceos_toggle_track_consumables", handleToggle);

    fetch("/api/v1/settings/business")
      .then((res) => safeResponseJson(res))
      .then((json) => {
        if (json?.success && json.data) {
          setTrackConsumables(json.data.trackConsumables !== false);
        }
      })
      .catch(() => {});

    return () => {
      window.removeEventListener("commerceos_toggle_track_consumables", handleToggle);
    };
  }, []);

  const visibleTabs = useMemo(() => {
    return allTabs.filter(([key]) => {
      if (key === "consumables") {
        return trackConsumables;
      }
      return true;
    });
  }, [trackConsumables]);

  const navigate = (tab: ProductWorkspaceTab) => {
    setActiveWorkspace(tab);
    if (tab === "returns") {
      setReturnsFormKey((key) => key + 1);
    }
  };

  return (
    <div className="space-y-2.5">

      <HeroWorkspace
        product={product}
        onNavigate={navigate}
      />

      <div className="sticky top-0 z-30 -mx-1 bg-slate-100/95 px-1 py-1 backdrop-blur-xl">
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 bg-white shadow-2xs">
          <div className="flex min-w-max" role="tablist" aria-label="Product workspaces">
            {visibleTabs.map(([key, label]) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={activeWorkspace === key}
                onClick={() => navigate(key)}
                className={`border-b-2 px-3.5 py-2 text-xs font-semibold transition cursor-pointer ${
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

      {/* Premium Workspace Bottom Line & Audit Strip */}
      <div className="mt-6 border-t border-slate-200/80 pt-3 pb-6 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-slate-800">Master Catalog Synchronized</span>
          </div>

          <span className="text-slate-300 hidden sm:inline">•</span>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-2 py-0.5 rounded-md">
              {product.productId || "PRD-000101"}
            </span>
            <span className="font-mono text-[11px] text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
              {product.sku}
            </span>
          </div>

          <span className="text-slate-300 hidden sm:inline">•</span>
          <span className="text-[11px] text-slate-400">Single Source of Truth (SOT) • Immutable Ledger</span>
        </div>
      </div>

    </div>
  );
}
