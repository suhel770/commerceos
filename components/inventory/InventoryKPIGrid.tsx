"use client";

import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  Building2,
  Package,
  PackageX,
  ShieldCheck,
  Truck,
  Boxes,
} from "lucide-react";

import {
  formatQty,
  type InventoryKpiKey,
  type InventoryTab,
} from "./inventory-ops";

/** Purchase-aligned ops KPIs — reserved is OMS-only and hidden here. */
type VisibleKpi = Exclude<InventoryKpiKey, "reserved" | "inventory_value">;

type Card = {
  key: VisibleKpi;
  title: string;
  icon: LucideIcon;
  accent: string;
};

const CARDS: Card[] = [
  {
    key: "total_skus",
    title: "Catalog SKUs",
    icon: Package,
    accent: "text-blue-600",
  },
  {
    key: "total_stock",
    title: "Total Units",
    icon: Boxes,
    accent: "text-indigo-600",
  },
  {
    key: "sellable",
    title: "Sellable Qty",
    icon: ShieldCheck,
    accent: "text-emerald-600",
  },
  {
    key: "in_transit",
    title: "In Transit",
    icon: Truck,
    accent: "text-sky-600",
  },
  {
    key: "damaged",
    title: "Damaged Loss",
    icon: PackageX,
    accent: "text-rose-600",
  },
  {
    key: "out_of_stock",
    title: "Stock-out Risk",
    icon: PackageX,
    accent: "text-rose-500",
  },
  {
    key: "low_stock",
    title: "Low Stock Risk",
    icon: AlertTriangle,
    accent: "text-amber-500",
  },
  {
    key: "warehouses",
    title: "Locations",
    icon: Building2,
    accent: "text-slate-600",
  },
];

interface InventoryKPIGridProps {
  counts: Record<InventoryKpiKey, number>;
  loading?: boolean;
  activeTab: InventoryTab;
  onSelect(tab: InventoryTab): void;
}

export default function InventoryKPIGrid({
  counts,
  loading,
  activeTab,
  onSelect,
}: InventoryKPIGridProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-0.5">
      {CARDS.map((card) => {
        const Icon = card.icon;
        const selected = activeTab === card.key;
        const value = loading ? "—" : formatQty(counts[card.key]);
        return (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelect(card.key)}
            aria-pressed={selected}
            className={`min-w-[118px] flex-1 shrink-0 rounded-xl border px-2.5 py-2.5 text-left shadow-sm transition ${
              selected
                ? "border-violet-400 bg-violet-50 ring-2 ring-violet-200"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
            }`}
          >
            <div className="flex items-start justify-between gap-1">
              <p className={`text-[10px] font-semibold leading-tight ${card.accent}`}>
                {card.title}
              </p>
              <Icon className={`h-3.5 w-3.5 shrink-0 ${card.accent}`} />
            </div>
            <p className="mt-1.5 text-lg font-bold tabular-nums text-slate-900">
              {value}
            </p>
          </button>
        );
      })}
    </div>
  );
}
