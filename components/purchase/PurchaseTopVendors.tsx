"use client";

import { ArrowRight } from "lucide-react";

import DashboardCard from "@/components/dashboard/DashboardCard";
import {
  formatPurchaseMoney,
  type TopVendor,
} from "@/lib/purchase/dashboard-data";

import type { PurchaseTab } from "./purchase-ops";

type PurchaseTopVendorsProps = {
  vendors: TopVendor[];
  onSelect(tab: PurchaseTab): void;
};

export default function PurchaseTopVendors({
  vendors,
  onSelect,
}: PurchaseTopVendorsProps) {
  return (
    <DashboardCard
      className="h-full w-full"
      contentClassName="space-y-2 p-3"
      title="Top vendors"
      action={
        <button
          type="button"
          onClick={() => onSelect("vendors")}
          className="text-xs font-semibold text-blue-600"
        >
          All vendors <ArrowRight className="ml-1 inline h-3 w-3" />
        </button>
      }
    >
      {vendors.map((vendor, index) => (
        <button
          key={vendor.id}
          type="button"
          onClick={() => onSelect("vendors")}
          className="flex w-full items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5 text-left transition hover:bg-slate-100"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-xs font-bold text-violet-700">
            {index + 1}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-xs font-semibold text-slate-900">
              {vendor.name}
            </span>
            <span className="mt-0.5 block text-[11px] text-slate-500">
              {vendor.openPos} open PO · {vendor.onTimePct}% on-time
            </span>
          </span>
          <span className="text-xs font-bold text-slate-900">
            {formatPurchaseMoney(vendor.spendInr)}
          </span>
        </button>
      ))}
    </DashboardCard>
  );
}
