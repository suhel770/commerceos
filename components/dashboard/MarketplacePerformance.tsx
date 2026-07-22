"use client";

import { ArrowUp, ChevronRight } from "lucide-react";
import DashboardCard from "./DashboardCard";

const marketplaces = [
  { name: "Amazon", logo: "/marketplaces/amazon.png", revenue: "₹6,24,520", orders: 643, growth: "+16.4%", color: "#22c55e", sparkline: "0,22 10,18 20,20 30,13 40,16 50,8 60,11 70,2" },
  { name: "Flipkart", logo: "/marketplaces/flipkart.png", revenue: "₹3,21,110", orders: 342, growth: "+9.8%", color: "#2563eb", sparkline: "0,22 10,20 20,16 30,19 40,13 50,12 60,9 70,4" },
  { name: "Meesho", logo: "/marketplaces/meesho.png", revenue: "₹1,82,340", orders: 198, growth: "+21.6%", color: "#ec4899", sparkline: "0,24 10,21 20,22 30,16 40,15 50,10 60,8 70,3" },
  { name: "Shopify", logo: "/marketplaces/shopify.png", revenue: "₹1,20,260", orders: 60, growth: "+6.2%", color: "#8b5cf6", sparkline: "0,24 10,22 20,20 30,21 40,16 50,14 60,12 70,7" },
];

export default function MarketplacePerformance() {
  return (
    <DashboardCard className="h-full w-full" contentClassName="flex h-full flex-col p-4" title="Marketplace Performance" action={<button className="text-sm font-semibold text-blue-600">View All</button>}>
      <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(72px,.9fr)_minmax(42px,.55fr)_minmax(88px,.8fr)] gap-2 border-b pb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <span>Marketplace</span><span>Revenue</span><span>Orders</span><span className="text-right">Growth</span>
      </div>
      <div className="flex flex-1 flex-col justify-around divide-y divide-slate-100">
        {marketplaces.map((item) => (
          <div key={item.name} className="grid grid-cols-[minmax(0,1.35fr)_minmax(72px,.9fr)_minmax(42px,.55fr)_minmax(88px,.8fr)] items-center gap-2 py-3.5">
            <div className="flex min-w-0 items-center gap-2"><img src={item.logo} alt="" className="h-8 w-8 shrink-0 rounded-lg" /><div className="min-w-0"><p className="truncate text-sm font-semibold">{item.name}</p><p className="text-xs text-slate-500">Marketplace</p></div></div>
            <p className="truncate text-sm font-semibold">{item.revenue}</p><p className="text-sm font-semibold">{item.orders}</p>
            <div className="flex items-center justify-end gap-1"><svg className="hidden 2xl:block" width="56" height="28" viewBox="0 0 70 28"><polyline fill="none" stroke={item.color} strokeWidth="3" points={item.sparkline} /></svg><span className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600"><ArrowUp className="h-3 w-3" />{item.growth}</span><button aria-label={`Open ${item.name}`}><ChevronRight className="h-4 w-4 text-slate-400" /></button></div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}
