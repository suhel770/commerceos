"use client";

import { ArrowRightLeft, Eye, PackageCheck, RefreshCw, Settings, SlidersHorizontal } from "lucide-react";
import type { StorageCapability } from "@/lib/storage/domain/capabilities";

interface LocationQuickActionsProps {
  capabilities: StorageCapability[];
  onReceiveStock: () => void;
  onTransferStock: () => void;
  onAdjustStock: () => void;
  onSyncMarketplace?: () => void;
  onViewInventory: () => void;
  onOpenSettings?: () => void;
}

export default function LocationQuickActions({
  capabilities,
  onReceiveStock,
  onTransferStock,
  onAdjustStock,
  onSyncMarketplace,
  onViewInventory,
  onOpenSettings,
}: LocationQuickActionsProps) {
  const canReceive = capabilities.includes("receive_stock");
  const canTransfer = capabilities.includes("transfer_stock");
  const canAdjust = capabilities.includes("adjust_stock");
  const canSync = capabilities.includes("marketplace_sync");

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-sm">
      <span className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
        Quick Actions:
      </span>

      {canReceive && (
        <button
          type="button"
          onClick={onReceiveStock}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
        >
          <PackageCheck className="h-3.5 w-3.5" />
          Receive Stock
        </button>
      )}

      {canTransfer && (
        <button
          type="button"
          onClick={onTransferStock}
          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 transition-colors"
        >
          <ArrowRightLeft className="h-3.5 w-3.5" />
          Transfer Stock
        </button>
      )}

      {canAdjust && (
        <button
          type="button"
          onClick={onAdjustStock}
          className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-amber-700 transition-colors"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Adjust Inventory
        </button>
      )}

      {canSync && (
        <button
          type="button"
          onClick={onSyncMarketplace}
          className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sync Channel
        </button>
      )}

      <button
        type="button"
        onClick={onViewInventory}
        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Eye className="h-3.5 w-3.5 text-slate-400" />
        View Inventory
      </button>
    </div>
  );
}
