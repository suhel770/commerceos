"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Boxes,
  Globe,
  AlertTriangle,
  Zap,
  TrendingDown,
  TrendingUp,
  Layers,
  ArrowRight,
  Package,
  CheckCircle,
  HelpCircle,
  Clock,
  Plus,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  MoreVertical,
  Bookmark,
  Rocket,
  Edit3,
  Send,
  Hourglass,
  CheckCircle2,
  BarChart2,
  ShieldCheck,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from "recharts";
import ProductControlHeader from "./ProductControlHeader";
import type { ProductDashboardData, AttentionItem, TopProductItem } from "@/lib/application/product-dashboard.application";

export default function ProductOverviewDashboard() {
  const router = useRouter();
  const [data, setData] = useState<ProductDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "90D">("7D");
  const [activities, setActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/products/dashboard");
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        throw new Error(json.error?.message || "Failed to load dashboard data");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching dashboard metrics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Fetch real audit logs for catalog activity timeline
  useEffect(() => {
    setLoadingActivities(true);
    fetch("/api/v1/settings/audit")
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          const filtered = json.data.filter(
            (log: any) =>
              log.action?.startsWith("product.") ||
              log.action?.startsWith("listing.") ||
              log.action?.startsWith("inventory.") ||
              log.entityType?.toLowerCase().includes("product")
          );
          setActivities(filtered);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingActivities(false));
  }, []);

  // Compute real catalog activity trend data for area chart
  const activityTrendData = useMemo(() => {
    if (!activities || activities.length === 0) return [];

    const daysLimit = timeRange === "7D" ? 7 : timeRange === "30D" ? 30 : 90;
    const cutoff = Date.now() - daysLimit * 24 * 60 * 60 * 1000;

    const filteredLogs = activities.filter(
      (log) => new Date(log.createdAt || Date.now()).getTime() >= cutoff
    );

    const groups: Record<
      string,
      { date: string; created: number; updated: number; timestamp: number }
    > = {};

    for (let i = daysLimit - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const key = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      groups[key] = {
        date: key,
        created: 0,
        updated: 0,
        timestamp: d.getTime(),
      };
    }

    filteredLogs.forEach((log) => {
      const key = new Date(log.createdAt || Date.now()).toLocaleDateString(
        "en-US",
        { month: "short", day: "numeric" }
      );
      if (groups[key]) {
        if (
          log.action === "product.created" ||
          log.action?.includes("create")
        ) {
          groups[key].created += 1;
        } else if (
          log.action === "product.updated" ||
          log.action?.includes("update") ||
          log.action?.includes("adjusted")
        ) {
          groups[key].updated += 1;
        }
      }
    });

    return Object.values(groups).sort((a, b) => a.timestamp - b.timestamp);
  }, [activities, timeRange]);

  // Loading Skeleton State
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <ProductControlHeader />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs animate-pulse flex flex-col justify-between"
            >
              <div className="h-3 w-20 bg-slate-100 rounded-md" />
              <div className="h-7 w-12 bg-slate-100 rounded-md" />
              <div className="h-2.5 w-24 bg-slate-100 rounded-md" />
            </div>
          ))}
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-[340px] rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Error State with Retry
  if (error || !data) {
    return (
      <div className="space-y-6">
        <ProductControlHeader />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-2xs">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 mb-4">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            Unable to load dashboard metrics
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md">
            {error || "An unexpected error occurred while communicating with the catalog data service."}
          </p>
          <button
            type="button"
            onClick={fetchDashboardData}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 cursor-pointer"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const {
    kpis,
    catalogStatus,
    listingPipeline,
    catalogHealth,
    inventoryHealth,
    attentionItems,
    marketplaceStats,
    topPerformingProducts,
    recentActivities,
  } = data;

  return (
    <div className="space-y-6">
      <ProductControlHeader />

      {/* Level 1: Primary KPIs Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {/* KPI 1: Total SKUs */}
        <div
          onClick={() => router.push("/products/list")}
          className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all duration-150 hover:border-blue-300 hover:shadow-sm cursor-pointer select-none"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total SKUs
            </p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 border border-blue-100 group-hover:scale-105 transition-transform">
              <Boxes size={14} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-2xl font-bold text-slate-900">{kpis.total}</h2>
            <span className="text-xs font-semibold text-emerald-600">
              Active Catalog
            </span>
          </div>
          <p className="mt-1 text-xs font-normal text-slate-400">
            Drill down database
          </p>
        </div>

        {/* KPI 2: Active SKUs */}
        <div
          onClick={() => router.push("/products/list?status=active")}
          className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all duration-150 hover:border-emerald-300 hover:shadow-sm cursor-pointer select-none"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active SKUs
            </p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 group-hover:scale-105 transition-transform">
              <CheckCircle size={14} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-2xl font-bold text-slate-900">{kpis.active}</h2>
            <span className="text-xs font-semibold text-emerald-600">
              Live
            </span>
          </div>
          <p className="mt-1 text-xs font-normal text-slate-400">
            Currently sellable
          </p>
        </div>

        {/* KPI 3: Listed */}
        <div
          onClick={() => router.push("/products/list?marketplace=all")}
          className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all duration-150 hover:border-indigo-300 hover:shadow-sm cursor-pointer select-none"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Listed
            </p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100 group-hover:scale-105 transition-transform">
              <Globe size={14} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-2xl font-bold text-slate-900">{kpis.listed}</h2>
            <span className="text-xs font-semibold text-indigo-600">
              Synced
            </span>
          </div>
          <p className="mt-1 text-xs font-normal text-slate-400">
            Published to channels
          </p>
        </div>

        {/* KPI 4: Pending to List */}
        <div
          onClick={() => router.push("/products/list?status=draft")}
          className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all duration-150 hover:border-amber-300 hover:shadow-sm cursor-pointer select-none"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pending to List
            </p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100 group-hover:scale-105 transition-transform">
              <Clock size={14} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-2xl font-bold text-slate-900">
              {kpis.pendingList}
            </h2>
            <span className="text-xs font-semibold text-amber-500">Draft</span>
          </div>
          <p className="mt-1 text-xs font-normal text-slate-400">
            Incomplete parameters
          </p>
        </div>

        {/* KPI 5: Listing Errors */}
        <div
          onClick={() => router.push("/products/list?status=error")}
          className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all duration-150 hover:border-rose-300 hover:shadow-sm cursor-pointer select-none"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Listing Errors
            </p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 text-rose-600 border border-rose-100 group-hover:scale-105 transition-transform">
              <AlertCircle size={14} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-2xl font-bold text-rose-600">
              {kpis.listingErrors}
            </h2>
            <span className="text-xs font-semibold text-rose-600">Errors</span>
          </div>
          <p className="mt-1 text-xs font-normal text-rose-500">
            Failed publications
          </p>
        </div>

        {/* KPI 6: Issues */}
        <div
          onClick={() => router.push("/products/list?health=attention")}
          className="group rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all duration-150 hover:border-amber-300 hover:shadow-sm cursor-pointer select-none"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Issues
            </p>
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100 group-hover:scale-105 transition-transform">
              <AlertTriangle size={14} />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <h2 className="text-2xl font-bold text-amber-600">
              {kpis.issues}
            </h2>
            <span className="text-xs font-semibold text-amber-600">Review</span>
          </div>
          <p className="mt-1 text-xs font-normal text-amber-500">
            Action required
          </p>
        </div>
      </div>

      {/* Level 2: Primary 4-Column Analytics Row (Matching Exact User Design) */}
      <div className="grid gap-5 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 items-stretch">
        {/* Card 1: CATALOG STATUS */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between min-h-[440px]">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                CATALOG STATUS
                <span title="Breakdown of physical catalog across listing and lifecycle states.">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-pointer" />
                </span>
              </h3>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
                aria-label="Options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            {/* Donut Chart */}
            <div className="relative flex items-center justify-center h-[130px] w-full mt-1">
              <div className="absolute flex flex-col items-center justify-center text-center select-none pointer-events-none">
                <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                  {catalogStatus.total}
                </span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      catalogStatus.total === 0
                        ? [{ name: "Empty", value: 1, color: "#f1f5f9" }]
                        : catalogStatus.segments.length > 0
                        ? catalogStatus.segments
                        : [{ name: "Active", value: 1, color: "#f59e0b" }]
                    }
                    cx="50%"
                    cy="50%"
                    startAngle={90}
                    endAngle={-270}
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={catalogStatus.segments.length > 1 ? 3 : 0}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {catalogStatus.segments.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || "#f59e0b"}
                        className="cursor-pointer transition hover:opacity-85"
                        onClick={() =>
                          router.push(`/products/list?${entry.filter}`)
                        }
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Label Outside Chart */}
            <p className="text-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              TOTAL SKUS
            </p>

            {/* Status Pills */}
            <div className="space-y-2 mt-4">
              {/* Active (Unlisted) / Active (Listed) Pill */}
              <div
                onClick={() => router.push("/products/list?status=active")}
                className="rounded-xl border border-slate-100 bg-slate-50/50 px-3.5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">
                    Active (Unlisted)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {kpis.active}
                  </span>
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                    {catalogStatus.total > 0
                      ? Math.round((kpis.active / catalogStatus.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>

              {/* Unlisted Pill */}
              <div
                onClick={() => router.push("/products/list?status=draft")}
                className="rounded-xl border border-slate-100 bg-slate-50/50 px-3.5 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-400 shrink-0" />
                  <span className="text-xs font-semibold text-slate-700">
                    Unlisted
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">
                    {kpis.pendingList}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    {catalogStatus.total > 0
                      ? Math.round((kpis.pendingList / catalogStatus.total) * 100)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Insight Callout Box */}
            <div className="mt-4 rounded-xl p-3 bg-amber-50/50 border border-amber-100 flex items-start gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-100 text-amber-600 shrink-0 mt-0.5">
                <Bookmark className="h-3.5 w-3.5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-amber-900">
                  {kpis.active === kpis.total && kpis.total > 0
                    ? "All SKUs are active"
                    : `${kpis.active} of ${kpis.total} SKUs active`}
                </p>
                <p className="text-[11px] font-medium text-amber-700/80 mt-0.5">
                  Keep it up! Your catalog is in great shape.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 pt-3.5 mt-4">
            <button
              onClick={() => router.push("/products/list")}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 transition uppercase tracking-wider cursor-pointer"
            >
              <span>VIEW ALL PRODUCTS</span>
              <ArrowRight size={14} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Card 2: LISTING PIPELINE STATUS */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between min-h-[440px]">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                LISTING PIPELINE STATUS
                <span title="Progress of catalog items from Draft to Published channel listings.">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-pointer" />
                </span>
              </h3>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
                aria-label="Options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            {/* Illustration / Header Graphic */}
            <div className="py-2 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 mx-auto mb-2 border border-purple-100/60 shadow-2xs">
                <Rocket className="h-7 w-7 text-purple-500" />
              </div>
              <p className="text-sm font-bold text-slate-800">
                {listingPipeline.total === 0 || kpis.listed === 0
                  ? "No listing activity yet"
                  : `${kpis.listed} Active Listings Live`}
              </p>
              <p className="text-xs font-medium text-slate-400 max-w-[220px] mx-auto mt-0.5">
                Connect channels and publish products to activate your listing pipeline.
              </p>
            </div>

            {/* Pipeline Stage Rows with Icons */}
            <div className="space-y-2 mt-4">
              {/* Draft */}
              <div
                onClick={() => router.push("/products/list?status=draft")}
                className="flex items-center justify-between text-xs py-1 px-1 rounded-lg hover:bg-slate-50 cursor-pointer transition"
              >
                <div className="flex items-center gap-2 w-28 shrink-0">
                  <Edit3 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span className="font-semibold text-slate-700">Draft</span>
                </div>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full mx-2 overflow-hidden">
                  <div
                    className="h-full bg-slate-400"
                    style={{
                      width: `${
                        listingPipeline.total > 0
                          ? Math.round(
                              (listingPipeline.stages[0]?.count /
                                listingPipeline.total) *
                                100
                            )
                          : 0
                      }%`,
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-600 shrink-0">
                  {listingPipeline.stages[0]?.count || 0} (
                  {listingPipeline.stages[0]?.percentage || 0}%)
                </span>
              </div>

              {/* Ready to List */}
              <div
                onClick={() => router.push("/products/list?health=optimal")}
                className="flex items-center justify-between text-xs py-1 px-1 rounded-lg hover:bg-slate-50 cursor-pointer transition"
              >
                <div className="flex items-center gap-2 w-28 shrink-0">
                  <Send className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                  <span className="font-semibold text-slate-700">Ready to List</span>
                </div>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full mx-2 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500"
                    style={{
                      width: `${listingPipeline.stages[1]?.percentage || 0}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-600 shrink-0">
                  {listingPipeline.stages[1]?.count || 0} (
                  {listingPipeline.stages[1]?.percentage || 0}%)
                </span>
              </div>

              {/* Pending */}
              <div
                onClick={() => router.push("/products/list")}
                className="flex items-center justify-between text-xs py-1 px-1 rounded-lg hover:bg-slate-50 cursor-pointer transition"
              >
                <div className="flex items-center gap-2 w-28 shrink-0">
                  <Hourglass className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span className="font-semibold text-slate-700">Pending</span>
                </div>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full mx-2 overflow-hidden">
                  <div
                    className="h-full bg-amber-500"
                    style={{
                      width: `${listingPipeline.stages[2]?.percentage || 0}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-600 shrink-0">
                  {listingPipeline.stages[2]?.count || 0} (
                  {listingPipeline.stages[2]?.percentage || 0}%)
                </span>
              </div>

              {/* Published */}
              <div
                onClick={() => router.push("/products/list?marketplace=all")}
                className="flex items-center justify-between text-xs py-1 px-1 rounded-lg hover:bg-slate-50 cursor-pointer transition"
              >
                <div className="flex items-center gap-2 w-28 shrink-0">
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span className="font-semibold text-slate-700">Published</span>
                </div>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full mx-2 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{
                      width: `${listingPipeline.stages[3]?.percentage || 0}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-600 shrink-0">
                  {listingPipeline.stages[3]?.count || 0} (
                  {listingPipeline.stages[3]?.percentage || 0}%)
                </span>
              </div>

              {/* Listing Error */}
              <div
                onClick={() => router.push("/products/list?status=error")}
                className="flex items-center justify-between text-xs py-1 px-1 rounded-lg hover:bg-slate-50 cursor-pointer transition"
              >
                <div className="flex items-center gap-2 w-28 shrink-0">
                  <AlertTriangle className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                  <span className="font-semibold text-slate-700">Listing Error</span>
                </div>
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full mx-2 overflow-hidden">
                  <div
                    className="h-full bg-rose-500"
                    style={{
                      width: `${listingPipeline.stages[4]?.percentage || 0}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-bold text-slate-600 shrink-0">
                  {listingPipeline.stages[4]?.count || 0} (
                  {listingPipeline.stages[4]?.percentage || 0}%)
                </span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 pt-3.5 mt-4">
            <button
              onClick={() => router.push("/products/list")}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 transition uppercase tracking-wider cursor-pointer"
            >
              <span>VIEW LISTING PIPELINE</span>
              <ArrowRight size={14} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Card 3: CATALOG HEALTH DISTRIBUTION */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between min-h-[440px]">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                CATALOG HEALTH DISTRIBUTION
                <span title="Average health and completeness score across all active products.">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-pointer" />
                </span>
              </h3>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
                aria-label="Options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            {/* Donut Gauge Chart */}
            <div className="relative flex items-center justify-center h-[130px] w-full mt-1">
              <div className="absolute flex flex-col items-center justify-center text-center select-none pointer-events-none">
                <span className="text-3xl font-black text-slate-900 tracking-tight leading-none">
                  {catalogHealth.averageScore}%
                </span>
              </div>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      {
                        name: "Average Health",
                        value: catalogHealth.averageScore,
                        color: "#2563eb",
                      },
                      {
                        name: "Remaining",
                        value: Math.max(0, 100 - catalogHealth.averageScore),
                        color: "#f1f5f9",
                      },
                    ]}
                    cx="50%"
                    cy="50%"
                    startAngle={90}
                    endAngle={-270}
                    innerRadius={48}
                    outerRadius={62}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    <Cell fill="#2563eb" />
                    <Cell fill="#f1f5f9" />
                  </Pie>
                  <Tooltip
                    formatter={(value: any, name: any) =>
                      name === "Remaining" ? [] : [`${value}%`, "Health Score"]
                    }
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Label Outside Chart */}
            <p className="text-center text-[11px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">
              AVERAGE HEALTH
            </p>

            {/* Health Segments List (Rearranged in Score Order: 90-100, 70-89, 50-69, 0-49) */}
            <div className="space-y-2 mt-3">
              {/* 1. Optimal (90-100) */}
              <div
                onClick={() => router.push("/products/list?health=optimal")}
                className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:text-emerald-600 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                  <span className="font-semibold text-slate-700">Optimal (90–100)</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-900">
                    {catalogHealth.segments.find((s) => s.name.includes("Optimal"))?.value || 0}
                  </span>
                  <span
                    className={`w-8 text-right font-bold ${
                      (catalogHealth.segments.find((s) => s.name.includes("Optimal"))?.value || 0) > 0
                        ? "text-emerald-600"
                        : "text-slate-400 font-medium"
                    }`}
                  >
                    {catalogHealth.segments.find((s) => s.name.includes("Optimal"))?.percentage || 0}%
                  </span>
                </div>
              </div>

              {/* 2. Good (70-89) */}
              <div
                onClick={() => router.push("/products/list?health=good")}
                className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:text-blue-600 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-blue-600 shrink-0" />
                  <span className="font-semibold text-slate-700">Good (70–89)</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-900">
                    {catalogHealth.segments.find((s) => s.name.includes("Good"))?.value || 0}
                  </span>
                  <span
                    className={`w-8 text-right font-bold ${
                      (catalogHealth.segments.find((s) => s.name.includes("Good"))?.value || 0) > 0
                        ? "text-blue-600"
                        : "text-slate-400 font-medium"
                    }`}
                  >
                    {catalogHealth.segments.find((s) => s.name.includes("Good"))?.percentage || 0}%
                  </span>
                </div>
              </div>

              {/* 3. Needs Attention (50-69) */}
              <div
                onClick={() => router.push("/products/list?health=attention")}
                className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:text-amber-600 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                  <span className="font-semibold text-slate-700">Needs Attention (50–69)</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-900">
                    {catalogHealth.segments.find((s) => s.name.includes("Needs Attention"))?.value || 0}
                  </span>
                  <span
                    className={`w-8 text-right font-bold ${
                      (catalogHealth.segments.find((s) => s.name.includes("Needs Attention"))?.value || 0) > 0
                        ? "text-amber-600"
                        : "text-slate-400 font-medium"
                    }`}
                  >
                    {catalogHealth.segments.find((s) => s.name.includes("Needs Attention"))?.percentage || 0}%
                  </span>
                </div>
              </div>

              {/* 4. Incomplete (0-49) */}
              <div
                onClick={() => router.push("/products/list?health=incomplete")}
                className="flex items-center justify-between text-xs py-0.5 cursor-pointer hover:text-rose-600 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                  <span className="font-semibold text-slate-700">Incomplete (0–49)</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold text-slate-900">
                    {catalogHealth.segments.find((s) => s.name.includes("Incomplete"))?.value || 0}
                  </span>
                  <span
                    className={`w-8 text-right font-bold ${
                      (catalogHealth.segments.find((s) => s.name.includes("Incomplete"))?.value || 0) > 0
                        ? "text-rose-600"
                        : "text-slate-400 font-medium"
                    }`}
                  >
                    {catalogHealth.segments.find((s) => s.name.includes("Incomplete"))?.percentage || 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Insight Callout Box */}
            <div className="mt-4 rounded-xl p-3 bg-blue-50/50 border border-blue-100 flex items-start gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-100 text-blue-600 shrink-0 mt-0.5">
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-900">
                  {catalogHealth.averageScore >= 70
                    ? "Good health!"
                    : catalogHealth.averageScore >= 50
                    ? "Moderate health"
                    : "Action required"}
                </p>
                <p className="text-[11px] font-medium text-blue-700/80 mt-0.5">
                  Your catalog quality is rated{" "}
                  {catalogHealth.averageScore >= 70
                    ? "good."
                    : catalogHealth.averageScore >= 50
                    ? "moderate."
                    : "low."}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 pt-3.5 mt-4">
            <button
              onClick={() => router.push("/products/list?health=attention")}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 transition uppercase tracking-wider cursor-pointer"
            >
              <span>IMPROVE CATALOG HEALTH</span>
              <ArrowRight size={14} className="text-slate-500" />
            </button>
          </div>
        </div>

        {/* Card 4: INVENTORY HEALTH SIGNALS */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between min-h-[440px]">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                INVENTORY HEALTH SIGNALS
                <span title="Available To Sell (ATS) stock availability categorized by safe stock thresholds.">
                  <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-pointer" />
                </span>
              </h3>
              <button
                type="button"
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
                aria-label="Options"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>

            {/* Signal Rows with Square Icons */}
            <div className="space-y-4 my-3">
              {/* Healthy Stock (>10) */}
              <div
                onClick={() => router.push("/products/list")}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0 group-hover:scale-105 transition-transform">
                  <Package className="h-4.5 w-4.5 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">
                      Healthy Stock (&gt;10)
                    </span>
                    <span className="font-bold text-slate-900">
                      {inventoryHealth.signals[0]?.count || 0} (
                      {inventoryHealth.signals[0]?.percentage || 0}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{
                        width: `${inventoryHealth.signals[0]?.percentage || 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Low Stock (1-10) */}
              <div
                onClick={() =>
                  router.push("/products/list?stockStatus=low-stock")
                }
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0 group-hover:scale-105 transition-transform">
                  <BarChart2 className="h-4.5 w-4.5 text-amber-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">
                      Low Stock (1–10)
                    </span>
                    <span className="font-bold text-slate-900">
                      {inventoryHealth.signals[1]?.count || 0} (
                      {inventoryHealth.signals[1]?.percentage || 0}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{
                        width: `${inventoryHealth.signals[1]?.percentage || 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Out of Stock (0) */}
              <div
                onClick={() =>
                  router.push("/products/list?stockStatus=out-of-stock")
                }
                className="flex items-center gap-3 cursor-pointer group"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0 group-hover:scale-105 transition-transform">
                  <AlertTriangle className="h-4.5 w-4.5 text-rose-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-slate-700">
                      Out of Stock (0)
                    </span>
                    <span className="font-bold text-slate-900">
                      {inventoryHealth.signals[2]?.count || 0} (
                      {inventoryHealth.signals[2]?.percentage || 0}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-500 rounded-full"
                      style={{
                        width: `${inventoryHealth.signals[2]?.percentage || 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Insight Callout Box */}
            <div className="mt-4 rounded-xl p-3 bg-emerald-50/50 border border-emerald-100 flex items-start gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 shrink-0 mt-0.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  {inventoryHealth.signals[1]?.count === 0 &&
                  inventoryHealth.signals[2]?.count === 0
                    ? "Inventory is healthy"
                    : "Inventory requires attention"}
                </p>
                <p className="text-[11px] font-medium text-emerald-700/80 mt-0.5">
                  {inventoryHealth.signals[1]?.count === 0 &&
                  inventoryHealth.signals[2]?.count === 0
                    ? "No low or out of stock items."
                    : `${inventoryHealth.signals[1]?.count + inventoryHealth.signals[2]?.count} items below safety thresholds.`}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 pt-3.5 mt-4">
            <button
              onClick={() => router.push("/products/list")}
              className="w-full flex items-center justify-between text-xs font-bold text-slate-700 hover:text-slate-900 transition uppercase tracking-wider cursor-pointer"
            >
              <span>VIEW INVENTORY</span>
              <ArrowRight size={14} className="text-slate-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Level 3: Marketplace Listing Status & Needs Your Attention */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-3">
        {/* Marketplace Listing Status */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-4 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            Marketplace Listing Status
            <span title="Live publishing state aggregated across all connected sales channels.">
              <HelpCircle className="h-3.5 w-3.5 text-slate-400 cursor-pointer" />
            </span>
          </h3>

          {marketplaceStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 h-[200px]">
              <Globe size={28} className="text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-800">
                No marketplaces connected
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Connect a sales channel to start tracking real listing performance.
              </p>
              <button
                type="button"
                onClick={() => router.push("/settings")}
                className="mt-3 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
              >
                Connect Marketplace
              </button>
            </div>
          ) : (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={marketplaceStats}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#f1f5f9"
                  />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748b", fontSize: 12, fontWeight: "600" }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: "1px solid #e2e8f0",
                      fontSize: 12,
                      fontWeight: "bold",
                    }}
                  />
                  <Bar
                    dataKey="published"
                    name="Published"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={14}
                  />
                  <Bar
                    dataKey="pending"
                    name="Pending"
                    fill="#eab308"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={14}
                  />
                  <Bar
                    dataKey="error"
                    name="Error"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Needs Your Attention Alert Rows (Prioritized) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Needs Your Attention
              </h3>
              <button
                type="button"
                onClick={() => router.push("/products/list")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition cursor-pointer"
              >
                View All
              </button>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto">
              {attentionItems.length === 0 ? (
                <div className="text-center py-8 rounded-xl border border-dashed border-slate-200 text-sm font-semibold text-slate-400">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mx-auto mb-1.5" />
                  Everything looks good!
                </div>
              ) : (
                attentionItems.map((item) => {
                  const isCritical = item.severity === "critical";
                  const isWarning = item.severity === "warning";
                  return (
                    <div
                      key={item.id}
                      onClick={() =>
                        router.push(`/products/list?${item.filter}`)
                      }
                      className={`flex items-center justify-between rounded-xl border p-2.5 transition cursor-pointer ${
                        isCritical
                          ? "border-rose-150 bg-rose-50/50 hover:bg-rose-50"
                          : isWarning
                          ? "border-amber-150 bg-amber-50/40 hover:bg-amber-50/80"
                          : "border-blue-150 bg-blue-50/30 hover:bg-blue-50/60"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        {isCritical ? (
                          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0" />
                        ) : isWarning ? (
                          <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                        ) : (
                          <Layers className="h-4 w-4 text-blue-500 shrink-0" />
                        )}
                        <div>
                          <p
                            className={`text-xs font-bold ${
                              isCritical
                                ? "text-rose-700"
                                : isWarning
                                ? "text-amber-700"
                                : "text-blue-700"
                            }`}
                          >
                            {item.title}
                          </p>
                          <p
                            className={`text-xs mt-0.5 ${
                              isCritical
                                ? "text-rose-600"
                                : isWarning
                                ? "text-amber-600"
                                : "text-slate-500"
                            }`}
                          >
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold flex items-center gap-0.5 whitespace-nowrap ${
                          isCritical
                            ? "text-rose-600"
                            : isWarning
                            ? "text-amber-600"
                            : "text-blue-600"
                        }`}
                      >
                        {item.actionLabel} <ArrowRight size={12} />
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Level 4: Catalog Activity Trend Area Chart */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
            Catalog Activity Trend
          </h3>
          <div className="flex gap-1 border border-slate-200 rounded-lg p-0.5 bg-slate-50 text-xs font-semibold text-slate-600 select-none">
            {(["7D", "30D", "90D"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-2.5 py-1 rounded-md cursor-pointer transition ${
                  timeRange === r
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "hover:text-slate-900"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {activityTrendData.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-400 font-medium h-[140px] flex flex-col items-center justify-center">
            <Clock size={24} className="text-slate-300 mb-1.5" />
            <p className="font-semibold text-slate-700">No catalog activity yet</p>
            <p className="text-xs text-slate-400 font-normal mt-0.5">
              Catalog activity will appear here as products are created, updated, and published.
            </p>
          </div>
        ) : (
          <div className="h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={activityTrendData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorUpdated" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid #e2e8f0",
                    fontSize: 12,
                    fontWeight: "bold",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="created"
                  name="Created"
                  stroke="#10b981"
                  fillOpacity={1}
                  fill="url(#colorCreated)"
                  strokeWidth={1.5}
                />
                <Area
                  type="monotone"
                  dataKey="updated"
                  name="Updated"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorUpdated)"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Level 5: Top Products & Recent Catalog Activity Timeline */}
      <div className="grid gap-5 grid-cols-1 lg:grid-cols-3">
        {/* Top Performing Products (Real Orders or Truthful Empty State) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Top Performing Products
              </h3>
              <span className="text-xs font-medium text-slate-400">
                Ranked by real order revenue
              </span>
            </div>

            {topPerformingProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400">
                <TrendingUp size={24} className="text-slate-300 mb-1.5" />
                <p className="text-sm font-semibold text-slate-800">
                  No performance data yet
                </p>
                <p className="text-xs text-slate-400 mt-0.5 max-w-sm">
                  Performance analytics will appear once order and sales data becomes available.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {topPerformingProducts.map((p, idx) => (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/products/${p.id}`)}
                    className="flex items-center justify-between py-2.5 hover:bg-slate-50 px-2 rounded-xl transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 line-clamp-1">
                          {p.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          SKU: <span className="font-mono">{p.sku}</span>
                          {p.brand ? ` • ${p.brand}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 font-mono">
                        ₹{p.revenue.toLocaleString("en-IN")}
                      </p>
                      <p className="text-xs text-slate-400">
                        {p.unitsSold} units sold ({p.ordersCount} orders)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Catalog Activity Feed (Real Audit Trail) */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs flex flex-col h-full min-h-[220px]">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 border-b border-slate-100 pb-2">
            Recent Catalog Activity
          </h3>

          {loadingActivities ? (
            <div className="py-6 text-center text-xs text-slate-400 font-medium">
              Loading activity feed...
            </div>
          ) : activities.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-400 font-medium space-y-1.5 my-auto">
              <Clock size={20} className="mx-auto text-slate-300" />
              <p className="font-semibold text-slate-700">No recent activity logs found</p>
            </div>
          ) : (
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[160px]">
              {activities.slice(0, 4).map((act) => (
                <div
                  key={act.id}
                  className="flex gap-2.5 items-start text-xs relative pl-3.5 border-l border-slate-200 pb-0.5"
                >
                  <span className="absolute -left-[4px] top-1.5 h-2 w-2 rounded-full bg-blue-500 border-2 border-white" />
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 capitalize">
                      {act.action?.replace("product.", "").replace("_", " ") || "Catalog Action"}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      By {act.actorName || "Operator"} •{" "}
                      {new Date(act.createdAt || Date.now()).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Level 6: Quick Actions Grid */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-3 border-b border-slate-100 pb-2">
          Quick Actions Shortcuts
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <button
            type="button"
            onClick={() => router.push("/products/list")}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            Manage Product List
          </button>
          <button
            type="button"
            onClick={() => router.push("/products/list?status=error")}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            Review Listing Errors
            {kpis.listingErrors > 0 && (
              <span className="rounded-full bg-rose-100 px-2 py-0.2 text-xs font-bold text-rose-700">
                {kpis.listingErrors}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push("/products/list?stockStatus=low-stock")}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            Review Low Stock
          </button>
          <button
            type="button"
            onClick={() => router.push("/products/consumables")}
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer shadow-2xs"
          >
            Review Consumables
          </button>
        </div>
      </div>
    </div>
  );
}
