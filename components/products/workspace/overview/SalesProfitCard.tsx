"use client";

import { useState } from "react";
import {
  BadgeIndianRupee,
  Wallet,
  Percent,
  RotateCcw,
  Megaphone,
  AlertCircle,
} from "lucide-react";

import WorkspaceCard from "@/components/ui/WorkspaceCard";
import DateRangeFilter from "@/components/shared/DateRangeFilter";
import type { Product } from "@/lib/types/product";
import {
  calculateGrossProfit,
  calculateGrossMargin,
  calculateNetProfit,
  calculateNetMargin,
  calculateROI,
} from "@/lib/calculations/pricing";

interface SalesProfitCardProps {
  product: Product;
}

export default function SalesProfitCard({ product }: SalesProfitCardProps) {
  const [range, setRange] = useState("30d");

  const pricing = {
    costPrice: product.pricing?.costPrice ?? 0,
    sellingPrice: product.pricing?.sellingPrice ?? 0,
    shippingCost: 0,
    packagingCost: 0,
    marketplaceFee: 0,
    commission: 0,
    gst: 0,
    tds: 0,
    tcs: 0,
    advertisingCost: 0,
    returnCost: 0,
  };

  const isConfigured = pricing.costPrice > 0 && pricing.sellingPrice > 0;

  const grossProfit = isConfigured ? calculateGrossProfit(pricing) : 0;
  const grossMargin = isConfigured ? calculateGrossMargin(pricing) : 0;
  const netProfit = isConfigured ? calculateNetProfit(pricing) : 0;
  const netMargin = isConfigured ? calculateNetMargin(pricing) : 0;
  const roi = isConfigured ? calculateROI(pricing) : 0;

  return (
    <WorkspaceCard
      height="h-auto"
      header={
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <BadgeIndianRupee size={16} className="text-slate-400" />
              <span>Financial Summary</span>
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 font-semibold">Margin Overview</p>
          </div>
          <DateRangeFilter value={range} onChange={setRange} />
        </div>
      }
    >
      {!isConfigured ? (
        <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
          <AlertCircle size={24} className="text-amber-500 mb-2" />
          <p className="text-xs font-bold text-slate-700">Financials Not Configured</p>
          <p className="text-[10px] text-slate-400 max-w-xs mt-0.5 leading-snug">
            Configure both a selling price and standard cost price inside edit settings to calculate business profit margins.
          </p>
        </div>
      ) : (
        <div className="space-y-4 p-4">
          {/* Revenue Indicator */}
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Revenue</p>
              <h2 className="text-3xl font-extrabold text-slate-900 mt-1">₹0</h2>
              <p className="text-[9px] font-semibold text-slate-400 mt-0.5">Sync channels to display actual sales revenue.</p>
            </div>
            <div className="p-2 bg-slate-50 border border-slate-100 rounded-xl text-slate-400">
              <BadgeIndianRupee size={18} />
            </div>
          </div>

          {/* Grid Metrics */}
          <div className="grid grid-cols-2 gap-2">
            <MetricBox
              title="Gross Margin"
              value={`${grossMargin.toFixed(1)}%`}
              subtitle={`Profit: ₹${grossProfit}`}
              icon={<Wallet size={14} />}
            />
            <MetricBox
              title="Net Margin"
              value={`${netMargin.toFixed(1)}%`}
              subtitle={`Profit: ₹${netProfit}`}
              icon={<BadgeIndianRupee size={14} />}
            />
            <MetricBox
              title="ROI"
              value={`${roi.toFixed(0)}%`}
              subtitle="Return on Investment"
              icon={<Percent size={14} />}
            />
            <MetricBox
              title="Return Rate"
              value="0%"
              subtitle="Fulfillment Returns"
              icon={<RotateCcw size={14} />}
            />
          </div>

          {/* Ads Spend Row */}
          <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Megaphone size={14} className="text-slate-400" />
              <span className="font-bold text-slate-600">Advertising Spend</span>
            </div>
            <span className="font-extrabold text-slate-800">₹0</span>
          </div>
        </div>
      )}
    </WorkspaceCard>
  );
}

function MetricBox({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300">
      <div className="flex items-center justify-between text-slate-400 mb-1">
        {icon}
        <span className="text-[9px] font-bold text-slate-400">—</span>
      </div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{title}</p>
      <h4 className="text-lg font-black text-slate-800 mt-0.5">{value}</h4>
      <p className="text-[9px] font-semibold text-slate-400 leading-tight mt-0.5">{subtitle}</p>
    </div>
  );
}
