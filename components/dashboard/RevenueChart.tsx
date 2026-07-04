"use client";
import DashboardCard from "./DashboardCard";

import {
  LineChart,
  Line,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
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

export default function RevenueChart() {
  return (
   <DashboardCard
  title="Revenue Analytics"
  subtitle="Last 7 Days"
>
        <div className="mb-6 flex items-center justify-between">

        <div className="text-right">
          <h3 className="text-3xl font-bold">
            ₹1,51,000
          </h3>

          <p className="text-green-600">
            ↑ 18.4%
          </p>
        </div>
      </div>

      <div className="h-80">

        <ResponsiveContainer width="100%" height="100%">

          <LineChart data={data}>

            <CartesianGrid strokeDasharray="3 3" />

            <XAxis dataKey="name" />

            <YAxis />

            <Tooltip />

            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#2563eb"
              strokeWidth={4}
            />

          </LineChart>

        </ResponsiveContainer>

      </div>

    </DashboardCard>
  );
}