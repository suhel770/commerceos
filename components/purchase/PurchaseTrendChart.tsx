"use client";

import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import DashboardCard from "@/components/dashboard/DashboardCard";
import { formatPurchaseMoney } from "@/lib/purchase";

type TrendPoint = {
  label: string;
  amount: number;
};

type PurchaseTrendChartProps = {
  data: TrendPoint[];
  compact?: boolean;
};

function formatCompact(value: number) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)}k`;
  return formatPurchaseMoney(value);
}

export default function PurchaseTrendChart({
  data,
  compact = false,
}: PurchaseTrendChartProps) {
  const total = data.reduce((sum, row) => sum + row.amount, 0);
  const peak = data.reduce(
    (best, row) => (row.amount > best.amount ? row : best),
    data[0] ?? { label: "—", amount: 0 },
  );
  const average = data.length ? total / data.length : 0;
  const latest = data[data.length - 1] ?? { label: "—", amount: 0 };
  const previous = data[data.length - 2];
  const deltaPct =
    previous && previous.amount > 0
      ? ((latest.amount - previous.amount) / previous.amount) * 100
      : null;
  const empty = data.length === 0 || data.every((row) => row.amount === 0);

  const chartMin = compact ? "min-h-[160px]" : "min-h-[200px]";

  return (
    <DashboardCard
      className="flex h-full flex-col overflow-hidden"
      title="Purchase Trend"
      contentClassName={`flex min-h-0 flex-1 flex-col gap-3 bg-gradient-to-b from-slate-50/80 to-white ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Period spend
          </p>
          <p
            className={`mt-0.5 font-bold tracking-tight text-slate-900 ${
              compact ? "text-xl" : "text-2xl"
            }`}
          >
            {formatCompact(total)}
          </p>
          {deltaPct !== null ? (
            <p
              className={`mt-1 text-xs font-semibold ${
                deltaPct >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {deltaPct >= 0 ? "↑" : "↓"} {Math.abs(deltaPct).toFixed(1)}% vs
              prior point
            </p>
          ) : (
            <p className="mt-1 text-xs text-slate-500">Daily purchase outflow</p>
          )}
        </div>
      </div>

      <div className="w-full flex-1 min-h-[160px] rounded-xl border border-slate-100 bg-white px-1 pt-2">
        {empty ? (
          <div className="flex h-full items-center justify-center text-xs text-slate-500">
            No purchase trend in this range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 4, right: 8, left: -8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="purchaseTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
                  <stop offset="55%" stopColor="#7c3aed" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="4 4"
                vertical={false}
                stroke="#e2e8f0"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#94a3b8", fontSize: 10 }}
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
                formatter={(value) => [
                  formatPurchaseMoney(Number(value ?? 0)),
                  "Purchase",
                ]}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #e2e8f0",
                  fontSize: 12,
                  boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
                }}
              />
              <Area
                type="monotone"
                dataKey="amount"
                stroke="none"
                fill="url(#purchaseTrendFill)"
              />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#7c3aed"
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: "#fff", stroke: "#7c3aed", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#7c3aed", strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-xl border border-violet-100 bg-violet-50 px-2 py-1">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-violet-500">
            Peak
          </p>
          <p className="truncate text-xs font-bold text-violet-900">
            {formatCompact(peak.amount)}
          </p>
          <p className="truncate text-[9px] text-violet-600/80">{peak.label}</p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-slate-50 px-2 py-1">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            Average
          </p>
          <p className="text-xs font-bold text-slate-900">
            {formatCompact(average)}
          </p>
          <p className="text-[9px] text-slate-500">per day</p>
        </div>
        <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-2 py-1">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-emerald-600">
            Latest
          </p>
          <p className="truncate text-xs font-bold text-emerald-900">
            {formatCompact(latest.amount)}
          </p>
          <p className="truncate text-[9px] text-emerald-700/80">
            {latest.label}
          </p>
        </div>
      </div>
    </DashboardCard>
  );
}
