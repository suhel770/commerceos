"use client";

import { Eye, FileText, LoaderCircle } from "lucide-react";
import type { ConsumableItem } from "@/lib/consumables/consumable.service";
import { getUniversalProductId } from "@/lib/products/product-id-utils";

interface ConsumablesRowProps {
  consumable: ConsumableItem;
  selected: boolean;
  onToggle: () => void;
  onOpenSourceBill: (consumable: ConsumableItem) => void;
  openingSourceBill: boolean;
  onInspect: () => void;
}

export default function ConsumablesRow({
  consumable,
  selected,
  onToggle,
  onOpenSourceBill,
  openingSourceBill,
  onInspect,
}: ConsumablesRowProps) {
  const isLowStock = consumable.available <= consumable.reorderPoint;
  const isOutOfStock = consumable.available <= 0;

  return (
    <tr
      onClick={onInspect}
      className={`
        border-b
        border-slate-100
        transition-all
        duration-150
        cursor-pointer
        hover:bg-blue-50/40
        ${selected ? "bg-blue-50/70 ring-1 ring-inset ring-blue-200" : ""}
      `}
    >
      <td
        className="w-10 px-3 py-3.5 text-center align-middle"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
      </td>

      {/* Consumable Name & Category */}
      <td className="min-w-[260px] px-3 py-3.5 align-middle">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 border border-slate-200">
            <Eye className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 line-clamp-1">
              {consumable.name}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {(() => {
                const prdId = getUniversalProductId({
                  productId: consumable.productId,
                  sku: consumable.sku,
                  name: consumable.name,
                });
                if (!prdId) return null;
                return (
                  <>
                    <span className="font-mono font-bold text-indigo-600 bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-100/60 text-[10px]">
                      {prdId}
                    </span>
                    <span className="mx-1 text-slate-300">•</span>
                  </>
                );
              })()}
              {consumable.category} • Unit: {consumable.unit}
            </p>
          </div>
        </div>
      </td>

      {/* SKU */}
      <td className="w-36 px-3 py-3.5 align-middle">
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
          {consumable.sku}
        </span>
      </td>

      {/* Available */}
      <td className="w-28 px-3 py-3.5 text-right align-middle">
        <span
          className={`font-mono text-sm font-bold ${
            isOutOfStock
              ? "text-rose-600"
              : isLowStock
              ? "text-amber-600"
              : "text-emerald-600"
          }`}
        >
          {consumable.available.toLocaleString()} {consumable.unit}
        </span>
      </td>

      {/* Used / Consumed */}
      <td className="w-28 px-3 py-3.5 text-right align-middle">
        <span className="font-mono text-sm font-semibold text-purple-700">
          {consumable.used.toLocaleString()} {consumable.unit}
        </span>
      </td>

      {/* Unit Cost */}
      <td className="w-24 px-3 py-3.5 text-right align-middle">
        <span className="font-mono text-sm font-semibold text-slate-700">
          ₹{consumable.unitCost}
        </span>
      </td>

      {/* Reorder Point */}
      <td className="w-28 px-3 py-3.5 text-right align-middle">
        <span className="font-mono text-xs font-medium text-slate-500">
          {consumable.reorderPoint} {consumable.unit}
        </span>
      </td>

      {/* Status */}
      <td className="w-32 px-3 py-3.5 text-center align-middle">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
            consumable.status === "In Stock"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : consumable.status === "Low Stock"
              ? "bg-amber-50 text-amber-700 border border-amber-200"
              : "bg-rose-50 text-rose-700 border border-rose-200"
          }`}
        >
          {consumable.status}
        </span>
      </td>

      {/* Operational actions: View details and open bill */}
      <td
        className="w-28 px-3 py-3.5 text-center align-middle"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={onInspect}
            title="View Details"
            aria-label={`View details for ${consumable.name}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onOpenSourceBill(consumable)}
            disabled={openingSourceBill}
            title="Open purchase bill"
            aria-label={`Open purchase bill for ${consumable.name}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-wait disabled:opacity-60"
          >
            {openingSourceBill ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
          </button>
        </div>
      </td>
    </tr>
  );
}
