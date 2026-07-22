"use client";

import { CalendarDays, ChevronDown, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

export default function DashboardControls() {
  const [dateOpen, setDateOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [range, setRange] = useState("Jul 18, 2026");
  const [filter, setFilter] = useState("All marketplaces");
  const chooseRange = (value: string) => { setRange(value); setDateOpen(false); };
  const chooseFilter = (value: string) => { setFilter(value); setFilterOpen(false); };

  return <div className="relative flex items-center gap-2">
    <div className="relative"><button onClick={() => { setDateOpen(!dateOpen); setFilterOpen(false); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm"><CalendarDays className="h-3.5 w-3.5" />{range}<ChevronDown className="h-3.5 w-3.5" /></button>{dateOpen && <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">{["Today", "Last 7 days", "Last 30 days", "This month"].map((value) => <button onClick={() => chooseRange(value)} key={value} className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-slate-50">{value}</button>)}</div>}</div>
    <div className="relative"><button onClick={() => { setFilterOpen(!filterOpen); setDateOpen(false); }} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 shadow-sm"><SlidersHorizontal className="h-3.5 w-3.5" />{filter}<ChevronDown className="h-3.5 w-3.5" /></button>{filterOpen && <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">{["All marketplaces", "Amazon", "Flipkart", "Meesho", "Shopify"].map((value) => <button onClick={() => chooseFilter(value)} key={value} className="block w-full rounded px-3 py-2 text-left text-xs hover:bg-slate-50">{value}</button>)}</div>}</div>
  </div>;
}
