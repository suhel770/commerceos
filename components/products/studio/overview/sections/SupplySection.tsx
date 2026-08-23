"use client";

import {
  Truck,
  Warehouse,
  PackageCheck,
  Sparkles,
} from "lucide-react";

import StudioField from "../../shared/StudioField";

const suppliers: Array<{
  supplier: string;
  location: string;
  status: string;
  lead: string;
}> = [];

const purchaseHistory: string[][] = [];

export default function SupplySection() {
  return (
    <div className="space-y-8">

      {/* Header */}

      <div className="flex items-start justify-between">

        <div>

          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
            <Truck className="h-4 w-4" />
            Supply Workspace
          </div>

          <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
            Supply Chain
          </h2>

          <p className="mt-2 max-w-3xl text-[15px] leading-7 text-slate-500">
            Configure procurement, warehouse sourcing, vendor mapping,
            replenishment and inbound inventory for this product across
            your CommerceOS supply network.
          </p>

        </div>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 px-5 py-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
              <Sparkles className="h-5 w-5 text-indigo-600" />
            </div>

            <div>

              <p className="text-xs text-slate-500">
                Supply Health
              </p>

              <h3 className="text-2xl font-bold text-indigo-700">
                0%
              </h3>

            </div>

          </div>

        </div>

      </div>

      <div className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50">
              <Warehouse className="h-5 w-5 text-indigo-600" />
            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Warehouse Configuration
              </h3>

              <p className="text-sm text-slate-500">
                Primary inventory source
              </p>

            </div>

          </div>

          <div className="space-y-5">

            <StudioField
              label="Primary Warehouse"
              value="—"
            />

            <StudioField
              label="Warehouse Code"
              value="—"
            />

            <StudioField
              label="Storage Zone"
              value="—"
            />

            <StudioField
              label="Safety Stock"
              value="0 Units"
            />

            <StudioField
              label="Reorder Level"
              value="0 Units"
            />

            <StudioField
              label="Fulfillment Method"
              value="—"
            />

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6 flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
              <PackageCheck className="h-5 w-5 text-emerald-600" />
            </div>

            <div>

              <h3 className="text-lg font-semibold text-slate-900">
                Procurement
              </h3>

              <p className="text-sm text-slate-500">
                Vendor and purchase planning
              </p>

            </div>

          </div>

          <div className="space-y-5">

            <StudioField
              label="Primary Supplier"
              value="—"
            />

            <StudioField
              label="Lead Time"
              value="—"
            />

            <StudioField
              label="Minimum Order Qty"
              value="0"
            />

            <StudioField
              label="Purchase Cost"
              value="₹0"
            />

            <StudioField
              label="Last Procurement"
              value="—"
            />

          </div>

        </div>

      </div>
            <div className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6">

            <h3 className="text-lg font-semibold text-slate-900">
              Replenishment Planning
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Automatic stock replenishment recommendations.
            </p>

          </div>

          <div className="space-y-4">

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

              <div className="flex items-center justify-between">

                <div>

                  <h4 className="font-semibold text-slate-900">
                    Current Stock
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    No data yet
                  </p>

                </div>

                <span className="text-3xl font-bold text-slate-700">
                  0
                </span>

              </div>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

              <div className="flex items-center justify-between">

                <div>

                  <h4 className="font-semibold text-slate-900">
                    Recommended Purchase
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    No data yet
                  </p>

                </div>

                <span className="text-3xl font-bold text-slate-700">
                  0
                </span>

              </div>

            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

              <div className="flex items-center justify-between">

                <div>

                  <h4 className="font-semibold text-slate-900">
                    Days Remaining
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    No data yet
                  </p>

                </div>

                <span className="text-3xl font-bold text-slate-700">
                  0
                </span>

              </div>

            </div>

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6">

            <h3 className="text-lg font-semibold text-slate-900">
              CommerceOS Supply Intelligence
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              AI powered procurement insights.
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
              Supplier Network
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Approved suppliers for this product.
            </p>

          </div>

          <div className="space-y-4">

            {suppliers.length === 0 ? (
              <p className="text-sm text-slate-500">No data yet</p>
            ) : (
              suppliers.map((supplier) => (
                <div
                  key={supplier.supplier}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex items-start justify-between">

                    <div>

                      <h4 className="font-semibold text-slate-900">
                        {supplier.supplier}
                      </h4>

                      <p className="mt-1 text-sm text-slate-500">
                        {supplier.location}
                      </p>

                    </div>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {supplier.status}
                    </span>

                  </div>

                  <div className="mt-4 flex items-center justify-between text-sm">

                    <span className="text-slate-500">
                      Lead Time
                    </span>

                    <span className="font-semibold text-slate-900">
                      {supplier.lead}
                    </span>

                  </div>

                </div>
              ))
            )}

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-7">

          <div className="mb-6">

            <h3 className="text-lg font-semibold text-slate-900">
              Purchase History
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Recent procurement activity.
            </p>

          </div>

          {purchaseHistory.length === 0 ? (
            <p className="text-sm text-slate-500">No data yet</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200">

              <table className="w-full text-sm">

                <thead className="bg-slate-50">

                  <tr>

                    <th className="px-4 py-3 text-left font-semibold">
                      Date
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Qty
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Cost
                    </th>

                    <th className="px-4 py-3 text-left font-semibold">
                      Status
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {purchaseHistory.map((row) => (
                    <tr
                      key={row[0]}
                      className="border-t border-slate-100"
                    >
                      {row.map((cell) => (
                        <td
                          key={cell}
                          className="px-4 py-3"
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}

                </tbody>

              </table>

            </div>
          )}

        </div>

      </div>
            {/* Workspace Footer */}

      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7">

        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <h3 className="text-xl font-semibold text-slate-900">
              Supply Workspace Status
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
              Procurement, warehouse mapping and replenishment rules sync
              from your supply configuration. CommerceOS monitors inventory
              health, supplier lead times and future demand to prevent
              stock-outs.
            </p>

          </div>

          <div className="flex gap-10">

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Suppliers
              </p>

              <h3 className="mt-2 text-4xl font-bold text-indigo-600">
                0
              </h3>

            </div>

            <div className="text-center">

              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Coverage
              </p>

              <h3 className="mt-2 text-4xl font-bold text-emerald-600">
                0 Days
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
