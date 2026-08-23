"use client";

import { useMemo, useState } from "react";
import {
  Trophy,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import type { Product } from "@/lib/types/product";
import {
  MetricTile,
  WorkspacePanel,
} from "../shared/WorkspacePanel";

interface AnalyticsWorkspaceProps {
  product: Product;
}

function formatRevenue(value: number) {
  if (value >= 100000) {
    return `₹${(value / 1000).toFixed(1)}K`;
  }

  return `₹${value.toLocaleString("en-IN")}`;
}

export default function AnalyticsWorkspace({
  product,
}: AnalyticsWorkspaceProps) {
  const [range, setRange] = useState("30d");

  const channels = useMemo(() => {
    const totalRevenue = product.listings.reduce(
      (sum, listing) => sum + listing.revenue30Days,
      0,
    );

    return product.listings
      .map((listing) => {
        const share =
          totalRevenue > 0
            ? Math.round(
                (listing.revenue30Days / totalRevenue) * 100,
              )
            : 0;
        const estimatedRoi = Math.max(
          12,
          Math.min(
            65,
            Math.round(
              ((listing.sellingPrice - product.pricing.costPrice) /
                product.pricing.costPrice) *
                100 -
                (100 - (listing.healthScore ?? 80)) / 4,
            ),
          ),
        );
        const growth =
          listing.orders30Days > 40
            ? `+${Math.min(38, Math.round(listing.orders30Days / 6))}%`
            : `-${Math.max(2, 8 - Math.round(listing.orders30Days / 8))}%`;

        return {
          id: listing.id,
          name: listing.marketplace,
          revenue: listing.revenue30Days,
          orders: listing.orders30Days,
          roi: estimatedRoi,
          share,
          growth,
          positive: !growth.startsWith("-"),
        };
      })
      .sort((a, b) => b.revenue - a.revenue);
  }, [product]);

  const best = channels[0];
  const totalOrders = channels.reduce(
    (sum, channel) => sum + channel.orders,
    0,
  );
  const totalRevenue = channels.reduce(
    (sum, channel) => sum + channel.revenue,
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Performance
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Revenue, orders and ROI across connected marketplaces for this product.
          </p>
        </div>

        <select
          value={range}
          onChange={(event) => setRange(event.target.value)}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700"
          aria-label="Performance date range"
        >
          <option value="7d">Last 7 Days</option>
          <option value="14d">Last 14 Days</option>
          <option value="30d">Last 30 Days</option>
          <option value="90d">Last 90 Days</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Revenue"
          value={formatRevenue(totalRevenue)}
          hint={`Range ${range}`}
          tone="blue"
        />
        <MetricTile
          label="Orders"
          value={totalOrders}
          hint={`Today ${product.performance.ordersToday}`}
          tone="emerald"
        />
        <MetricTile
          label="Returns"
          value={`${product.performance.returnsPercentage}%`}
          hint="Product return rate"
          tone="rose"
        />
        <MetricTile
          label="Health Score"
          value={`${product.performance.healthScore}%`}
          hint="Composite product health"
          tone="violet"
        />
      </div>

      <WorkspacePanel
        title="Marketplace Performance"
        description="Channel contribution sorted by revenue for the selected period."
      >
        {channels.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
            No marketplace performance yet. Connect and publish listings to track channel revenue.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className="px-4 py-4 transition hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {channel.name}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        {channel.orders} Orders • ROI {channel.roi}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">
                        {formatRevenue(channel.revenue)}
                      </p>
                      <div
                        className={`mt-1 flex items-center justify-end gap-1 text-sm font-semibold ${
                          channel.positive
                            ? "text-emerald-600"
                            : "text-red-500"
                        }`}
                      >
                        {channel.positive ? (
                          <TrendingUp size={15} />
                        ) : (
                          <TrendingDown size={15} />
                        )}
                        {channel.growth}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Revenue Share</span>
                      <span className="font-semibold text-slate-700">
                        {channel.share}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${channel.share}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {best ? (
              <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100">
                    <Trophy size={20} className="text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Best Performing Marketplace
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-slate-900">
                      {best.name}
                    </h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Generated{" "}
                      <span className="font-semibold text-slate-900">
                        {formatRevenue(best.revenue)}
                      </span>{" "}
                      revenue and contributes{" "}
                      <span className="font-semibold text-emerald-600">
                        {best.share}%
                      </span>{" "}
                      of total product sales.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </WorkspacePanel>
    </div>
  );
}
