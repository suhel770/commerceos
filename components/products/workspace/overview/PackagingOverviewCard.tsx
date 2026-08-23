"use client";

import { useEffect, useState } from "react";
import { Package, ArrowRight, Boxes, CheckCircle2 } from "lucide-react";
import type { Product } from "@/lib/types/product";
import type { ConsumableUsageRule } from "@/lib/consumable-rules/types";
import { safeResponseJson } from "@/lib/api/client";

interface PackagingOverviewCardProps {
  product: Product;
  onManage: () => void;
}

export default function PackagingOverviewCard({
  product,
  onManage,
}: PackagingOverviewCardProps) {
  const [rules, setRules] = useState<ConsumableUsageRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetchRules() {
      try {
        const res = await fetch(`/api/v1/products/${product.id}/consumables`);
        const payload = await safeResponseJson(res);
        if (!cancelled && payload.success && payload.data) {
          setRules(payload.data.rules || []);
        }
      } catch {
        // Fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchRules();
    return () => {
      cancelled = true;
    };
  }, [product.id]);

  const activeRules = rules.filter((r) => r.active);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between space-y-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-xl">
              <Package className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Packaging Specification</h3>
          </div>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-semibold rounded-full border border-emerald-200">
            {activeRules.length} Active Rules
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Default packaging materials consumed during order fulfillment.
        </p>

        {loading ? (
          <div className="space-y-2 py-2">
            <div className="h-4 bg-slate-100 rounded-md animate-pulse" />
            <div className="h-4 bg-slate-100 rounded-md animate-pulse w-3/4" />
          </div>
        ) : activeRules.length === 0 ? (
          <div className="p-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200 text-xs text-slate-400">
            No packaging consumables defined yet.
          </div>
        ) : (
          <div className="space-y-1.5">
            {activeRules.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs"
              >
                <span className="font-medium text-slate-800 truncate max-w-[170px]">{r.consumableName}</span>
                <span className="font-bold text-slate-900 font-mono text-[11px]">
                  {r.quantity} {r.unit} / {r.consumptionMode.toLowerCase().replace("per_", "")}
                </span>
              </div>
            ))}
            {activeRules.length > 3 && (
              <div className="text-[11px] text-slate-400 text-center pt-0.5">
                +{activeRules.length - 3} more packaging items
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onManage}
        className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
      >
        <span>Manage Packaging & Consumables</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
