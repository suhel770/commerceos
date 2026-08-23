"use client";

import {
  ArrowLeftRight,
  FileSpreadsheet,
  PackagePlus,
  RefreshCw,
  X,
} from "lucide-react";

type Props = {
  multiWarehouse: boolean;
  selectedCount: number;
  onRefresh(): void;
  onExport(): void;
  onAdjust(): void;
  onTransfer(): void;
  onClearSelection(): void;
};

export default function InventoryQuickActions({
  multiWarehouse,
  selectedCount,
  onRefresh,
  onExport,
  onAdjust,
  onTransfer,
  onClearSelection,
}: Props) {
  const hasSelection = selectedCount > 0;

  return (
    <div className="flex flex-nowrap items-center gap-1.5">
      {hasSelection ? (
        <div className="mr-0.5 flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-2 py-1">
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white">
            {selectedCount}
          </span>
          <span className="hidden whitespace-nowrap text-xs font-semibold text-blue-950 sm:inline">
            {selectedCount === 1 ? "1 selected" : `${selectedCount} selected`}
          </span>
          <button
            type="button"
            onClick={onClearSelection}
            className="rounded-md p-0.5 text-blue-700 hover:bg-blue-100"
            aria-label="Clear selection"
            title="Clear selection"
          >
            <X size={13} />
          </button>
        </div>
      ) : null}

      <button
        type="button"
        disabled={!hasSelection}
        onClick={onAdjust}
        title={
          hasSelection
            ? "Adjust selected stock"
            : "Select one or more rows to adjust stock"
        }
        className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl bg-sky-700 px-2.5 text-sm font-semibold text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:hover:bg-slate-200"
      >
        <PackagePlus size={14} />
        Adjust stock
      </button>
      {multiWarehouse ? (
        <button
          type="button"
          disabled={!hasSelection}
          onClick={onTransfer}
          title={
            hasSelection
              ? "Transfer selected stock"
              : "Select one or more rows to transfer"
          }
          className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-50 disabled:text-slate-400 disabled:hover:bg-slate-50"
        >
          <ArrowLeftRight size={14} />
          Transfer
        </button>
      ) : null}
      <button
        type="button"
        onClick={onExport}
        title={
          hasSelection ? "Export selected rows" : "Export all visible rows"
        }
        className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <FileSpreadsheet size={14} />
        Export
      </button>
      <button
        type="button"
        onClick={onRefresh}
        className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <RefreshCw size={14} />
        Refresh
      </button>
    </div>
  );
}
