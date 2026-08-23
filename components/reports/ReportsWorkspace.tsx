"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowUpRight,
  BarChart3,
  ChevronDown,
  Download,
  FileText,
  Filter,
  GripVertical,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { safeResponseJson } from "@/lib/api/client";
import { useReorderableKpis } from "@/components/ui/kpi";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const REPORTS_KPI_ORDER_KEY = "commerceos_reports_kpi_order_v1";

type ReportKpiKey = "revenue" | "orders" | "aov" | "returns";
const defaultReportKeys: ReportKpiKey[] = ["revenue", "orders", "aov", "returns"];

export default function ReportsWorkspace() {
  const [period, setPeriod] = useState("This Year");
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const fetchReportsData = async () => {
    try {
      const res = await fetch(`/api/v1/reports/analytics?period=${encodeURIComponent(period)}`);
      const payload = await safeResponseJson(res);
      setAnalyticsData(payload?.data || payload);
    } catch {}
  };

  useEffect(() => {
    fetchReportsData();
  }, [period]);

  const kpis = analyticsData?.kpis || {};
  const totalRevenue = Number(kpis.totalRevenue || 0);
  const totalOrders = Number(kpis.totalOrders || kpis.totalBills || 0);
  const avgOrderValue = Number(kpis.avgOrderValue || 0);
  const returnRate = Number(kpis.returnRate || 0);

  const reportCards = useMemo(() => [
    {
      id: "revenue" as ReportKpiKey,
      label: "Total Revenue",
      value: `₹${totalRevenue.toLocaleString("en-IN")}`,
      change: totalRevenue > 0 ? "+100%" : "0%",
      trend: "up",
      sub: "live SOT balance",
      color: "emerald",
    },
    {
      id: "orders" as ReportKpiKey,
      label: "Total Orders / Bills",
      value: totalOrders.toString(),
      change: totalOrders > 0 ? "+100%" : "0%",
      trend: "up",
      sub: "live orders & bills",
      color: "indigo",
    },
    {
      id: "aov" as ReportKpiKey,
      label: "Avg Order Value",
      value: `₹${avgOrderValue.toLocaleString("en-IN")}`,
      change: "0%",
      trend: "up",
      sub: "average transaction size",
      color: "violet",
    },
    {
      id: "returns" as ReportKpiKey,
      label: "Return Rate",
      value: `${returnRate.toFixed(1)}%`,
      change: "0%",
      trend: "down",
      sub: "cancelled & returned orders",
      color: "rose",
    },
  ], [totalRevenue, totalOrders, avgOrderValue, returnRate]);

  const {
    order,
    isReordered,
    resetOrder,
    getCardDragProps,
  } = useReorderableKpis<ReportKpiKey>({
    storageKey: REPORTS_KPI_ORDER_KEY,
    defaultOrder: defaultReportKeys,
  });

  const cardMap = useMemo(() => {
    const map = new Map<ReportKpiKey, typeof reportCards[0]>();
    for (const c of reportCards) {
      map.set(c.id, c);
    }
    return map;
  }, [reportCards]);

  const topSkus = (analyticsData?.topSkus || []).map((s: any) => ({
    name: s.name,
    sku: s.sku,
    units: Number(s.units || 0),
    revenue: `₹${Number(s.revenue || 0).toLocaleString("en-IN")}`,
    share: Number(s.share || 0),
  }));

  const channelData = analyticsData?.channels || [
    { name: "Amazon", value: 0, color: "#f59e0b" },
    { name: "Website", value: 0, color: "#6366f1" },
    { name: "Flipkart", value: 0, color: "#10b981" },
  ];

  const monthlyTrend = analyticsData?.monthlyRevenue || MONTHS.map((m) => ({ month: m, revenueLakhs: 0 }));
  const revenueData = monthlyTrend.map((m: any) => Number(m.revenueLakhs || 0));
  const maxRev = Math.max(1, ...revenueData);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <span className="text-[11px] font-extrabold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
            CommerceOS Analytics & Reporting Center
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-0.5">Business Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time performance across sales, inventory, and channels.</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:border-slate-300 shadow-xs transition"
              onClick={() => setPeriod((p) => (p === "This Year" ? "Last 30 Days" : p === "Last 30 Days" ? "Last 90 Days" : "This Year"))}
            >
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              {period}
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              fetchReportsData();
            }}
            className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
          </button>

          <button
            type="button"
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="space-y-1.5">
        {isReordered && (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={resetOrder}
              className="text-[10px] font-extrabold text-violet-600 hover:text-violet-800 transition-colors cursor-pointer"
            >
              Reset Order
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {order.map((key, index) => {
            const card = cardMap.get(key);
            if (!card) return null;

            const dragProps = getCardDragProps(index);
            const { isDragging, isOver } = dragProps;

            return (
              <div
                key={card.id}
                {...dragProps}
                className={`group relative rounded-2xl border bg-white p-4 shadow-xs transition-all duration-200 select-none cursor-grab active:cursor-grabbing space-y-1 ${
                  isDragging
                    ? "opacity-40 scale-95 border-dashed border-violet-400"
                    : isOver
                      ? "border-violet-500 ring-2 ring-violet-200 scale-102 shadow-md bg-violet-50/20"
                      : "border-slate-200/80 hover:shadow-sm hover:border-slate-300"
                }`}
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 pointer-events-none">
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">
                  {card.label}
                </span>
                <span className="text-2xl font-black text-slate-900 block">{card.value}</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-bold flex items-center gap-0.5 ${
                      card.trend === "up" && card.color !== "rose"
                        ? "text-emerald-600"
                        : card.color === "rose"
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }`}
                  >
                    {card.trend === "up" ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {card.change}
                  </span>
                  <span className="text-[10px] text-slate-400">{card.sub}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Revenue Chart + Channel Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">Monthly Revenue</h3>
              <p className="text-[11px] text-slate-500">Lakhs (₹) — {period}</p>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
              {totalRevenue > 0 ? "↑ Real SOT Data" : "Zero Revenue State"}
            </span>
          </div>

          {/* Bar Chart */}
          <div className="flex items-end gap-1.5 h-36">
            {revenueData.map((val: number, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full bg-indigo-500 hover:bg-indigo-600 rounded-t-md transition cursor-pointer group relative"
                  style={{ height: `${(val / maxRev) * 100}%` }}
                  title={`${MONTHS[i]}: ₹${val}L`}
                >
                  {val > 0 && (
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 hidden group-hover:block text-[8px] font-bold text-slate-700 whitespace-nowrap bg-white border border-slate-200 rounded px-1 py-0.5 shadow-xs">
                      ₹{val}L
                    </div>
                  )}
                </div>
                <span className="text-[8px] font-bold text-slate-400">{MONTHS[i].slice(0, 1)}</span>
              </div>
            ))}
          </div>

          {/* Orders line below */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-4 text-[10px] text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-indigo-500 rounded-sm inline-block" />
              Revenue (₹L)
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-500 inline-block" />
              Orders ({totalOrders} records)
            </div>
          </div>
        </div>

        {/* Channel Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <h3 className="text-sm font-black text-slate-900 mb-1">Sales by Channel</h3>
          <p className="text-[11px] text-slate-500 mb-4">Revenue distribution</p>

          {/* Stacked bar */}
          <div className="h-4 rounded-full overflow-hidden flex mb-4 bg-slate-100">
            {channelData.map((c: any) => (
              <div key={c.name} style={{ width: `${c.value}%`, backgroundColor: c.color }} title={`${c.name}: ${c.value}%`} />
            ))}
          </div>

          <div className="space-y-2.5">
            {channelData.map((c: any) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                  <span className="text-xs font-bold text-slate-700">{c.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${c.value}%`, backgroundColor: c.color }} />
                  </div>
                  <span className="text-[10px] font-black text-slate-700 w-6 text-right">{c.value}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
            Source: CommerceOS Order Engine SOT
          </div>
        </div>
      </div>

      {/* Top SKUs Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-black text-slate-900">Top Revenue SKUs</h3>
            <p className="text-[11px] text-slate-500">Best performing products by revenue share</p>
          </div>
        </div>

        {topSkus.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">#</th>
                  <th className="text-left py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Product</th>
                  <th className="text-left py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">SKU</th>
                  <th className="text-right py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Units</th>
                  <th className="text-right py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Revenue</th>
                  <th className="text-left py-2 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-4">Share</th>
                </tr>
              </thead>
              <tbody>
                {topSkus.map((sku: any, i: number) => (
                  <tr key={sku.sku} className="border-b border-slate-50 hover:bg-slate-50 transition">
                    <td className="py-2.5 pr-3 font-black text-slate-400">#{i + 1}</td>
                    <td className="py-2.5 font-bold text-slate-900">{sku.name}</td>
                    <td className="py-2.5 text-slate-400 font-mono">{sku.sku}</td>
                    <td className="py-2.5 text-right font-bold text-slate-700">{sku.units.toLocaleString()}</td>
                    <td className="py-2.5 text-right font-black text-emerald-700">{sku.revenue}</td>
                    <td className="py-2.5 pl-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${sku.share}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-slate-500 w-7">{sku.share}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-400 text-xs font-semibold">
            No SKU sales or stock records yet. Create purchase bills or receive stock to generate report tables.
          </div>
        )}
      </div>

      {/* AI Insight Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-4 flex items-center gap-4 text-white border border-indigo-900/40">
        <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-500/30 shrink-0">
          <Sparkles className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-white">AI Report Insight</p>
          <p className="text-[11px] text-slate-300 mt-0.5">
            {totalRevenue > 0
              ? `Realtime Analytics: ₹${totalRevenue.toLocaleString("en-IN")} total volume active across ${topSkus.length} SKUs.`
              : "System operating at clean zero state. Create purchase bills or receive stock to generate live AI report intelligence."}
          </p>
        </div>
      </div>
    </div>
  );
}
