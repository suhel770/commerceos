"use client";

import WorkspaceCard from "@/components/ui/WorkspaceCard";

import {
  Sparkles,
  TrendingUp,
  Package,
  ShieldCheck,
  CircleDollarSign,
  ArrowRight,
} from "lucide-react";

export default function ExecutiveSummaryCard() {
  return (
    <WorkspaceCard
      className="w-full"
      header={
        <div className="flex items-center justify-between px-6 py-3">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">

              <Sparkles
                size={22}
                className="text-violet-600"
              />

            </div>

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                CommerceOS AI Executive Summary
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                AI generated product performance summary
              </p>

            </div>

          </div>

          <div className="rounded-xl bg-emerald-50 px-5 py-3">

            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Overall Score
            </p>

            <h3 className="mt-1 text-3xl font-bold text-emerald-600">
              98 / 100
            </h3>

          </div>

        </div>
      }

      footer={
        <div className="flex items-center justify-between bg-slate-50 px-6 py-4">

          <button className="rounded-xl border border-slate-200 bg-white px-5 py-2 font-semibold transition hover:bg-slate-100">

            Open AI Copilot

          </button>

          <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2 font-semibold text-white transition hover:bg-slate-800">

            Generate Full Report

            <ArrowRight size={18} />

          </button>

        </div>
      }
    >
      <div className="p-3">

        <div className="rounded-3xl bg-gradient-to-r from-violet-50 via-blue-50 to-emerald-50 p-8">

          <h3 className="text-2xl font-bold text-slate-900">

            ✨ AI Executive Summary

          </h3>

          <p className="mt-5 text-[15px] leading-8 text-slate-700">

            This product is currently performing better than
            <span className="font-bold text-emerald-600">
              {" "}87%{" "}
            </span>
            of products in your catalogue.

            Revenue continues to grow steadily while inventory
            remains healthy across connected marketplaces.

            CommerceOS AI predicts an additional

            <span className="font-bold text-violet-700">
              {" "}₹18,400/month{" "}
            </span>

            in profit if the recommended pricing strategy is applied.

          </p>

        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">

            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">

              <TrendingUp
                size={20}
                className="text-emerald-600"
              />

            </div>

            <p className="text-sm text-slate-500">
              Revenue Growth
            </p>

            <h4 className="mt-2 text-3xl font-bold text-slate-900">
              +18%
            </h4>

            <p className="mt-2 text-sm text-emerald-600">
              Better than previous month
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">

            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">

              <Package
                size={20}
                className="text-blue-600"
              />

            </div>

            <p className="text-sm text-slate-500">
              Inventory Health
            </p>

            <h4 className="mt-2 text-3xl font-bold text-slate-900">
              14 Days
            </h4>

            <p className="mt-2 text-sm text-blue-600">
              Healthy stock available
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">

            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">

              <CircleDollarSign
                size={20}
                className="text-amber-600"
              />

            </div>

            <p className="text-sm text-slate-500">
              AI Opportunity
            </p>

            <h4 className="mt-2 text-3xl font-bold text-slate-900">
              ₹18.4K
            </h4>

            <p className="mt-2 text-sm text-violet-600">
              Estimated monthly profit
            </p>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">

            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">

              <ShieldCheck
                size={20}
                className="text-emerald-600"
              />

            </div>

            <p className="text-sm text-slate-500">
              Product Health
            </p>

            <h4 className="mt-2 text-3xl font-bold text-slate-900">
              Excellent
            </h4>

            <p className="mt-2 text-sm text-emerald-600">
              No critical issues detected
            </p>

          </div>

        </div>

        <div className="mt-8 rounded-3xl border border-violet-200 bg-gradient-to-r from-violet-50 via-white to-blue-50 p-6">

          <h3 className="text-xl font-bold text-slate-900">
            Recommended Next Actions
          </h3>

          <div className="mt-5 space-y-3">

                      <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">

            <div>

              <h4 className="font-semibold text-slate-900">
                Increase Amazon selling price by ₹20
              </h4>

              <p className="mt-1 text-sm text-slate-500">
                Estimated additional monthly profit of ₹18,400.
              </p>

            </div>

            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
              High Impact
            </span>

          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">

            <div>

              <h4 className="font-semibold text-slate-900">
                Restock Shopify Inventory
              </h4>

              <p className="mt-1 text-sm text-slate-500">
                Current stock is expected to last another 6 days.
              </p>

            </div>

            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
              Medium
            </span>

          </div>

          <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4">

            <div>

              <h4 className="font-semibold text-slate-900">
                Monitor Return Rate
              </h4>

              <p className="mt-1 text-sm text-slate-500">
                Returns increased by 2.1% compared to last week.
              </p>

            </div>

            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
              Attention
            </span>

          </div>

        </div>

      </div>
</div>
    </WorkspaceCard>
  );
}