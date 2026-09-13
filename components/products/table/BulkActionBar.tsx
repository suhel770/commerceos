"use client";

import {
  Archive,
  Download,
  FolderOpen,
  Globe,
  Tag,
  Trash2,
  X,
} from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
  onBulkAction: (action: string) => void;
}

export default function BulkActionBar({
  selectedCount,
  onClear,
  onBulkAction,
}: BulkActionBarProps) {
  return (
    <div className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 px-6 py-4 shadow-sm">

      <div className="flex items-center gap-4">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 font-bold text-white">
          {selectedCount}
        </div>

        <div>
          <p className="font-semibold text-slate-900">
            {selectedCount} Product
            {selectedCount > 1 ? "s" : ""} Selected
          </p>

          <p className="text-sm text-slate-500">
            Apply bulk actions to selected products.
          </p>
        </div>

      </div>

      <div className="flex flex-wrap items-center gap-2">

        <button
          onClick={() => onBulkAction("publish_channels")}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white shadow-xs transition hover:bg-blue-700 cursor-pointer"
        >
          <Globe size={16} />
          Publish to Channels
        </button>

        <button
          onClick={() => onBulkAction("activate")}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
        >
          <Tag size={16} className="text-emerald-600" />
          Activate
        </button>

        <button
          onClick={() => onBulkAction("deactivate")}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
        >
          <Tag size={16} className="text-slate-400" />
          Deactivate
        </button>

        <button
          onClick={() => onBulkAction("archive")}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
        >
          <Archive size={16} className="text-amber-600" />
          Archive
        </button>

        <button
          onClick={() => onBulkAction("export")}
          className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 cursor-pointer"
        >
          <Download size={16} className="text-blue-600" />
          Export
        </button>

        <button
          onClick={onClear}
          className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 cursor-pointer"
        >
          <X size={18} />
        </button>

      </div>

    </div>
  );
}