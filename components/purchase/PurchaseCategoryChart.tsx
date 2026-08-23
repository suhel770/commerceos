"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import DashboardCard from "@/components/dashboard/DashboardCard";
import { formatPurchaseMoney, type PurchaseType } from "@/lib/purchase";

export type CategorySlice = {
  type?: PurchaseType;
  label: string;
  amount: number;
  color: string;
  pct: number;
};

type PurchaseCategoryChartProps = {
  slices: CategorySlice[];
  total: number;
  compact?: boolean;
  onSelectCategory?: (type?: PurchaseType, label?: string) => void;
};

function shortLabel(label: string) {
  const parts = label.split(" ");
  if (parts.length === 1) return label.slice(0, 8);
  return parts.map((part) => part[0]).join("").slice(0, 4);
}

export default function PurchaseCategoryChart({
  slices,
  total,
  compact = false,
  onSelectCategory,
}: PurchaseCategoryChartProps) {
  const chartData = slices.map((slice) => ({
    ...slice,
    short: shortLabel(slice.label),
  }));
  return (
    <DashboardCard
      className="flex h-full flex-col"
      title="Purchase by Category"
      contentClassName={`flex flex-1 flex-col justify-between gap-3 ${compact ? "p-3" : "p-4"}`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Spend graph
        </p>
        <p className="text-sm font-bold text-slate-900">
          {total >= 100000
            ? `₹${(total / 100000).toFixed(1)}L`
            : formatPurchaseMoney(total)}
          <span className="ml-1 text-[11px] font-medium text-slate-400">
            total
          </span>
        </p>
      </div>

      <div className="w-full flex-1 min-h-[150px] outline-none select-none" tabIndex={-1}>
        {chartData.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            No category spend in this range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%" className="outline-none" style={{ outline: "none" }}>
            <BarChart
              data={chartData}
              margin={{ top: 4, right: 4, left: -12, bottom: 0 }}
              style={{ outline: "none", boxShadow: "none" }}
              tabIndex={-1}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="short"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                interval={0}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={40}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
                tickFormatter={(value: number) =>
                  value >= 100000
                    ? `${Math.round(value / 100000)}L`
                    : `${Math.round(value / 1000)}k`
                }
              />
              <Tooltip
                cursor={{ fill: "#f8fafc" }}
                formatter={(value) => [
                  formatPurchaseMoney(Number(value ?? 0)),
                  "Spend",
                ]}
                labelFormatter={(_, payload) => {
                  const row = payload?.[0]?.payload as CategorySlice | undefined;
                  return row?.label ?? "";
                }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="amount" radius={[6, 6, 3, 3]} maxBarSize={32}>
                {chartData.map((slice) => (
                  <Cell
                    key={slice.label}
                    fill={slice.color}
                    className="cursor-pointer transition-opacity hover:opacity-80"
                    onClick={() => onSelectCategory?.(slice.type, slice.label)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="min-w-0 shrink-0 space-y-1 border-t border-slate-100 pt-2">
        {slices.length === 0 ? (
          <p className="text-center text-xs text-slate-500">
            No category details.
          </p>
        ) : (
          slices.map((slice) => (
            <div
              key={slice.label}
              onClick={() => onSelectCategory?.(slice.type, slice.label)}
              className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-1.5 py-0.5 text-xs transition-colors hover:bg-violet-50/80"
              title={`Click to filter by ${slice.label}`}
            >
              <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: slice.color }}
                />
                <span className="truncate text-[11px] font-medium">{slice.label}</span>
              </span>
              <span className="shrink-0 tabular-nums text-[11px] font-semibold text-slate-800">
                {slice.pct}% · {formatPurchaseMoney(slice.amount)}
              </span>
            </div>
          ))
        )}
      </div>
    </DashboardCard>
  );
}
