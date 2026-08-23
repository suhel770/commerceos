"use client";

import { useMemo, useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import type { InventoryHealthRow, InventoryPlanRow } from "@/lib/inventory/planning/types";
import type { StockBalance, StockMovement } from "@/lib/inventory/types";

import {
  buildHealthMap,
  formatDateTime,
  formatQty,
  movementLabel,
  stockOverviewPercents,
  topLowStock,
  warehouseLabel,
} from "./inventory-ops";

interface InventorySidePanelProps {
  balances: StockBalance[];
  movements: StockMovement[];
  healthRows: InventoryHealthRow[];
  plans: InventoryPlanRow[];
  /** Place cards in a horizontal row (top strip next to Today's Inventory). */
  layout?: "stack" | "row";
}

const cardShell =
  "flex h-full min-h-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm";

type OverviewKey = "in_stock" | "low_stock" | "out_of_stock" | "in_transit";

const SEGMENT_META: Record<
  OverviewKey,
  { label: string; color: string; swatch: string }
> = {
  in_stock: {
    label: "In Stock",
    color: "#10b981",
    swatch: "bg-emerald-500",
  },
  low_stock: {
    label: "Low Stock",
    color: "#fbbf24",
    swatch: "bg-amber-400",
  },
  out_of_stock: {
    label: "Out of Stock",
    color: "#f43f5e",
    swatch: "bg-rose-500",
  },
  in_transit: {
    label: "In Transit",
    color: "#0ea5e9",
    swatch: "bg-sky-500",
  },
};

type ChartSlice = {
  key: OverviewKey;
  name: string;
  value: number;
  count: number;
  color: string;
};

function OverviewTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartSlice }>;
}) {
  if (!active || !payload?.[0]) return null;
  const slice = payload[0].payload;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: slice.color }}
        />
        <p className="text-xs font-semibold text-slate-900">{slice.name}</p>
      </div>
      <p className="mt-1 text-sm font-bold tabular-nums text-slate-900">
        {slice.value}%
      </p>
      <p className="text-[11px] text-slate-500">
        {slice.count} SKU{slice.count === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export default function InventorySidePanel({
  balances,
  movements,
  healthRows,
  plans,
  layout = "stack",
}: InventorySidePanelProps) {
  const healthByProduct = buildHealthMap(healthRows, plans);
  const overview = stockOverviewPercents(balances, healthByProduct);
  const low = topLowStock(balances, healthByProduct, 4);
  const recent = movements.slice(0, 4);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const segments = useMemo(() => {
    const keys: OverviewKey[] = [
      "in_stock",
      "low_stock",
      "out_of_stock",
      "in_transit",
    ];
    return keys.map((key) => ({
      key,
      label: SEGMENT_META[key].label,
      value: overview[key],
      count: overview.counts[key],
      color: SEGMENT_META[key].color,
      swatch: SEGMENT_META[key].swatch,
    }));
  }, [overview]);

  const chartData: ChartSlice[] = useMemo(
    () =>
      segments
        .filter((segment) => segment.value > 0)
        .map((segment) => ({
          key: segment.key,
          name: segment.label,
          value: segment.value,
          count: segment.count,
          color: segment.color,
        })),
    [segments],
  );

  return (
    <aside className={layout === "row" ? "contents" : "space-y-3"}>
      <section className={cardShell}>
        <h3 className="text-base font-semibold text-slate-900">Stock Overview</h3>
        <div className="mt-3 flex flex-1 flex-col items-center gap-3">
          <div className="relative h-36 w-full max-w-[160px] shrink-0">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-[11px] text-slate-400">
                No stock data
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={62}
                    paddingAngle={chartData.length > 1 ? 2 : 0}
                    stroke="#fff"
                    strokeWidth={2}
                    onMouseEnter={(_, index) => setActiveIndex(index)}
                    onMouseLeave={() => setActiveIndex(null)}
                  >
                    {chartData.map((slice, index) => (
                      <Cell
                        key={slice.key}
                        fill={slice.color}
                        style={{
                          outline: "none",
                          cursor: "pointer",
                          opacity:
                            activeIndex === null || activeIndex === index
                              ? 1
                              : 0.45,
                          transition: "opacity 120ms ease",
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={<OverviewTooltip />}
                    allowEscapeViewBox={{ x: true, y: true }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ul className="mt-auto grid w-full grid-cols-2 gap-x-3 gap-y-1.5">
            {segments.map((segment) => (
              <li
                key={segment.key}
                className="flex items-center gap-1.5 text-[11px] text-slate-600"
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${segment.swatch}`}
                />
                <span className="min-w-0 flex-1 truncate">{segment.label}</span>
                <span className="shrink-0 font-semibold tabular-nums text-slate-800">
                  {segment.value}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className={cardShell}>
        <h3 className="text-base font-semibold text-slate-900">Top Low Stock SKUs</h3>
        <ul className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-hidden">
          {low.length === 0 ? (
            <li className="text-[11px] text-slate-500">No low-stock rows right now.</li>
          ) : (
            low.map((row) => (
              <li
                key={row.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-slate-50/80 px-2 py-1.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-medium text-slate-800">
                    {row.sku}
                  </p>
                  <p className="truncate text-[10px] text-slate-400">
                    {warehouseLabel(row.warehouseId)}
                  </p>
                </div>
                <span className="shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-amber-800">
                  {formatQty(row.available)}
                </span>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className={cardShell}>
        <h3 className="text-base font-semibold text-slate-900">
          Recent Stock Movements
        </h3>
        <ul className="mt-3 min-h-0 flex-1 space-y-1.5 overflow-hidden">
          {recent.length === 0 ? (
            <li className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 px-3 py-6 text-center text-[11px] text-slate-400">
              No movements yet
            </li>
          ) : (
            recent.map((movement) => (
              <li
                key={movement.id}
                className="rounded-lg bg-slate-50/80 px-2 py-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-xs font-medium text-slate-800">
                    {movementLabel(movement)}
                  </p>
                  <span
                    className={`shrink-0 text-[11px] font-bold tabular-nums ${
                      movement.quantity >= 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {movement.quantity >= 0 ? "+" : ""}
                    {formatQty(movement.quantity)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[10px] text-slate-400">
                  {warehouseLabel(movement.warehouseId)} ·{" "}
                  {formatDateTime(movement.createdAt)}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </aside>
  );
}
