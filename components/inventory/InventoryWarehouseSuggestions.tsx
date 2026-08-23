"use client";

import { ArrowDown } from "lucide-react";

import type { AllocationHint } from "@/lib/inventory/planning/types";

import { warehouseLabel } from "./inventory-ops";

type Props = {
  hints: AllocationHint[];
  onApply(hint: AllocationHint): void;
  submitting?: boolean;
};

export default function InventoryWarehouseSuggestions({
  hints,
  onApply,
  submitting,
}: Props) {
  if (hints.length === 0) return null;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-slate-900">
        Warehouse Suggestions
      </h2>
      <p className="mt-0.5 text-xs text-slate-500">
        Multi-warehouse transfers — you approve each move.
      </p>
      <ul className="mt-3 space-y-2">
        {hints.slice(0, 4).map((hint) => (
          <li
            key={`${hint.productId}-${hint.fromWarehouseId}-${hint.toWarehouseId}`}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-900">
                {hint.productName}
              </p>
              <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-600">
                <span>
                  Move <strong>{hint.quantity}</strong>
                </span>
                <span className="font-medium">
                  {warehouseLabel(hint.fromWarehouseId)}
                </span>
                <ArrowDown size={12} className="text-slate-400" />
                <span className="font-medium">
                  {warehouseLabel(hint.toWarehouseId)}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Reason: {hint.reason}
              </p>
            </div>
            <button
              type="button"
              disabled={submitting}
              onClick={() => onApply(hint)}
              className="rounded-lg border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-800 hover:bg-sky-50 disabled:opacity-50"
            >
              Apply transfer
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
