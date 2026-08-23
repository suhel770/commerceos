"use client";

import { Plus, Warehouse } from "lucide-react";

interface StorageEmptyStateProps {
  onCreateLocation: () => void;
}

export default function StorageEmptyState({ onCreateLocation }: StorageEmptyStateProps) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50 text-violet-600 border border-violet-100 shadow-sm">
        <Warehouse className="h-8 w-8" />
      </div>

      <h2 className="mt-4 text-xl font-extrabold text-slate-900 tracking-tight">
        Setup Required
      </h2>
      <p className="mt-1 max-w-sm text-xs font-medium text-slate-500 leading-relaxed">
        Before receiving inventory, create your first Storage Location.
      </p>

      <button
        type="button"
        onClick={onCreateLocation}
        className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-violet-600 px-6 py-3 text-xs font-extrabold text-white shadow-md hover:bg-violet-700 transition-all hover:scale-105"
      >
        <Plus className="h-4 w-4" />
        Create Storage Location
      </button>
    </div>
  );
}
