"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronDown,
  Coins,
  PackageX,
  RefreshCw,
  Sparkles,
  Truck,
  X,
} from "lucide-react";

import type {
  InventoryRecommendation,
  RecommendationSeverity,
} from "@/lib/inventory/inventory-advisor-engine";

const COLLAPSE_KEY = "commerceos.inventory.advisor.collapsed.v1";

const SEVERITY_CONFIG: Record<
  RecommendationSeverity,
  { dot: string; badge: string; border: string; bg: string; icon: typeof AlertTriangle }
> = {
  critical: {
    dot: "bg-rose-500",
    badge: "bg-rose-100 text-rose-800 border-rose-200",
    border: "border-rose-200",
    bg: "bg-rose-50/30",
    icon: PackageX,
  },
  warning: {
    dot: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    border: "border-amber-200",
    bg: "bg-amber-50/30",
    icon: AlertTriangle,
  },
  opportunity: {
    dot: "bg-indigo-500",
    badge: "bg-indigo-100 text-indigo-800 border-indigo-200",
    border: "border-indigo-200",
    bg: "bg-indigo-50/30",
    icon: Truck,
  },
  info: {
    dot: "bg-slate-500",
    badge: "bg-slate-100 text-slate-800 border-slate-200",
    border: "border-slate-200",
    bg: "bg-slate-50/30",
    icon: Boxes,
  },
};

interface InventoryAdvisorCardProps {
  recommendations: InventoryRecommendation[];
  creditsRemaining?: number;
  isLoading?: boolean;
  onRefresh?(): void;
  onViewSku?(sku: string): void;
  onActOnRecommendation?(rec: InventoryRecommendation): void;
}

export default function InventoryAdvisorCard({
  recommendations,
  creditsRemaining = 221,
  isLoading = false,
  onRefresh,
  onViewSku,
  onActOnRecommendation,
}: InventoryAdvisorCardProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      if (window.localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
    } catch {}
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  const visible = recommendations.filter((r) => !dismissed.has(r.recommendationId));

  const handleAction = (rec: InventoryRecommendation) => {
    if (onActOnRecommendation) {
      onActOnRecommendation(rec);
      return;
    }

    if (rec.actionRoute) {
      router.push(rec.actionRoute);
    } else if (rec.actionWorkflow === "reorder") {
      router.push("/purchase");
    } else if (rec.actionWorkflow === "transfer") {
      router.push("/storage");
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-violet-200/80 bg-white shadow-xs">
      <div className="flex w-full items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-violet-50/60 via-purple-50/30 to-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-2xs">
            <Sparkles className="h-4 w-4 text-amber-300" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-extrabold text-slate-900 tracking-tight">
                AI Inventory Advisor
              </h2>
              <span className="rounded-full bg-violet-100 border border-violet-200 px-2 py-0.5 text-[10px] font-black text-violet-800">
                {visible.length} Action{visible.length === 1 ? "" : "s"} Needed
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-500">
              Executive decision intelligence · Requires your explicit approval
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50"
              title="Refresh AI Analysis"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? "animate-spin text-violet-600" : "text-slate-500"}`} />
              <span className="hidden sm:inline">Analyze</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-[11px] font-bold text-amber-900">
            <Coins className="h-3 w-3 text-amber-600" />
            <span>{creditsRemaining} Credits</span>
          </div>

          <button
            type="button"
            onClick={toggle}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
            aria-label={collapsed ? "Expand advisor" : "Collapse advisor"}
          >
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${collapsed ? "" : "rotate-180"}`}
            />
          </button>
        </div>
      </div>

      {!collapsed && (
        <div>
          {visible.length === 0 ? (
            <div className="p-8 text-center bg-slate-50/50 space-y-1.5">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mb-1">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <p className="text-sm font-extrabold text-slate-900">
                Inventory Position is Healthy & Balanced
              </p>
              <p className="text-xs text-slate-500 font-medium max-w-md mx-auto">
                No immediate stockout risks, orphaned reservations, or critical anomalies detected across your warehouse nodes.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visible.map((item) => {
                const config = SEVERITY_CONFIG[item.severity] || SEVERITY_CONFIG.info;
                const Icon = config.icon;

                return (
                  <div
                    key={item.recommendationId}
                    className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between transition-colors hover:bg-slate-50/80 ${config.bg}`}
                  >
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <span className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${config.badge}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </span>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900 font-mono">
                            {item.sku}
                          </span>
                          <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${config.badge}`}>
                            {item.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            Confidence: {item.confidence}
                          </span>
                        </div>

                        <p className="text-xs font-extrabold text-slate-900 leading-snug">
                          {item.title}
                        </p>

                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          {item.explanation}
                        </p>

                        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-semibold flex-wrap">
                          <span>ATS: <strong className="text-slate-900 font-mono">{item.evidence.currentAts}</strong></span>
                          <span>On-Hand: <strong className="text-slate-900 font-mono">{item.evidence.onHand}</strong></span>
                          {item.evidence.daysOfCover !== undefined && (
                            <span>Coverage: <strong className="text-indigo-700">{item.evidence.daysOfCover} {typeof item.evidence.daysOfCover === "number" ? "Days" : ""}</strong></span>
                          )}
                          {item.evidence.damaged > 0 && (
                            <span className="text-rose-700">QC Quarantine: <strong>{item.evidence.damaged} units</strong></span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-start pt-1">
                      {onViewSku && (
                        <button
                          type="button"
                          onClick={() => onViewSku(item.sku)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer active:scale-95"
                        >
                          View SKU
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleAction(item)}
                        className="inline-flex items-center gap-1 rounded-xl bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-violet-700 transition shadow-xs cursor-pointer active:scale-95"
                      >
                        <span>Act</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>

                      <button
                        type="button"
                        aria-label="Dismiss recommendation"
                        onClick={() =>
                          setDismissed((prev) => new Set(prev).add(item.recommendationId))
                        }
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2 text-[11px] font-semibold text-slate-500 flex items-center justify-between">
            <span>Deterministic Inventory Engine is the authoritative single source of truth.</span>
            <span className="text-[10px] text-violet-700 font-extrabold">Never Auto-Mutates Stock</span>
          </div>
        </div>
      )}
    </section>
  );
}
