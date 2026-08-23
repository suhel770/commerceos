"use client";

import {
  Package2,
  AlertTriangle,
  Warehouse,
  RefreshCcw,
  ShieldCheck,
} from "lucide-react";

export default function InventorySection() {
  return (
    <div className="space-y-6">

      {/* Header */}

      <div className="flex items-center justify-between">

        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Inventory Management
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Configure inventory, stock availability, warehouse allocation and
            synchronization settings for your master listing.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
          No data yet
        </div>

      </div>

      {/* Summary */}

      <div className="grid gap-4 md:grid-cols-4">

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <Package2 className="h-6 w-6 text-indigo-600" />
          <h3 className="mt-4 text-3xl font-bold text-slate-900">0</h3>
          <p className="mt-1 text-sm text-slate-500">
            Available Units
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <Warehouse className="h-6 w-6 text-emerald-600" />
          <h3 className="mt-4 text-3xl font-bold text-slate-900">0</h3>
          <p className="mt-1 text-sm text-slate-500">
            Active Warehouses
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <AlertTriangle className="h-6 w-6 text-amber-500" />
          <h3 className="mt-4 text-3xl font-bold text-slate-900">0</h3>
          <p className="mt-1 text-sm text-slate-500">
            Low Stock Alerts
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <RefreshCcw className="h-6 w-6 text-violet-600" />
          <h3 className="mt-4 text-3xl font-bold text-slate-900">
            —
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Marketplace Sync
          </p>
        </div>

      </div>

      {/* Workspace */}

      <div className="grid gap-6 xl:grid-cols-2">

        <div className="rounded-3xl border border-slate-200 bg-white p-6">

          <h3 className="text-lg font-semibold text-slate-900">
            Stock Configuration
          </h3>

          <div className="mt-6 space-y-5">

            <div>
              <label className="text-sm font-medium text-slate-600">
                Available Stock
              </label>

              <input
                defaultValue="0"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">
                Reserved Stock
              </label>

              <input
                defaultValue="0"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600">
                Safety Stock
              </label>

              <input
                defaultValue="0"
                className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3"
              />
            </div>

          </div>

        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6">

          <h3 className="text-lg font-semibold text-slate-900">
            Inventory Intelligence
          </h3>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">

            <div className="flex items-center gap-3">

              <ShieldCheck className="h-6 w-6 text-slate-400" />

              <div>

                <h4 className="font-semibold text-slate-900">
                  CommerceOS AI
                </h4>

                <p className="text-sm text-slate-500">
                  No data yet
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
