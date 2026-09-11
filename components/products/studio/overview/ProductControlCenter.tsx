"use client";

import { RotateCcw } from "lucide-react";
import { useStudio } from "../context/StudioContext";

export default function ProductControlCenter() {
  const { isCustomOrder, resetWorkspaceOrder } = useStudio();

  if (!isCustomOrder) {
    return null;
  }

  return (
    <div className="mb-2.5 flex items-center justify-end">
      <button
        type="button"
        onClick={() => resetWorkspaceOrder()}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-600 shadow-2xs transition cursor-pointer active:scale-95"
        title="Reset to default workspace order"
      >
        <RotateCcw className="h-3 w-3 text-slate-500" />
        <span>Reset Default Order</span>
      </button>
    </div>
  );
}
