"use client";

import {
  IndianRupee,
  Percent,
  Receipt,
  Sparkles,
} from "lucide-react";

import StudioField from "../../shared/StudioField";

const marketplacePricing: Array<{
  name: string;
  subtitle: string;
  price: string;
}> = [];

export default function CommercialSection() {
  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex items-start justify-between">

        <div>

          <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <IndianRupee className="h-4 w-4" />
            Commercial Workspace
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Pricing & Commercials
          </h2>

          <p className="mt-2 max-w-3xl text-[15px] leading-7 text-slate-500">
            Manage pricing, taxes, margins, discounts and profitability
            from a single master commercial workspace used by every
            marketplace.
          </p>

        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
              <Sparkles className="h-5 w-5 text-emerald-600" />
            </div>

            <div>

              <p className="text-xs text-slate-500">
                Profit Score
              </p>

              <h3 className="text-2xl font-bold text-emerald-700">
                0%
              </h3>

            </div>

          </div>

        </div>

      </div>

      <div className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <IndianRupee className="h-5 w-5 text-emerald-600" />
            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Pricing
              </h3>

              <p className="text-sm text-slate-500">
                Master pricing information
              </p>

            </div>

          </div>

          <div className="space-y-5">

            <StudioField
              label="Selling Price"
              value="₹0"
            />

            <StudioField
              label="MRP"
              value="₹0"
            />

            <StudioField
              label="Cost Price"
              value="₹0"
            />

            <StudioField
              label="Minimum Price"
              value="₹0"
            />

            <StudioField
              label="Maximum Price"
              value="₹0"
            />

          </div>

        </div>
                <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
              <Percent className="h-5 w-5 text-orange-600" />
            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Taxes & Margins
              </h3>

              <p className="text-sm text-slate-500">
                GST, marketplace fees and profitability
              </p>

            </div>

          </div>

          <div className="space-y-5">

            <StudioField
              label="GST Rate"
              value="—"
            />

            <StudioField
              label="Marketplace Commission"
              value="0%"
            />

            <StudioField
              label="Shipping Cost"
              value="₹0"
            />

            <StudioField
              label="Estimated Profit"
              value="₹0"
            />

            <StudioField
              label="Gross Margin"
              value="0%"
            />

            <StudioField
              label="Net Margin"
              value="0%"
            />

          </div>

          <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">

            <h4 className="font-semibold text-slate-900">
              Profitability Analysis
            </h4>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              No data yet
            </p>

          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">

            <div className="flex items-start gap-3">

              <Sparkles className="mt-1 h-5 w-5 text-slate-400" />

              <div>

                <h4 className="font-semibold text-slate-900">
                  AI Recommendation
                </h4>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  No data yet
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>
            <div className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Marketplace Pricing
              </h3>

              <p className="text-sm text-slate-500">
                Channel specific pricing strategy
              </p>

            </div>

          </div>

          <div className="space-y-4">

            {marketplacePricing.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              marketplacePricing.map((item) => (
                <div
                  key={item.name}
                  className="rounded-2xl border border-slate-200 p-5"
                >

                  <div className="flex items-center justify-between">

                    <div>

                      <h4 className="font-semibold text-slate-900">
                        {item.name}
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">
                        {item.subtitle}
                      </p>

                    </div>

                    <span className="text-lg font-bold text-slate-900">
                      {item.price}
                    </span>

                  </div>

                </div>
              ))
            )}

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50">
              <Sparkles className="h-5 w-5 text-violet-600" />
            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                CommerceOS Pricing Intelligence
              </h3>

              <p className="text-sm text-slate-500">
                AI powered pricing recommendations
              </p>

            </div>

          </div>

          <div className="space-y-4">

            <p className="text-sm text-slate-500">No data yet</p>

          </div>

        </div>

      </div>
            {/* Workspace Footer */}

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">

        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h3 className="text-xl font-semibold text-slate-900">
              Commercial Workspace Status
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              Pricing, taxes and marketplace commercial rules sync from your
              master product data. CommerceOS monitors pricing, margins and
              competitor movements before every publish.
            </p>

          </div>

          <div className="flex gap-10">

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Margin
              </p>

              <h3 className="mt-2 text-4xl font-bold text-emerald-600">
                0%
              </h3>

            </div>

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Profit
              </p>

              <h3 className="mt-2 text-4xl font-bold text-blue-600">
                ₹0
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
