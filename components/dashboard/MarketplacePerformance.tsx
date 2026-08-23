"use client";

import { ChevronRight } from "lucide-react";
import DashboardCard from "./DashboardCard";

const marketplaces = [
  {
    name: "Amazon",
    logo: "/marketplaces/amazon.png",
    revenue: "₹0",
    orders: 0,
    growth: "—",
    color: "#94a3b8",
    sparkline: "0,14 10,14 20,14 30,14 40,14 50,14 60,14 70,14",
  },
  {
    name: "Flipkart",
    logo: "/marketplaces/flipkart.png",
    revenue: "₹0",
    orders: 0,
    growth: "—",
    color: "#94a3b8",
    sparkline: "0,14 10,14 20,14 30,14 40,14 50,14 60,14 70,14",
  },
  {
    name: "Meesho",
    logo: "/marketplaces/meesho.png",
    revenue: "₹0",
    orders: 0,
    growth: "—",
    color: "#94a3b8",
    sparkline: "0,14 10,14 20,14 30,14 40,14 50,14 60,14 70,14",
  },
  {
    name: "Shopify",
    logo: "/marketplaces/shopify.png",
    revenue: "₹0",
    orders: 0,
    growth: "—",
    color: "#94a3b8",
    sparkline: "0,14 10,14 20,14 30,14 40,14 50,14 60,14 70,14",
  },
];

export default function MarketplacePerformance() {
  return (
    <DashboardCard
      className="flex h-full w-full flex-col"
      contentClassName="flex min-h-0 flex-1 flex-col p-5"
      title="Marketplace Performance"
      action={
        <button className="text-sm font-semibold text-blue-600">View All</button>
      }
    >
      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(72px,.9fr)_minmax(42px,.55fr)_minmax(88px,.8fr)] gap-2 border-b pb-2 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
        <span>Marketplace</span>
        <span>Revenue</span>
        <span>Orders</span>
        <span className="text-right">Growth</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col divide-y divide-slate-100">
        {marketplaces.map((item) => (
          <div
            key={item.name}
            className="grid flex-1 grid-cols-[minmax(0,1.35fr)_minmax(72px,.9fr)_minmax(42px,.55fr)_minmax(88px,.8fr)] items-center gap-2 py-3.5"
          >
            <div className="flex min-w-0 items-center gap-2">
              <img
                src={item.logo}
                alt=""
                className="h-8 w-8 shrink-0 rounded-lg border border-slate-100"
              />
              <div className="min-w-0">
                <p className="truncate text-xs font-extrabold text-slate-900">{item.name}</p>
                <p className="text-[11px] text-slate-500 font-medium">No data yet</p>
              </div>
            </div>
            <p className="truncate text-xs font-mono font-bold text-slate-900">{item.revenue}</p>
            <p className="text-xs font-mono font-bold text-slate-900">{item.orders}</p>
            <div className="flex items-center justify-end gap-1">
              <svg
                className="hidden 2xl:block"
                width="56"
                height="28"
                viewBox="0 0 70 28"
              >
                <polyline
                  fill="none"
                  stroke={item.color}
                  strokeWidth="3"
                  points={item.sparkline}
                />
              </svg>
              <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">
                {item.growth}
              </span>
              <button aria-label={`Open ${item.name}`}>
                <ChevronRight className="h-4 w-4 text-slate-400" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
