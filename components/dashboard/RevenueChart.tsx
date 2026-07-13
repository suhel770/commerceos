"use client";

import { useState } from "react";
import DashboardCard from "./DashboardCard";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
} from "recharts";

const data = [
  { name: "Mon", revenue: 12000 },
  { name: "Tue", revenue: 18000 },
  { name: "Wed", revenue: 16000 },
  { name: "Thu", revenue: 25000 },
  { name: "Fri", revenue: 22000 },
  { name: "Sat", revenue: 30000 },
  { name: "Sun", revenue: 28000 },
];

const filters = ["7D", "30D", "90D", "1Y"];

export default function RevenueChart() {
  const [activeFilter, setActiveFilter] = useState("7D");

  return (
    <DashboardCard
      title="Revenue Analytics"
      subtitle="Business Performance"
    >
      {/* Header */}

      <div className="mb-6 flex items-start justify-between">

        <div>

          <h3 className="text-4xl font-bold text-slate-900">
            ₹1,51,000
          </h3>

          <p className="mt-2 font-semibold text-emerald-600">
            ↑ 18.4% vs previous period
          </p>

        </div>

        <div className="flex rounded-xl bg-slate-100 p-1">

          {filters.map((filter) => (

            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition
              ${
                activeFilter === filter
                  ? "bg-white shadow text-slate-900"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {filter}
            </button>

          ))}

        </div>

      </div>

      {/* Chart */}

      <div className="h-44">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart data={data}>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#e5e7eb"
            />

            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
            />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{
                r: 4,
                strokeWidth: 2,
              }}
              activeDot={{
                r: 6,
              }}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

      {/* Bottom Stats */}

      <div className="mt-6 grid grid-cols-3 gap-4 border-t border-slate-200 pt-5">

        <div>

          <p className="text-sm text-slate-500">
            Orders
          </p>

          <h4 className="mt-1 text-xl font-bold">
            748
          </h4>

        </div>

        <div>

          <p className="text-sm text-slate-500">
            Avg Order
          </p>

          <h4 className="mt-1 text-xl font-bold">
            ₹624
          </h4>

        </div>

        <div>

          <p className="text-sm text-slate-500">
            Profit
          </p>

          <h4 className="mt-1 text-xl font-bold">
            ₹82,000
          </h4>

        </div>

      </div>

    </DashboardCard>
  );
}