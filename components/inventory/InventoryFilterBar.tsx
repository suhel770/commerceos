"use client";

import type { ReactNode } from "react";
import { Search, X } from "lucide-react";

import CommerceSelect from "@/components/ui/CommerceSelect";

interface InventoryFilterBarProps {
  search: string;
  warehouse: string;
  stockStatus: string;
  activeFilterCount: number;
  warehouseOptions: Array<{ value: string; label: string }>;
  showWarehouse?: boolean;
  onSearch(value: string): void;
  onWarehouse(value: string): void;
  onStockStatus(value: string): void;
  onClearAll(): void;
  /** Adjust / Transfer (selection-gated) / Export / Refresh */
  actions?: ReactNode;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "in_stock", label: "In Stock" },
  { value: "low_stock", label: "Low Stock" },
  { value: "out_of_stock", label: "Out of Stock" },
];

export default function InventoryFilterBar({
  search,
  warehouse,
  stockStatus,
  activeFilterCount,
  warehouseOptions,
  showWarehouse = true,
  onSearch,
  onWarehouse,
  onStockStatus,
  onClearAll,
  actions,
}: InventoryFilterBarProps) {
  const warehouses = [
    { value: "all", label: "All warehouses" },
    ...warehouseOptions,
  ];

  return (
    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2.5">
      <label className="relative w-[200px] shrink-0 sm:w-[220px]">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search SKU, product…"
          className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-8 pr-2.5 text-sm outline-none focus:border-violet-400 focus:bg-white"
        />
      </label>
      {showWarehouse && (
        <div className="w-[160px] shrink-0">
          <CommerceSelect
            size="sm"
            searchable={false}
            value={warehouse}
            onChange={onWarehouse}
            options={warehouses}
          />
        </div>
      )}
      <div className="w-[140px] shrink-0">
        <CommerceSelect
          size="sm"
          searchable={false}
          value={stockStatus}
          onChange={onStockStatus}
          options={STATUS_OPTIONS}
        />
      </div>
      {activeFilterCount > 0 ? (
        <button
          type="button"
          onClick={onClearAll}
          className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl px-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100"
        >
          <X className="h-4 w-4" />
          Clear
        </button>
      ) : null}
      {actions ? (
        <div className="ml-auto flex shrink-0 flex-nowrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
