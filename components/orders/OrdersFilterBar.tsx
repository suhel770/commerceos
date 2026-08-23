"use client";

import { useEffect, useRef, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import CommerceDateRangePicker from "@/components/ui/CommerceDateRangePicker";
import CommerceSelect from "@/components/ui/CommerceSelect";

interface OrdersFilterBarProps {
  search: string;
  marketplace: string;
  status: string;
  shippingMode: string;
  warehouse: string;
  payment: string;
  priority: string;
  sla: string;
  dateFrom: string;
  dateTo: string;
  activeFilterCount: number;
  onSearch(value: string): void;
  onMarketplace(value: string): void;
  onStatus(value: string): void;
  onShippingMode(value: string): void;
  onWarehouse(value: string): void;
  onPayment(value: string): void;
  onPriority(value: string): void;
  onSla(value: string): void;
  onDateRange(from: string, to: string): void;
  onClearAll(): void;
  onDatePreset(days: number | null): void;
  options: {
    marketplaces: Array<{ value: string; label: string }>;
    statuses: Array<{ value: string; label: string }>;
    shippingModes: Array<{ value: string; label: string }>;
    warehouses: Array<{ value: string; label: string }>;
  };
}

export default function OrdersFilterBar({
  search,
  marketplace,
  status,
  shippingMode,
  warehouse,
  payment,
  priority,
  sla,
  dateFrom,
  dateTo,
  activeFilterCount,
  onSearch,
  onMarketplace,
  onStatus,
  onShippingMode,
  onWarehouse,
  onPayment,
  onPriority,
  onSla,
  onDateRange,
  onClearAll,
  onDatePreset,
  options,
}: OrdersFilterBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!filtersOpen) return;
    const onPointer = (event: MouseEvent) => {
      if (!filtersRef.current?.contains(event.target as Node)) {
        setFiltersOpen(false);
      }
    };
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [filtersOpen]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search Order ID / AWB / SKU..."
            className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none ring-violet-100 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:ring-2"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-[9.5rem]">
            <CommerceSelect
              value={marketplace}
              onChange={onMarketplace}
              options={options.marketplaces}
              searchable={false}
              placeholder="Marketplaces"
            />
          </div>
          <div className="w-[9.5rem]">
            <CommerceSelect
              value={status}
              onChange={onStatus}
              options={options.statuses}
              searchable={false}
              placeholder="Status"
            />
          </div>
          <div className="w-[10.5rem]">
            <CommerceSelect
              value={shippingMode}
              onChange={onShippingMode}
              options={options.shippingModes}
              searchable={false}
              placeholder="Shipping Mode"
            />
          </div>
          <div className="w-[9.5rem]">
            <CommerceSelect
              value={warehouse}
              onChange={onWarehouse}
              options={options.warehouses}
              searchable={false}
              placeholder="Warehouse"
            />
          </div>
          <CommerceDateRangePicker
            from={dateFrom}
            to={dateTo}
            onChange={onDateRange}
            className="w-[11.5rem]"
          />
          <div className="relative" ref={filtersRef}>
            <button
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
            {filtersOpen ? (
              <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  More filters
                </p>
                <div className="space-y-2">
                  <CommerceSelect
                    value={payment}
                    onChange={onPayment}
                    options={[
                      { value: "all", label: "Payment" },
                      { value: "paid", label: "Paid" },
                      { value: "pending", label: "Pending" },
                      { value: "failed", label: "Failed" },
                    ]}
                    searchable={false}
                    placeholder="Payment"
                  />
                  <CommerceSelect
                    value={priority}
                    onChange={onPriority}
                    options={[
                      { value: "all", label: "Priority" },
                      { value: "urgent", label: "Urgent" },
                      { value: "high", label: "High" },
                      { value: "normal", label: "Normal" },
                      { value: "low", label: "Low" },
                    ]}
                    searchable={false}
                    placeholder="Priority"
                  />
                  <CommerceSelect
                    value={sla}
                    onChange={onSla}
                    options={[
                      { value: "all", label: "SLA" },
                      { value: "breached", label: "Breached" },
                      { value: "ok", label: "On track" },
                    ]}
                    searchable={false}
                    placeholder="SLA"
                  />
                </div>
                <div className="mt-3 border-t border-slate-100 pt-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Date presets
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => onDatePreset(7)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Last 7 days
                    </button>
                    <button
                      type="button"
                      onClick={() => onDatePreset(30)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Last 30 days
                    </button>
                    <button
                      type="button"
                      onClick={() => onDatePreset(null)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      All dates
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    setFiltersOpen(false);
                  }}
                  className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Clear all filters
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
