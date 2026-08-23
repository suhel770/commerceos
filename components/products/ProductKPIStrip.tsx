"use client";

import React, { useMemo } from "react";
import {
  Boxes,
  Globe,
  AlertTriangle,
  Zap,
  TrendingDown,
  Layers,
} from "lucide-react";
import type { Product } from "@/lib/types/product";
import {
  ReorderableKpiSection,
  type KpiItemDefinition,
} from "@/components/ui/kpi";
import { calculateProductHealth } from "@/lib/products/health-score";

interface ProductKPIStripProps {
  products?: Product[];
}

export type ProductKpiId =
  | "sellable_products"
  | "active_listings"
  | "needs_attention"
  | "marketplace_ready"
  | "low_stock"
  | "unlisted";

const DEFAULT_KPI_ORDER: ProductKpiId[] = [
  "sellable_products",
  "active_listings",
  "needs_attention",
  "marketplace_ready",
  "low_stock",
  "unlisted",
];

export default function ProductKPIStrip({ products = [] }: ProductKPIStripProps) {
  // 1. Compute Live Operational Metrics
  const metrics = useMemo(() => {
    const totalSellable = products.length;

    let activeListingsCount = 0;
    let needsAttentionCount = 0;
    let marketplaceReadyCount = 0;
    let lowStockCount = 0;
    let unlistedCount = 0;

    for (const p of products) {
      const hasLiveListing = Boolean(
        p.listings && p.listings.some((l) => l.listingStatus === "Live" || l.status === "Live" || l.status === "active")
      );

      if (hasLiveListing) {
        activeListingsCount += 1;
      } else {
        unlistedCount += 1;
      }

      const available = p.inventory?.available || 0;
      if (available <= 10) {
        lowStockCount += 1;
      }

      const health = calculateProductHealth(p);
      if (health.score < 80 || available === 0) {
        needsAttentionCount += 1;
      }

      if (health.score >= 85 && available > 0) {
        marketplaceReadyCount += 1;
      }
    }

    return {
      totalSellable,
      activeListingsCount,
      needsAttentionCount,
      marketplaceReadyCount,
      lowStockCount,
      unlistedCount,
    };
  }, [products]);

  // 2. Define KPI Cards
  const kpiItems: KpiItemDefinition<ProductKpiId>[] = [
    {
      id: "sellable_products",
      render: () => (
        <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-slate-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Sellable Products
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                {metrics.totalSellable}
              </h2>
              <p className="mt-1 text-[10px] font-semibold text-emerald-600">
                Inventory-Driven Catalog
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "active_listings",
      render: () => (
        <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-slate-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Active Listings
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                {metrics.activeListingsCount}
              </h2>
              <p className="mt-1 text-[10px] font-semibold text-slate-400">
                Live Channel Links
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
              <Globe className="h-4 w-4" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "needs_attention",
      render: () => (
        <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-amber-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Needs Attention
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-amber-600">
                {metrics.needsAttentionCount}
              </h2>
              <p className="mt-1 text-[10px] font-semibold text-amber-600">
                Missing data / 0 ATS
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "marketplace_ready",
      render: () => (
        <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-slate-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Marketplace Ready
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                {metrics.marketplaceReadyCount}
              </h2>
              <p className="mt-1 text-[10px] font-semibold text-indigo-600">
                100% Complete Data
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600">
              <Zap className="h-4 w-4" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "low_stock",
      render: () => (
        <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-slate-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Low Stock Products
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                {metrics.lowStockCount}
              </h2>
              <p className="mt-1 text-[10px] font-semibold text-slate-400">
                ATS ≤ 10 units
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
              <TrendingDown className="h-4 w-4" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "unlisted",
      render: () => (
        <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-slate-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Unlisted Products
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                {metrics.unlistedCount}
              </h2>
              <p className="mt-1 text-[10px] font-semibold text-slate-400">
                No active channel
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
              <Layers className="h-4 w-4" />
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <ReorderableKpiSection<ProductKpiId>
      storageKey="commerceos.product.kpi-order.v2"
      defaultOrder={DEFAULT_KPI_ORDER}
      items={kpiItems}
      showHelperText={false}
      showResetButton={false}
      gridClassName="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6"
    />
  );
}
