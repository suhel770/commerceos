"use client";

import {
  TrendingUp,
  BarChart3,
  Sparkles,
  Target,
} from "lucide-react";

import StudioField from "../../shared/StudioField";

const marketplacePerformance: Array<{
  marketplace: string;
  revenue: string;
  growth: string;
  score: string;
}> = [];

const insightsTimeline: Array<{
  title: string;
  date: string;
  color: string;
}> = [];

const growthOpportunities: Array<{
  title: string;
  impact: string;
  progress: string;
}> = [];

export default function GrowthSection() {
  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex items-start justify-between">

        <div>

          <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            <TrendingUp className="h-4 w-4" />
            Growth Workspace
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Growth & Performance
          </h2>

          <p className="mt-2 max-w-3xl text-[15px] leading-7 text-slate-500">
            Understand how your product performs across marketplaces,
            discover optimization opportunities and let CommerceOS AI
            continuously improve visibility, conversions and revenue.
          </p>

        </div>

        <div className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">

              <Sparkles className="h-5 w-5 text-violet-600" />

            </div>

            <div>

              <p className="text-xs text-slate-500">
                Growth Score
              </p>

              <h3 className="text-2xl font-bold text-violet-700">
                0%
              </h3>

            </div>

          </div>

        </div>

      </div>

      <div className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50">

              <BarChart3 className="h-5 w-5 text-violet-600" />

            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Performance Snapshot
              </h3>

              <p className="text-sm text-slate-500">
                Current business metrics
              </p>

            </div>

          </div>

          <div className="space-y-5">

            <StudioField
              label="30 Day Revenue"
              value="₹0"
            />

            <StudioField
              label="Orders"
              value="0"
            />

            <StudioField
              label="Conversion Rate"
              value="0%"
            />

            <StudioField
              label="Average Rating"
              value="—"
            />

            <StudioField
              label="Return Rate"
              value="0%"
            />

            <StudioField
              label="Repeat Customers"
              value="0%"
            />

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">

              <Target className="h-5 w-5 text-emerald-600" />

            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Growth Objectives
              </h3>

              <p className="text-sm text-slate-500">
                CommerceOS AI targets
              </p>

            </div>

          </div>

          <div className="space-y-4">

            <p className="text-sm text-slate-500">No data yet</p>

          </div>

        </div>

      </div>
            <div className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6">

            <h3 className="text-lg font-semibold text-slate-900">
              Marketplace Performance
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Compare product performance across all sales channels.
            </p>

          </div>

          <div className="space-y-4">

            {marketplacePerformance.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              marketplacePerformance.map((item) => (
                <div
                  key={item.marketplace}
                  className="rounded-2xl border border-slate-200 p-5"
                >

                  <div className="flex items-start justify-between">

                    <div>

                      <h4 className="font-semibold text-slate-900">
                        {item.marketplace}
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">
                        Revenue {item.revenue}
                      </p>

                    </div>

                    <div className="text-right">

                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {item.growth}
                      </span>

                      <p className="mt-2 text-sm font-medium text-slate-600">
                        Health {item.score}
                      </p>

                    </div>

                  </div>

                </div>
              ))
            )}

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6">

            <h3 className="text-lg font-semibold text-slate-900">
              CommerceOS Growth Intelligence
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              AI recommendations based on marketplace trends and
              historical performance.
            </p>

          </div>

          <div className="space-y-4">

            <p className="text-sm text-slate-500">No data yet</p>

          </div>

        </div>

      </div>
            <div className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6">

            <h3 className="text-lg font-semibold text-slate-900">
              Product Insights Timeline
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Important performance milestones detected by CommerceOS AI.
            </p>

          </div>

          <div className="space-y-5">

            {insightsTimeline.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              insightsTimeline.map((item) => (
                <div
                  key={item.title}
                  className="flex gap-4"
                >

                  <div
                    className={`mt-2 h-3 w-3 rounded-full ${item.color}`}
                  />

                  <div>

                    <h4 className="font-semibold text-slate-900">
                      {item.title}
                    </h4>

                    <p className="mt-1 text-sm text-slate-500">
                      {item.date}
                    </p>

                  </div>

                </div>
              ))
            )}

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6">

            <h3 className="text-lg font-semibold text-slate-900">
              Growth Opportunities
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Estimated revenue opportunities identified by AI.
            </p>

          </div>

          <div className="space-y-5">

            {growthOpportunities.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              growthOpportunities.map((item) => (
                <div key={item.title}>

                  <div className="mb-2 flex items-center justify-between">

                    <div>

                      <h4 className="font-semibold text-slate-900">
                        {item.title}
                      </h4>

                      <p className="text-sm text-emerald-600">
                        {item.impact}
                      </p>

                    </div>

                    <span className="font-semibold text-slate-900">
                      {item.progress}
                    </span>

                  </div>

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                    <div
                      className="h-full rounded-full bg-violet-600"
                      style={{
                        width: item.progress,
                      }}
                    />

                  </div>

                </div>
              ))
            )}

          </div>

        </div>

      </div>
            {/* Workspace Footer */}

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">

        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h3 className="text-xl font-semibold text-slate-900">
              Growth Workspace Status
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              CommerceOS continuously analyzes product performance,
              marketplace trends, customer behavior and conversion data to
              identify new growth opportunities. AI recommendations are
              automatically prioritized based on expected business impact,
              helping your team focus on actions that generate the highest
              revenue.
            </p>

          </div>

          <div className="flex gap-10">

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Revenue Growth
              </p>

              <h3 className="mt-2 text-4xl font-bold text-emerald-600">
                0%
              </h3>

            </div>

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Opportunities
              </p>

              <h3 className="mt-2 text-4xl font-bold text-indigo-600">
                0
              </h3>

            </div>

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                AI Score
              </p>

              <h3 className="mt-2 text-4xl font-bold text-violet-600">
                0%
              </h3>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
