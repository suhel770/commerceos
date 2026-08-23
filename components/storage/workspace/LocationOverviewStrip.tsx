import { useMemo } from "react";
import { AlertTriangle, ArrowDownRight, Box, CheckCircle2, Clock, GripVertical } from "lucide-react";
import { useReorderableKpis } from "@/components/ui/kpi";

export interface LocationMetricsData {
  availableUnits: number;
  sellableUnits?: number;
  consumableUnits?: number;
  incomingUnits: number;
  reservedUnits: number;
  damagedUnits: number;
  inventoryValue: number;
  productsCount: number;
}

interface LocationOverviewStripProps {
  metrics: LocationMetricsData;
}

type LocationKpiKey = "sellable" | "consumable" | "incoming" | "reserved" | "damaged" | "skus";
const defaultLocationKpiOrder: LocationKpiKey[] = [
  "sellable",
  "consumable",
  "incoming",
  "reserved",
  "damaged",
  "skus",
];

const LOCATION_KPI_ORDER_KEY = "commerceos_location_overview_kpi_order_v1";

export default function LocationOverviewStrip({ metrics }: LocationOverviewStripProps) {
  const sellableQty = metrics.sellableUnits !== undefined ? metrics.sellableUnits : metrics.availableUnits;
  const consumableQty = metrics.consumableUnits !== undefined ? metrics.consumableUnits : 0;

  const {
    order,
    isReordered,
    resetOrder,
    getCardDragProps,
  } = useReorderableKpis<LocationKpiKey>({
    storageKey: LOCATION_KPI_ORDER_KEY,
    defaultOrder: defaultLocationKpiOrder,
  });

  return (
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

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {order.map((key, index) => {
          const dragProps = getCardDragProps(index);
          const { isDragging, isOver } = dragProps;

          const baseCardClasses = `group relative rounded-2xl border bg-white p-3.5 shadow-xs transition-all duration-200 select-none cursor-grab active:cursor-grabbing ${
            isDragging
              ? "opacity-40 scale-95 border-dashed border-violet-400"
              : isOver
                ? "border-violet-500 ring-2 ring-violet-200 scale-102 shadow-md bg-violet-50/20"
                : "border-slate-200/80 hover:shadow-sm hover:border-slate-300"
          }`;

          if (key === "sellable") {
            return (
              <div key="sellable" {...dragProps} className={baseCardClasses}>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 pointer-events-none">
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Sellable Units
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg font-black text-slate-900">
                    {sellableQty.toLocaleString("en-IN")}
                  </span>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                </div>
              </div>
            );
          }

          if (key === "consumable") {
            return (
              <div key="consumable" {...dragProps} className={baseCardClasses}>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 pointer-events-none">
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Consumable Units
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg font-black text-amber-600">
                    {consumableQty.toLocaleString("en-IN")}
                  </span>
                  <Box className="h-4 w-4 text-amber-500" />
                </div>
              </div>
            );
          }

          if (key === "incoming") {
            return (
              <div key="incoming" {...dragProps} className={baseCardClasses}>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 pointer-events-none">
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Incoming Units
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg font-black text-indigo-600">
                    {metrics.incomingUnits.toLocaleString("en-IN")}
                  </span>
                  <ArrowDownRight className="h-4 w-4 text-indigo-400" />
                </div>
              </div>
            );
          }

          if (key === "reserved") {
            return (
              <div key="reserved" {...dragProps} className={baseCardClasses}>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 pointer-events-none">
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Reserved Units
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg font-black text-amber-600">
                    {metrics.reservedUnits.toLocaleString("en-IN")}
                  </span>
                  <Clock className="h-4 w-4 text-amber-400" />
                </div>
              </div>
            );
          }

          if (key === "damaged") {
            return (
              <div key="damaged" {...dragProps} className={baseCardClasses}>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 pointer-events-none">
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Damaged (QC)
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className={`text-lg font-black ${metrics.damagedUnits > 0 ? "text-rose-600" : "text-slate-400"}`}>
                    {metrics.damagedUnits.toLocaleString("en-IN")}
                  </span>
                  {metrics.damagedUnits > 0 ? (
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-slate-300" />
                  )}
                </div>
              </div>
            );
          }

          if (key === "skus") {
            return (
              <div key="skus" {...dragProps} className={baseCardClasses}>
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 pointer-events-none">
                  <GripVertical className="h-3.5 w-3.5" />
                </div>
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  SKU Count
                </span>
                <div className="mt-1 flex items-baseline justify-between">
                  <span className="text-lg font-black text-slate-900">
                    {metrics.productsCount} SKUs
                  </span>
                  <Box className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}
