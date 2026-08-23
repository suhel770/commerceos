"use client";

import { VISION_TABS, type VisionTab } from "./order-ops";

interface OrdersStatusTabsProps {
  active: VisionTab;
  counts: Record<VisionTab, number>;
  onChange(tab: VisionTab): void;
}

export default function OrdersStatusTabs({
  active,
  counts,
  onChange,
}: OrdersStatusTabsProps) {
  return (
    <div className="overflow-x-auto border-b border-slate-200">
      <div className="inline-flex min-w-full gap-1">
        {VISION_TABS.map(([id, label]) => {
          const selected = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
                selected
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {label}
              <span
                className={`ml-1.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                  selected
                    ? "bg-violet-100 text-violet-700"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {counts[id].toLocaleString("en-IN")}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
