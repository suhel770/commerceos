"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import DashboardCard from "./DashboardCard";

import { ChevronDown } from "lucide-react";

const chartData = [
  { day: "Jun 19", revenue: 0, profit: 0, orders: 0 },
  { day: "Jun 23", revenue: 0, profit: 0, orders: 0 },
  { day: "Jun 27", revenue: 0, profit: 0, orders: 0 },
  { day: "Jul 01", revenue: 0, profit: 0, orders: 0 },
  { day: "Jul 05", revenue: 0, profit: 0, orders: 0 },
  { day: "Jul 09", revenue: 0, profit: 0, orders: 0 },
  { day: "Jul 13", revenue: 0, profit: 0, orders: 0 },
  { day: "Jul 18", revenue: 0, profit: 0, orders: 0 },
];

export default function SalesOverview() {
  return (
    <DashboardCard
      className="h-full w-full"
      title="Revenue Overview"
      action={
        <button className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50">
          30 Days
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      }
    >
      <div className="flex h-full flex-col">

        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">

          <div className="min-w-0">

            <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              Total Revenue
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-3">

              <h2 className="text-2xl font-black tracking-tight text-slate-900 font-mono">
                ₹0
              </h2>

              <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">
                —
              </div>

            </div>

          </div>

          <div className="flex shrink-0 flex-nowrap items-center gap-3 whitespace-nowrap xl:justify-end">

            <Legend
              color="bg-blue-600"
              text="Revenue"
            />

            <Legend
              color="bg-emerald-500"
              text="Profit"
            />

            <Legend
              color="bg-violet-500"
              text="Orders"
            />

          </div>

        </div>

<div className="mt-5 h-[280px] w-full">

  <ResponsiveContainer
    width="100%"
    height={280}
  >

            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 5,
                left: -20,
                bottom: 0,
              }}
            >

              <defs>

                <linearGradient
                  id="revenueGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#2563eb"
                    stopOpacity={0.18}
                  />

                  <stop
                    offset="95%"
                    stopColor="#2563eb"
                    stopOpacity={0}
                  />
                </linearGradient>

                <linearGradient
                  id="profitGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#22c55e"
                    stopOpacity={0.14}
                  />

                  <stop
                    offset="95%"
                    stopColor="#22c55e"
                    stopOpacity={0}
                  />
                </linearGradient>
                                <linearGradient
                  id="ordersGradient"
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor="#8b5cf6"
                    stopOpacity={0.14}
                  />

                  <stop
                    offset="95%"
                    stopColor="#8b5cf6"
                    stopOpacity={0}
                  />
                </linearGradient>

              </defs>

              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke="#e5e7eb"
              />

              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                dy={8}
              />

              <YAxis
                tickLine={false}
                axisLine={false}
                width={55}
                tick={{
                  fill: "#64748b",
                  fontSize: 11,
                }}
                tickFormatter={(value) =>
                  `₹${value / 100000}L`
                }
              />

              <YAxis yAxisId="orders" hide domain={[0, 1]} />

              <Tooltip
                cursor={{
                  stroke: "#cbd5e1",
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
                content={(props) => <CustomTooltip {...props} />}
              />

              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#2563eb"
                strokeWidth={2.5}
                fill="url(#revenueGradient)"
                activeDot={{
                  r: 5,
                  strokeWidth: 3,
                  stroke: "#ffffff",
                }}
              />

              <Area
                type="monotone"
                dataKey="profit"
                stroke="#22c55e"
                strokeWidth={2.5}
                fill="url(#profitGradient)"
                activeDot={{
                  r: 5,
                  strokeWidth: 3,
                  stroke: "#ffffff",
                }}
              />

              <Area
                type="monotone"
                dataKey="orders"
                yAxisId="orders"
                stroke="#8b5cf6"
                strokeWidth={2.5}
                fill="url(#ordersGradient)"
                activeDot={{
                  r: 5,
                  strokeWidth: 3,
                  stroke: "#ffffff",
                }}
              />

            </AreaChart>

          </ResponsiveContainer>

        </div>

      </div>

    </DashboardCard>
  );
}

interface LegendProps {
  color: string;
  text: string;
}

function Legend({
  color,
  text,
}: LegendProps) {
  return (
    <div className="flex shrink-0 items-center gap-2">

      <div
        className={`h-2.5 w-2.5 rounded-full ${color}`}
      />

      <span className="text-xs font-medium text-slate-600">
        {text}
      </span>

    </div>
  );
}
function CustomTooltip({
  active,
  payload: unsafePayload,
  label,
}: {
  active?: boolean;
  payload?: any[];
  label?: string | number;
}) {
  if (!active || !unsafePayload?.length) {
    return null;
  }

  const payload = unsafePayload as unknown as readonly [
    { value: number },
    { value: number },
    { value: number },
  ];

  return (
    <div className="min-w-[220px] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">

      <p className="mb-4 text-sm font-semibold text-slate-900">
        {label}
      </p>

      <div className="space-y-3">

        <TooltipRow
          color="bg-blue-600"
          label="Revenue"
          value={`₹${payload[0].value.toLocaleString()}`}
        />

        <TooltipRow
          color="bg-emerald-500"
          label="Profit"
          value={`₹${payload[1].value.toLocaleString()}`}
        />

        <TooltipRow
          color="bg-violet-500"
          label="Orders"
          value={payload[2].value.toLocaleString()}
        />

      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">

        <div className="flex items-center justify-between">

          <span className="text-xs text-slate-500">
            Conversion
          </span>

          <span className="text-xs font-semibold text-slate-900">
            —
          </span>

        </div>

      </div>

    </div>
  );
}

interface TooltipRowProps {
  color: string;
  label: string;
  value: string;
}

function TooltipRow({
  color,
  label,
  value,
}: TooltipRowProps) {
  return (
    <div className="flex items-center justify-between">

      <div className="flex items-center gap-2">

        <div
          className={`h-2.5 w-2.5 rounded-full ${color}`}
        />

        <span className="text-sm text-slate-600">
          {label}
        </span>

      </div>

      <span className="text-sm font-semibold text-slate-900">
        {value}
      </span>

    </div>
  );
}
// End of file.

// No additional helpers are required.
// CustomTooltip and TooltipRow are the final components.
