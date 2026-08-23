"use client";

import { ArrowRight, ArrowLeftRight, CheckCircle2, Clock } from "lucide-react";

export interface StorageTransferRecord {
  id: string;
  sku: string;
  productName: string;
  quantity: number;
  fromLocationName: string;
  toLocationName: string;
  status: "completed" | "in_transit" | "pending";
  timestamp: string;
}

interface StorageTransfersSectionProps {
  transfers: StorageTransferRecord[];
  onNewTransferClick?: () => void;
}

export default function StorageTransfersSection({
  transfers,
  onNewTransferClick,
}: StorageTransfersSectionProps) {
  return (
    <div className="space-y-4">
      {/* Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Stock Transfers
          </h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">
            Inter-location stock movements between warehouses, FBA nodes, and 3PL hubs.
          </p>
        </div>

        {onNewTransferClick && (
          <button
            type="button"
            onClick={onNewTransferClick}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeftRight className="h-3.5 w-3.5 text-slate-500" />
            Transfer Stock
          </button>
        )}
      </div>

      {/* Transfers List */}
      {transfers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 text-center text-xs font-medium text-slate-400">
          No recent stock transfers recorded.
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-100">
            {transfers.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-4 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <ArrowLeftRight className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-xs">{t.productName}</span>
                      <span className="text-[10px] font-mono font-bold text-slate-400">({t.sku})</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 mt-0.5">
                      <span>{t.fromLocationName}</span>
                      <ArrowRight className="h-3 w-3 text-slate-400" />
                      <span className="text-slate-900">{t.toLocationName}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="block text-xs font-black text-slate-900">
                      {t.quantity.toLocaleString()} Units
                    </span>
                    <span className="block text-[10px] font-semibold text-slate-400">
                      {t.timestamp}
                    </span>
                  </div>

                  {t.status === "completed" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                      <CheckCircle2 className="h-3 w-3" />
                      Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                      <Clock className="h-3 w-3" />
                      In Transit
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
