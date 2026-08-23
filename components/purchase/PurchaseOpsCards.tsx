"use client";

import { getAiCreditsRemaining } from "@/lib/ai/credits";

import {
  AlertTriangle,
  Clock3,
  PackageMinus,
  Receipt,
  Sparkles,
  Truck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import { formatPurchaseMoney } from "@/lib/purchase";

import type { PurchaseCapabilities } from "./purchase-ops";

export type OpsCard = {
  key: string;
  title: string;
  value: string;
  footer: string;
  tone: "rose" | "amber" | "orange" | "violet" | "emerald" | "slate";
  icon: LucideIcon;
  onClick?(): void;
  hidden?: boolean;
};

type PurchaseOpsCardsProps = {
  cards: OpsCard[];
  loading?: boolean;
};

const TONE: Record<
  OpsCard["tone"],
  { wrap: string; icon: string; ring: string }
> = {
  rose: {
    wrap: "bg-rose-50 text-rose-600 border border-rose-100",
    icon: "text-rose-600",
    ring: "hover:border-rose-300",
  },
  amber: {
    wrap: "bg-amber-50 text-amber-700 border border-amber-100",
    icon: "text-amber-700",
    ring: "hover:border-amber-300",
  },
  orange: {
    wrap: "bg-orange-50 text-orange-700 border border-orange-100",
    icon: "text-orange-700",
    ring: "hover:border-orange-300",
  },
  violet: {
    wrap: "bg-violet-50 text-violet-700 border border-violet-100",
    icon: "text-violet-700",
    ring: "hover:border-violet-300",
  },
  emerald: {
    wrap: "bg-emerald-50 text-emerald-700 border border-emerald-100",
    icon: "text-emerald-700",
    ring: "hover:border-emerald-300",
  },
  slate: {
    wrap: "bg-slate-50 text-slate-700 border border-slate-200",
    icon: "text-slate-700",
    ring: "hover:border-slate-300",
  },
};

export function buildDefaultOpsCards(input: {
  capabilities: PurchaseCapabilities;
  reorderCount: number;
  pendingBillsCount: number;
  pendingAmount: number;
  incomingCount: number;
  outstandingVendors: number;
  alertCount: number;
  onReorder(): void;
  onPending(): void;
  onIncoming(): void;
  onVendors(): void;
  onAlerts(): void;
  onAiAdvisor?(): void;
}): OpsCard[] {
  return [
    {
      key: "reorder",
      title: "Short on stock",
      value: String(input.reorderCount),
      footer: "Reorder required",
      tone: "rose",
      icon: PackageMinus,
      onClick: input.onReorder,
    },
    {
      key: "pending",
      title: "Pending PO Bills",
      value: String(input.pendingBillsCount),
      footer: formatPurchaseMoney(input.pendingAmount),
      tone: "amber",
      icon: Receipt,
      onClick: input.onPending,
    },
    {
      key: "incoming",
      title: "Incoming Shipments",
      value: String(input.incomingCount),
      footer: "Awaiting GRN / receiving",
      tone: "orange",
      icon: Truck,
      onClick: input.onIncoming,
    },
    {
      key: "vendors",
      title: "Active Suppliers",
      value: String(input.outstandingVendors),
      footer: "Vendor network",
      tone: "violet",
      icon: Users,
      onClick: input.onVendors,
    },
    {
      key: "alerts",
      title: "Procurement alerts",
      value: String(input.alertCount),
      footer: "Quality & Price alerts",
      tone: input.alertCount > 0 ? "rose" : "emerald",
      icon: AlertTriangle,
      onClick: input.onAlerts,
    },
    {
      key: "ai_advisor",
      title: "Procurement AI Advisor",
      value: `${getAiCreditsRemaining()} Credits`,
      footer: "Ask AI Advisor →",
      tone: "emerald",
      icon: Sparkles,
      onClick: input.onAiAdvisor,
    },
  ];
}

import { useMemo } from "react";
import { useReorderableKpis } from "@/components/ui/kpi";
import { GripVertical } from "lucide-react";

const PURCHASE_OPS_KPI_ORDER_KEY = "commerceos_purchase_ops_kpi_order_v1";

export default function PurchaseOpsCards({
  cards,
  loading,
}: PurchaseOpsCardsProps) {
  const visible = useMemo(() => cards.filter((card) => !card.hidden), [cards]);
  const defaultKeys = useMemo(() => visible.map((c) => c.key), [visible]);

  const {
    order,
    isReordered,
    resetOrder,
    getCardDragProps,
  } = useReorderableKpis<string>({
    storageKey: PURCHASE_OPS_KPI_ORDER_KEY,
    defaultOrder: defaultKeys,
  });

  const cardMap = useMemo(() => {
    const map = new Map<string, OpsCard>();
    for (const c of visible) {
      map.set(c.key, c);
    }
    return map;
  }, [visible]);

  if (loading) {
    return (
      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-[76px] animate-pulse rounded-2xl border border-slate-200 bg-slate-100"
          />
        ))}
      </section>
    );
  }

  if (visible.length === 0) return null;

  return (
    <div className="space-y-1.5">
      {isReordered && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={resetOrder}
            className="text-[10px] font-extrabold text-violet-600 hover:text-violet-800 transition-colors cursor-pointer"
          >
            Reset Order
          </button>
        </div>
      )}

      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        {order.map((key, index) => {
          const card = cardMap.get(key);
          if (!card) return null;

          const Icon = card.icon;
          const tone = TONE[card.tone];
          const Comp = card.onClick ? "button" : "div";
          const dragProps = getCardDragProps(index);
          const { isDragging, isOver } = dragProps;

          return (
            <Comp
              key={card.key}
              type={card.onClick ? "button" : undefined}
              onClick={card.onClick}
              {...dragProps}
              className={`group relative flex items-center gap-3 rounded-2xl border bg-white p-3.5 text-left shadow-xs transition-all duration-200 select-none cursor-grab active:cursor-grabbing ${tone.ring} ${
                isDragging
                  ? "opacity-40 scale-95 border-dashed border-violet-400"
                  : isOver
                    ? "border-violet-500 ring-2 ring-violet-200 scale-102 shadow-md bg-violet-50/20"
                    : "border-slate-200/80 hover:shadow-sm hover:border-slate-300"
              } ${card.onClick ? "active:scale-[0.99]" : ""}`}
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 pointer-events-none">
                <GripVertical className="h-3.5 w-3.5" />
              </div>
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.wrap}`}
              >
                <Icon className={`h-5 w-5 ${tone.icon}`} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-slate-500">
                  {card.title}
                </p>
                <p className="truncate text-lg font-bold tracking-tight text-slate-900 mt-0.5">
                  {card.value}
                </p>
                <p className="truncate text-[11px] font-semibold text-slate-400 mt-0.5">
                  {card.footer}
                </p>
              </div>
            </Comp>
          );
        })}
      </section>
    </div>
  );
}
