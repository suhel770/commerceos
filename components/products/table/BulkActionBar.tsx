"use client";

import {
  Archive,
  Download,
  FolderOpen,
  Tag,
  Trash2,
  X,
} from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  onClear: () => void;
}

export default function BulkActionBar({
  selectedCount,
  onClear,
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

                <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    <Tag size={16} />
                    Change Status
                </button>

                <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    <FolderOpen size={16} />
                    Change Category
                </button>

                <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    <Archive size={16} />
                    Archive
                </button>

                <button className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
                    <Download size={16} />
                    Export
                </button>

                <button className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100">
                    <Trash2 size={16} />
                    Delete
                </button>

                <button
                    onClick={onClear}
                    className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                >
                    <X size={18} />
                </button>

                </div>

    </div>
  );
}