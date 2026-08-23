"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  CheckSquare,
  ClipboardX,
  List,
  Package,
  RotateCcw,
  Truck,
} from "lucide-react";

import type { VisionKpiKey, VisionTab } from "./order-ops";

type Card = {
  key: VisionKpiKey;
  title: string;
  tab: VisionTab;
  icon: LucideIcon;
  accent: string;
  labelColor: string;
  activeBorder: string;
};

const CARDS: Card[] = [
  {
    key: "all",
    title: "All Orders",
    tab: "all",
    icon: List,
    accent: "text-blue-600",
    labelColor: "text-blue-600",
    activeBorder: "border-t-blue-600",
  },
  {
    key: "to_ship",
    title: "To Ship",
    tab: "to_ship",
    icon: Truck,
    accent: "text-orange-500",
    labelColor: "text-orange-500",
    activeBorder: "border-t-orange-500",
  },
  {
    key: "shipped",
    title: "Shipped",
    tab: "shipped",
    icon: Package,
    accent: "text-sky-600",
    labelColor: "text-sky-600",
    activeBorder: "border-t-sky-600",
  },
  {
    key: "delivered",
    title: "Delivered",
    tab: "delivered",
    icon: CheckSquare,
    accent: "text-emerald-600",
    labelColor: "text-emerald-600",
    activeBorder: "border-t-emerald-600",
  },
  {
    key: "rto_in_transit",
    title: "RTO In Transit",
    tab: "rto_in_transit",
    icon: RotateCcw,
    accent: "text-violet-600",
    labelColor: "text-violet-600",
    activeBorder: "border-t-violet-600",
  },
  {
    key: "on_hold",
    title: "On Hold",
    tab: "onhold",
    icon: AlertCircle,
    accent: "text-amber-500",
    labelColor: "text-amber-500",
    activeBorder: "border-t-amber-500",
  },
  {
    key: "claims",
    title: "Claims",
    tab: "claims",
    icon: ClipboardX,
    accent: "text-rose-600",
    labelColor: "text-rose-600",
    activeBorder: "border-t-rose-600",
  },
];

interface OrdersKPIGridProps {
  counts: Record<VisionKpiKey, number>;
  loading?: boolean;
  activeTab: VisionTab;
  onSelect(tab: VisionTab): void;
}

export default function OrdersKPIGrid({
  counts,
  loading,
  activeTab,
  onSelect,
}: OrdersKPIGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="h-[88px] animate-pulse rounded-xl border border-slate-200 bg-slate-100"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
      {CARDS.map((card) => {
        const Icon = card.icon;
        const active = activeTab === card.tab;
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelect(card.tab)}
            className={`rounded-2xl border border-slate-200/80 bg-white px-3.5 py-3 text-left shadow-2xs transition hover:border-slate-300 ${
              active
                ? `border-t-[3px] ${card.activeBorder}`
                : "border-t border-t-slate-200"
            }`}
          >
            <div className={`flex items-center gap-1.5 ${card.labelColor}`}>
              <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={2.25} />
              <span className="truncate text-[10px] font-extrabold uppercase tracking-wider">{card.title}</span>
            </div>

            <div className="mt-2 flex items-end justify-between gap-2">
              <p className="text-2xl font-black tracking-tight text-slate-900">
                {counts[card.key].toLocaleString("en-IN")}
              </p>
              <div className="pb-0.5 text-right font-mono">
                <p className="text-[10px] font-semibold text-slate-400">—</p>
                <p className="text-[9px] font-semibold text-slate-400">
                  vs 7 days
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
