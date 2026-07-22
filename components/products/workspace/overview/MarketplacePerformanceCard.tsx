"use client";

import WorkspaceCard from "@/components/ui/WorkspaceCard";

import {
  TrendingUp,
  TrendingDown,
  Trophy,
} from "lucide-react";

const marketplaces = [
  {
    id: 1,
    name: "Amazon",
    revenue: "₹92.3K",
    orders: 126,
    roi: "38%",
    share: "54%",
    growth: "+18%",
    positive: true,
  },
  {
    id: 2,
    name: "Flipkart",
    revenue: "₹58.4K",
    orders: 84,
    roi: "31%",
    share: "23%",
    growth: "+12%",
    positive: true,
  },
  {
    id: 3,
    name: "Meesho",
    revenue: "₹36.8K",
    orders: 53,
    roi: "24%",
    share: "11%",
    growth: "-4%",
    positive: false,
  },
  {
    id: 4,
    name: "Shopify",
    revenue: "₹18.8K",
    orders: 27,
    roi: "42%",
    share: "7%",
    growth: "+22%",
    positive: true,
  },
  {
    id: 5,
    name: "Website",
    revenue: "₹12.6K",
    orders: 18,
    roi: "61%",
    share: "5%",
    growth: "+38%",
    positive: true,
  },
];

export default function MarketplacePerformanceCard() {
  return (
    <WorkspaceCard
      height="h-[570px]"
      header={
        <div className="flex items-center justify-between px-6 py-5">

          <div>

            <h2 className="text-xl font-bold text-slate-900">
              Marketplace Performance
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Revenue, orders and ROI across connected marketplaces
            </p>

          </div>

          <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            View All
          </button>

        </div>
      }
      footer={
        <div className="flex items-center justify-between bg-slate-50 px-6 py-4">

          <span className="text-xs text-slate-500">
            Updated 2 minutes ago
          </span>

          <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            View Detailed Analytics →
          </button>

        </div>
      }
    >

      {/* Marketplace List */}

      <div className="divide-y divide-slate-100">

        {marketplaces.map((marketplace) => {
                      return (
            <div
              key={marketplace.id}
              className="px-6 py-4 transition-colors hover:bg-slate-50"
            >

              <div className="flex items-center justify-between">

                <div>

                  <h3 className="font-semibold text-slate-900">
                    {marketplace.name}
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {marketplace.orders} Orders • ROI {marketplace.roi}
                  </p>

                </div>

                <div className="text-right">

                  <p className="text-lg font-bold text-slate-900">
                    {marketplace.revenue}
                  </p>

                  <div
                    className={`mt-1 flex items-center justify-end gap-1 text-sm font-semibold ${
                      marketplace.positive
                        ? "text-emerald-600"
                        : "text-red-500"
                    }`}
                  >

                    {marketplace.positive ? (
                      <TrendingUp size={15} />
                    ) : (
                      <TrendingDown size={15} />
                    )}

                    {marketplace.growth}

                  </div>

                </div>

              </div>

              <div className="mt-3">

                <div className="mb-1 flex items-center justify-between text-xs">

                  <span className="text-slate-500">
                    Revenue Share
                  </span>

                  <span className="font-semibold text-slate-700">
                    {marketplace.share}
                  </span>

                </div>

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: marketplace.share,
                    }}
                  />

                </div>

              </div>

            </div>
          );

        })}

      </div>

      {/* Best Performer */}
            <div className="border-t border-slate-100 bg-gradient-to-r from-amber-50 to-yellow-50 px-6 py-5">

        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100">

            <Trophy
              size={20}
              className="text-amber-600"
            />

          </div>

          <div className="flex-1">

            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Best Performing Marketplace
            </p>

            <h3 className="mt-1 text-lg font-bold text-slate-900">
              Amazon
            </h3>

            <p className="mt-1 text-sm leading-6 text-slate-600">
              Generated{" "}
              <span className="font-semibold text-slate-900">
                ₹92.3K
              </span>{" "}
              revenue and contributes{" "}
              <span className="font-semibold text-emerald-600">
                54%
              </span>{" "}
              of total product sales.
            </p>

          </div>

        </div>

      </div>

    </WorkspaceCard>
  );
}