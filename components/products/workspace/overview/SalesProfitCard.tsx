"use client";

import { useState } from "react";

import {
  BadgeIndianRupee,
  TrendingUp,
  Wallet,
  Percent,
  RotateCcw,
  Megaphone,
  Sparkles,
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

export default function SalesProfitCard({
  product,
}: SalesProfitCardProps) {
  const [range, setRange] = useState("30d");

  const pricing = {
    costPrice: product.pricing.costPrice,
    sellingPrice: product.pricing.sellingPrice,
    shippingCost: 60,
    packagingCost: 18,
    marketplaceFee: 85,
    commission: 25,
    gst: 12,
    tds: 7,
    tcs: 4,
    advertisingCost: 30,
    returnCost: 10,
  };

  const grossProfit = calculateGrossProfit(pricing);
  const grossMargin = calculateGrossMargin(pricing);

  const netProfit = calculateNetProfit(pricing);
  const netMargin = calculateNetMargin(pricing);

  const roi = calculateROI(pricing);

  return (
    <WorkspaceCard
      height="h-[560px]"
      header={
        <div className="flex items-center justify-between px-5 py-3">

          <div>

            <h2 className="text-lg font-semibold text-slate-900">
              Sales & Profit
            </h2>

            <p className="mt-0.5 text-sm text-slate-500">
              Financial Overview
            </p>

          </div>

          <DateRangeFilter
            value={range}
            onChange={setRange}
          />

        </div>
      }
      footer={
        <div className="flex items-center justify-between px-5 py-3">

          <span className="text-xs text-slate-500">
            Last analysed 2 minutes ago
          </span>

          <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            View Financial Analysis →
          </button>

        </div>
      }
    >

      {/* Revenue */}

      <div className="border-b border-slate-100 px-5 py-2.5">

        <div className="flex items-center justify-between">

          <div>

            <p className="text-sm font-medium text-slate-500">
              Revenue
            </p>

            <h2 className="mt-1 text-[42px] font-bold leading-none tracking-tight text-slate-900">
              ₹2,38,458
            </h2>

            <div className="mt-1 flex items-center gap-2">

              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                +18%
              </span>

              <span className="text-sm text-slate-500">
                vs previous period
              </span>

            </div>

          </div>

          <div className="rounded-xl bg-emerald-50 p-2.5">

            <BadgeIndianRupee
              size={20}
              className="text-emerald-600"
            />

          </div>

        </div>

      </div>

      {/* Metrics */}

      <div className="grid grid-cols-4 gap-2 p-4">
                <MetricCard
          title="Gross Profit"
          value={`₹${grossProfit}`}
          subtitle={`${grossMargin.toFixed(1)}% Margin`}
          icon={<Wallet size={18} />}
          trend="+8%"
          trendPositive
        />

        <MetricCard
          title="Net Profit"
          value={`₹${netProfit}`}
          subtitle={`${netMargin.toFixed(1)}% Margin`}
          icon={<BadgeIndianRupee size={18} />}
          trend="+5%"
          trendPositive
        />

        <MetricCard
          title="ROI"
          value={`${roi.toFixed(0)}%`}
          subtitle="Return on Investment"
          icon={<Percent size={18} />}
          trend="+3%"
          trendPositive
        />

        <MetricCard
          title="Returns"
          value="2.1%"
          subtitle="Last 30 Days"
          icon={<RotateCcw size={18} />}
          trend="-0.4%"
          trendPositive={false}
        />

      </div>

      {/* Advertising */}

      <div className="border-t border-slate-100 px-5 py-2">

        <div className="flex items-center justify-between">

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-blue-50 p-2">

              <Megaphone
                size={18}
                className="text-blue-600"
              />

            </div>

            <div>

              <p className="text-sm font-medium text-slate-500">
                Advertising Spend
              </p>

              <p className="text-xl font-bold text-slate-900">
                ₹18,200
              </p>

            </div>

          </div>

          <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-700">
            7.6% of Revenue
          </span>

        </div>

      </div>

      {/* CommerceOS AI */}

      <div className="border-t border-slate-100 bg-gradient-to-r from-blue-50 to-violet-50 px-5 py-3">

        <div className="flex items-start gap-3">

          <div className="rounded-xl bg-violet-100 p-2">

            <Sparkles
              size={18}
              className="text-violet-600"
            />

          </div>

          <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-900">
              CommerceOS AI Recommendation
            </p>

            <p className="mt-1 text-xs leading-5 text-slate-600">
              Increase the Amazon selling price by <strong>₹20</strong>.
              Based on recent sales trends, this can improve monthly profit
              by approximately <strong>₹18,400</strong> without affecting
              conversion.
            </p>

            <button className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-700">
              View AI Analysis →
            </button>

          </div>

        </div>

      </div>

    </WorkspaceCard>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  trend: string;
  trendPositive: boolean;
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive,
}: MetricCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 transition-all duration-200 hover:border-slate-300 hover:shadow-sm">

      <div className="mb-2 flex items-center justify-between">

        <div className="text-slate-500">
          {icon}
        </div>

        <span
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
            trendPositive
              ? "bg-emerald-100 text-emerald-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {trend}
        </span>

      </div>

      <p className="text-xs text-slate-500">
        {title}
      </p>

      <h4 className="mt-1 text-2xl font-bold text-slate-900">
        {value}
      </h4>

      <p className="mt-1 text-[11px] text-slate-500">
        {subtitle}
      </p>

    </div>
  );
}