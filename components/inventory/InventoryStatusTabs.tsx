"use client";

import {
  formatQty,
  INVENTORY_TABS,
  type InventoryTab,
} from "./inventory-ops";

interface InventoryStatusTabsProps {
  active: InventoryTab;
  counts: Record<InventoryTab, number>;
  showWarehouseTab?: boolean;
  onChange(tab: InventoryTab): void;
}

export default function InventoryStatusTabs({
  active,
  counts,
  showWarehouseTab = true,
  onChange,
}: InventoryStatusTabsProps) {
  const tabs = INVENTORY_TABS.filter(
    ([id]) => showWarehouseTab || id !== "warehouses",
  );

  return (
    <div className="overflow-x-auto border-b border-slate-200">
      <div className="inline-flex min-w-full gap-0.5">
        {tabs.map(([id, label]) => {
          const selected = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`whitespace-nowrap border-b-2 px-2.5 py-1.5 text-sm font-semibold transition ${
                selected
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
              <span
                className={`ml-1 rounded px-1 py-0.5 text-[10px] font-semibold tabular-nums ${
                  selected
                    ? "bg-violet-100 text-violet-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {formatQty(counts[id])}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
