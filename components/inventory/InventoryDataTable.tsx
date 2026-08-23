"use client";

import { MoreHorizontal } from "lucide-react";
import type { InventoryHealthRow, InventoryPlanRow } from "@/lib/inventory/planning/types";
import type { StockBalance } from "@/lib/inventory/types";

import {
  buildHealthMap,
  formatDateTime,
  formatQty,
  rowTotal,
  stockStatusChip,
  stockStatusForRow,
  warehouseLabel,
} from "./inventory-ops";

interface InventoryDataTableProps {
  rows: StockBalance[];
  healthRows: InventoryHealthRow[];
  plans: InventoryPlanRow[];
  selectedIds: Set<string>;
  activeId?: string | null;
  showWarehouse?: boolean;
  showTransfers?: boolean;
  onToggle(id: string): void;
  onToggleAll(ids: string[]): void;
  onOpen(row: StockBalance): void;
  onAdjust(row: StockBalance): void;
  onTransfer(row: StockBalance): void;
}

export default function InventoryDataTable({
  rows,
  healthRows,
  plans,
  selectedIds,
  activeId,
  showWarehouse = true,
  showTransfers = true,
  onToggle,
  onToggleAll,
  onOpen,
  onAdjust,
  onTransfer,
}: InventoryDataTableProps) {
  const healthByProduct = buildHealthMap(healthRows, plans);
  const pageIds = rows.map((row) => row.id);
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="max-h-[640px] overflow-auto">
        <table className="w-full min-w-[880px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500">
            <tr>
              <th className="w-10 px-3.5 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => onToggleAll(pageIds)}
                  className="h-4 w-4 rounded border-slate-300 text-violet-600"
                  aria-label="Select all on page"
                />
              </th>
              <th className="px-3.5 py-3">Product Name & SKU</th>
              {showWarehouse && <th className="px-3.5 py-3">Warehouse Location</th>}
              <th className="px-3.5 py-3 text-right">Total Stock</th>
              <th className="px-3.5 py-3 text-right">Sellable</th>
              <th className="px-3.5 py-3 text-right">In Transit</th>
              <th className="px-3.5 py-3 text-right">Damaged</th>
              <th className="px-3.5 py-3 whitespace-nowrap">Stock Status</th>
              <th className="px-3.5 py-3 whitespace-nowrap">Last Updated</th>
              <th className="w-[1%] px-3.5 py-3 text-right whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={showWarehouse ? 10 : 9}
                  className="px-4 py-10 text-center text-sm font-semibold text-slate-500"
                >
                  No inventory rows match these filters.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const status = stockStatusForRow(row, healthByProduct);
                const chip = stockStatusChip(status);
                const selected =
                  selectedIds.has(row.id) || activeId === row.id;
                return (
                  <tr
                    key={row.id}
                    onClick={() => onOpen(row)}
                    className={`cursor-pointer transition hover:bg-violet-50/40 ${
                      selected ? "bg-violet-50/70" : ""
                    }`}
                  >
                    <td
                      className="px-3.5 py-3.5"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => onToggle(row.id)}
                        className="h-4 w-4 rounded border-slate-300 text-violet-600"
                      />
                    </td>
                    <td className="px-3.5 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900 group-hover:text-violet-700 transition-colors">
                          {row.productName}
                        </p>
                        <p className="truncate text-xs font-semibold text-slate-500 font-mono mt-0.5">
                          {row.sku}
                        </p>
                      </div>
                    </td>
                    {showWarehouse && (
                      <td className="px-3.5 py-3.5 text-xs font-extrabold text-slate-800">
                        {warehouseLabel(row.warehouseId)}
                      </td>
                    )}
                    <td className="px-3.5 py-3.5 text-right tabular-nums text-sm font-black text-slate-900">
                      {formatQty(rowTotal(row))}
                    </td>
                    <td className="px-3.5 py-3.5 text-right tabular-nums text-sm font-black text-emerald-700">
                      {formatQty(row.available)}
                    </td>
                    <td className="px-3.5 py-3.5 text-right tabular-nums text-xs font-bold text-sky-700">
                      {formatQty(row.inTransit)}
                    </td>
                    <td className="px-3.5 py-3.5 text-right tabular-nums text-xs font-bold text-rose-700">
                      {formatQty(row.damaged)}
                    </td>
                    <td className="px-3.5 py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1 text-xs font-bold leading-none ${chip.className}`}
                      >
                        {chip.label}
                      </span>
                    </td>
                    <td className="px-3.5 py-3.5 whitespace-nowrap text-xs font-semibold text-slate-500">
                      {formatDateTime(row.updatedAt)}
                    </td>
                    <td
                      className="px-3.5 py-3.5 text-right whitespace-nowrap"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onAdjust(row)}
                          className="rounded-lg px-2.5 py-1 text-xs font-extrabold text-violet-700 bg-violet-50 hover:bg-violet-100 transition-colors"
                        >
                          Adjust
                        </button>
                        {showTransfers && (
                          <button
                            type="button"
                            onClick={() => onTransfer(row)}
                            className="rounded-lg px-2.5 py-1 text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                          >
                            Transfer
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onOpen(row)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                          aria-label="Open details"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
