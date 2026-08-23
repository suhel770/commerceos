"use client";

import type { LucideIcon } from "lucide-react";
import {
  Building2,
  ClipboardList,
  IndianRupee,
  Package,
  Receipt,
  Users,
} from "lucide-react";

import { formatPurchaseMoney } from "@/lib/purchase";

type PurchaseMockKpisProps = {
  total: number;
  inventory: number;
  expenses: number;
  assets: number;
  pendingBillsCount: number;
  pendingBillsAmount: number;
  outstandingVendors: number;
};

export default function PurchaseMockKpis({
  total,
  inventory,
  expenses,
  assets,
  pendingBillsCount,
  pendingBillsAmount,
  outstandingVendors,
}: PurchaseMockKpisProps) {
  const cards: Array<{
    key: string;
    title: string;
    value: string;
    footer: string;
    footerTone?: "up" | "warn" | "muted";
    icon: LucideIcon;
    iconWrap: string;
    iconColor: string;
  }> = [
    {
      key: "total",
      title: "Total Purchases",
      value: formatPurchaseMoney(total),
      footer: "All types this range",
      footerTone: "muted",
      icon: IndianRupee,
      iconWrap: "bg-violet-100",
      iconColor: "text-violet-600",
    },
    {
      key: "pending",
      title: "Pending Bills",
      value: formatPurchaseMoney(pendingBillsAmount),
      footer: `${pendingBillsCount} unpaid / partial`,
      footerTone: "warn",
      icon: ClipboardList,
      iconWrap: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      key: "vendors",
      title: "Outstanding Vendors",
      value: String(outstandingVendors),
      footer: "With open balance",
      footerTone: "muted",
      icon: Users,
      iconWrap: "bg-rose-100",
      iconColor: "text-rose-600",
    },
    {
      key: "inventory",
      title: "Inventory Purchases",
      value: formatPurchaseMoney(inventory),
      footer: "Products + packaging",
      footerTone: "up",
      icon: Package,
      iconWrap: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      key: "expenses",
      title: "Expenses",
      value: formatPurchaseMoney(expenses),
      footer: "Office + service + other",
      footerTone: "up",
      icon: Receipt,
      iconWrap: "bg-orange-100",
      iconColor: "text-orange-600",
    },
    {
      key: "assets",
      title: "Assets",
      value: formatPurchaseMoney(assets),
      footer: "Capital purchases",
      footerTone: "up",
      icon: Building2,
      iconWrap: "bg-sky-100",
      iconColor: "text-sky-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.key}
            className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm"
          >
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${card.iconWrap}`}
            >
              <Icon className={`h-4 w-4 ${card.iconColor}`} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-medium text-slate-500">
                {card.title}
              </p>
              <p className="truncate text-base font-bold tracking-tight text-slate-900">
                {card.value}
              </p>
              <p
                className={`truncate text-[10px] font-semibold ${
                  card.footerTone === "up"
                    ? "text-emerald-600"
                    : card.footerTone === "warn"
                      ? "text-rose-600"
                      : "text-slate-400"
                }`}
              >
                {card.footer}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
