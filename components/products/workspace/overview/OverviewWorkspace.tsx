"use client";

import { useEffect, useState, useMemo } from "react";
import type { Product } from "@/lib/types/product";
import type { ProductWorkspaceNavigate } from "../types";
import { calculateProductHealth } from "@/lib/products/health-score";
import { safeResponseJson } from "@/lib/api/client";

import {
  Package,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  BrainCircuit,
} from "lucide-react";
import SalesProfitCard from "./SalesProfitCard";
import ProductTimelineCard from "./ProductTimelineCard";
import PackagingOverviewCard from "./PackagingOverviewCard";
import SalesChannelsCard from "./SalesChannelsCard";

interface OverviewWorkspaceProps {
  product: Product;
  onNavigate: ProductWorkspaceNavigate;
}

export default function OverviewWorkspace({
  product,
  onNavigate,
}: OverviewWorkspaceProps) {
  const [trackConsumables, setTrackConsumables] = useState(true);

  // Synchronize business profile settings for trackConsumables toggle state
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

    let cancelled = false;
    async function fetchProfile() {
      try {
        const res = await fetch("/api/v1/settings/business");
        const json = await safeResponseJson(res);
        if (!cancelled && json.success && json.data) {
          setTrackConsumables(json.data.trackConsumables !== false);
        }
      } catch {}
    }
    fetchProfile();
    return () => {
      cancelled = true;
      window.removeEventListener("commerceos_toggle_track_consumables", handleToggle);
    };
  }, []);

  const health = useMemo(() => calculateProductHealth(product), [product]);

  return (
    <div className="space-y-3.5">
      {/* ========================================================================= */}
      {/* ROW 1: Sales & Channel Overview + Product Readiness                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
        {/* Sales Channels (7 cols on desktop) */}
        <div className="xl:col-span-7">
          <SalesChannelsCard
            product={product}
            onViewAll={() => onNavigate("listings")}
          />
        </div>

        {/* Product Readiness (5 cols on desktop) */}
        <div className="xl:col-span-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-700 rounded-xl">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Product Readiness</h3>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                  Score: {health.score}% · {health.grade}
                </p>
              </div>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                health.score >= 80
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : health.score >= 60
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
              }`}
            >
              {health.score}%
            </span>
          </div>

          {health.missingItems.length > 0 ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2 bg-amber-50/70 border border-amber-100 rounded-xl p-3 text-xs text-amber-800 leading-snug">
                <AlertTriangle size={16} className="shrink-0 text-amber-600 mt-0.5" />
                <div className="min-w-0">
                  <p className="font-bold">Missing Details Detected</p>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Improve product details to increase search ranking and avoid channel sync errors.
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                {health.checks.map((check, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs py-1 px-1.5 rounded-lg hover:bg-slate-50 transition"
                  >
                    <span className="text-slate-600 font-medium">{check.label}</span>
                    {check.passed ? (
                      <span className="text-emerald-600 font-bold">✓ Ready</span>
                    ) : (
                      <span className="text-rose-500 font-bold">✕ Missing</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2 bg-emerald-50/70 border border-emerald-100 rounded-xl p-4 text-xs text-emerald-800 leading-snug">
              <ShieldCheck size={18} className="shrink-0 text-emerald-600 mt-0.5" />
              <div className="min-w-0">
                <p className="font-bold text-sm">Fully Configured</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  This product has 100% readiness checks passed and is ready for all marketplace channels.
                </p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => onNavigate("listings")}
            className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>Improve Product Readiness</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: Inventory Snapshot + Financial Summary                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Inventory Snapshot (7 cols) */}
        <div className="xl:col-span-7 rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-50 text-blue-700 rounded-xl">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Inventory Snapshot</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Storage quantities and live allocation for SKU <span className="font-mono font-semibold">{product.sku}</span>
                  </p>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 text-xs font-semibold rounded-full border ${
                  product.inventory?.available > 0
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {product.inventory?.available > 0 ? "In Stock" : "Out of Stock"}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { label: "Available (ATS)", value: product.inventory?.available ?? 0, color: "text-blue-600 font-extrabold" },
                { label: "Reserved", value: product.inventory?.reserved ?? 0, color: "text-slate-800" },
                { label: "Damaged", value: product.inventory?.damaged ?? 0, color: (product.inventory?.damaged ?? 0) > 0 ? "text-rose-600 font-bold" : "text-slate-800" },
                { label: "Incoming", value: product.inventory?.incoming ?? 0, color: "text-slate-800" },
              ].map((item, idx) => (
                <div key={idx} className="bg-slate-50 rounded-xl p-3.5 border border-slate-100 text-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">
                    {item.label}
                  </p>
                  <p className={`text-xl font-bold mt-1 ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("inventory")}
            className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <span>View Detailed Inventory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Financial Summary (5 cols) */}
        <div className="xl:col-span-5">
          <SalesProfitCard product={product} />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 3: Packaging & Consumables + Product Timeline                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Packaging Specification (conditional on trackConsumables) */}
        {trackConsumables && (
          <div className="xl:col-span-6">
            <PackagingOverviewCard
              product={product}
              onManage={() => onNavigate("consumables")}
            />
          </div>
        )}

        {/* Product Timeline Log */}
        <div className={trackConsumables ? "xl:col-span-6" : "xl:col-span-12"}>
          <ProductTimelineCard
            product={product}
            onViewAll={() => onNavigate("activity")}
          />
        </div>
      </div>

      {/* Optional AI Suggestions Block */}
      {product.aiRecommendations && product.aiRecommendations.length > 0 && (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-5 shadow-2xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-100 text-violet-700 rounded-xl">
              <BrainCircuit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-violet-900">CommerceOS AI Insights</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider text-violet-600 bg-violet-100/80 px-2 py-0.5 rounded-md">
                  Optional
                </span>
              </div>
              <p className="text-xs text-violet-700/90 mt-0.5 leading-relaxed">
                {product.aiRecommendations[0].message}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("ai")}
            className="shrink-0 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <span>Open AI Studio</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}
    </div>
  );
}
