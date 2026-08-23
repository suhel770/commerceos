"use client";

import React, { useMemo } from "react";
import { Boxes, Package, AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import {
  ReorderableKpiSection,
  type KpiItemDefinition,
} from "@/components/ui/kpi";
import type { ConsumableItem } from "@/lib/consumables/consumable.service";

interface ConsumablesKPIStripProps {
  consumables?: ConsumableItem[];
}

export type ConsumableKpiId =
  | "total_consumables"
  | "available_units"
  | "low_stock"
  | "used_consumed"
  | "reorder_needed";

const DEFAULT_KPI_ORDER: ConsumableKpiId[] = [
  "total_consumables",
  "available_units",
  "low_stock",
  "used_consumed",
  "reorder_needed",
];

export default function ConsumablesKPIStrip({ consumables = [] }: ConsumablesKPIStripProps) {
  const metrics = useMemo(() => {
    const total = consumables.length;
    let availableUnits = 0;
    let lowStockCount = 0;
    let usedUnits = 0;
    let reorderNeededCount = 0;

    for (const c of consumables) {
      availableUnits += c.available || 0;
      usedUnits += c.used || 0;
      if (c.available <= (c.reorderPoint || 25)) {
        lowStockCount += 1;
      }
      if (c.available <= 0 || c.available <= (c.reorderPoint || 25)) {
        reorderNeededCount += 1;
      }
    }

    return {
      total,
      availableUnits,
      lowStockCount,
      usedUnits,
      reorderNeededCount,
    };
  }, [consumables]);

  const kpiItems: KpiItemDefinition<ConsumableKpiId>[] = [
    {
      id: "total_consumables",
      render: () => (
        <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-slate-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Total Consumables
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-900">
                {metrics.total}
              </h2>
              <p className="mt-1 text-[10px] font-semibold text-blue-600">
                Packaging & Materials
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
              <Boxes className="h-4 w-4" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "available_units",
      render: () => (
        <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-slate-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Available Units
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-emerald-600">
                {metrics.availableUnits.toLocaleString()}
              </h2>
              <p className="mt-1 text-[10px] font-semibold text-emerald-600">
                On-Hand Physical Stock
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600">
              <Package className="h-4 w-4" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "low_stock",
      render: () => (
        <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-slate-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Low Stock SKUs
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-amber-600">
                {metrics.lowStockCount}
              </h2>
              <p className="mt-1 text-[10px] font-semibold text-amber-600">
                Below Safe Buffer
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-100 text-amber-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "used_consumed",
      render: () => (
        <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-slate-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Used / Consumed
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-purple-600">
                {metrics.usedUnits.toLocaleString()}
              </h2>
              <p className="mt-1 text-[10px] font-semibold text-purple-600">
                Total Units Packaged
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 border border-purple-100 text-purple-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "reorder_needed",
      render: () => (
        <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-2xs transition hover:border-slate-300">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
                Reorder Needed
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-rose-600">
                {metrics.reorderNeededCount}
              </h2>
              <p className="mt-1 text-[10px] font-semibold text-rose-600">
                PO Generation Required
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 border border-rose-100 text-rose-600">
              <RotateCcw className="h-4 w-4" />
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <ReorderableKpiSection<ConsumableKpiId>
      storageKey="commerceos_consumables_kpi_order_v1"
      defaultOrder={DEFAULT_KPI_ORDER}
      items={kpiItems}
      gridClassName="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5"
    />
  );
}
