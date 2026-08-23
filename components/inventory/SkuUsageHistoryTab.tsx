"use client";

import React, { useState } from "react";
import {
  RotateCcw,
  AlertCircle,
  Package,
  Box,
  Truck,
  Building,
  CheckCircle2,
  Clock,
  TrendingDown,
  Layers,
  ArrowDownRight,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import {
  inventoryConsumptionLedger,
  type InventoryUsageRecord,
  type SkuUsageSummary,
} from "@/lib/inventory/consumption-ledger";

export interface SkuUsageHistoryTabProps {
  sku: string;
  productName?: string;
  onRecordUsageClick?: () => void;
  onDataChanged?: () => void;
}

export default function SkuUsageHistoryTab({
  sku,
  productName,
  onRecordUsageClick,
  onDataChanged,
}: SkuUsageHistoryTabProps) {
  const [reversingId, setReversingId] = useState<string | null>(null);
  const [reversalReason, setReversalReason] = useState("");
  const [isSubmittingReversal, setIsSubmittingReversal] = useState(false);
  const [reversalError, setReversalError] = useState<string | null>(null);

  const summary: SkuUsageSummary = inventoryConsumptionLedger.getSkuUsageSummary(sku);
  const isConsumable = summary.inventoryType === "CONSUMABLE";

  const handleExecuteReversal = async (ledgerId: string) => {
    setIsSubmittingReversal(true);
    setReversalError(null);

    try {
      const response = await fetch("/api/v1/inventory/consume/reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ledgerId,
          reason: reversalReason.trim() || undefined,
          actorName: "Warehouse Lead",
        }),
      });

      const resJson = await response.json();
      if (!response.ok || !resJson.success) {
        throw new Error(resJson.error || "Failed to reverse usage.");
      }

      setReversingId(null);
      setReversalReason("");
      onDataChanged?.();
    } catch (err: any) {
      setReversalError(err.message || "Failed to reverse.");
    } finally {
      setIsSubmittingReversal(false);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header & Quick Action */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-slate-900 text-sm">
              Authoritative Consumption & Usage Ledger
            </h4>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isConsumable ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
              }`}
            >
              {isConsumable ? "Consumable / Packaging" : "Sellable Goods"}
            </span>
          </div>
          <p className="text-slate-500 text-xs">
            {isConsumable
              ? "Track where this packaging/consumable material has been used across orders and products."
              : "Audit trail of customer order fulfillments, manual issues, and stock adjustments."}
          </p>
        </div>

        {onRecordUsageClick && (
          <button
            type="button"
            onClick={onRecordUsageClick}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            + Record Usage
          </button>
        )}
      </div>

      {reversalError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{reversalError}</span>
        </div>
      )}

      {/* 4 Summary Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Net Consumed
          </span>
          <span className="text-lg font-black text-rose-700 font-mono block mt-0.5">
            {summary.totalConsumed.toLocaleString("en-IN")}{" "}
            <span className="text-[10px] font-normal text-slate-500">units</span>
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            30-Day Period
          </span>
          <span className="text-lg font-black text-slate-900 font-mono block mt-0.5">
            {summary.periodConsumed30d.toLocaleString("en-IN")}{" "}
            <span className="text-[10px] font-normal text-slate-500">units</span>
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Usage Rate / Day
          </span>
          <span className="text-lg font-black text-indigo-700 font-mono block mt-0.5">
            {summary.usageRatePerDay}{" "}
            <span className="text-[10px] font-normal text-slate-500">avg/day</span>
          </span>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
            Last Used
          </span>
          <span className="text-xs font-bold text-slate-700 block mt-1 truncate">
            {summary.lastUsedAt
              ? new Date(summary.lastUsedAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "Never"}
          </span>
        </div>
      </div>

      {/* Context Breakdown */}
      {isConsumable && summary.topRelatedProducts.length > 0 && (
        <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-amber-700" />
              Where is this consumable being used? (Top Products)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {summary.topRelatedProducts.map((p) => (
              <div
                key={p.sku}
                className="p-2 bg-white/80 border border-amber-200 rounded-xl flex justify-between items-center text-xs"
              >
                <div className="truncate pr-2">
                  <span className="font-bold font-mono text-slate-900 block truncate">{p.sku}</span>
                  <span className="text-[10px] text-slate-500 block truncate">{p.name}</span>
                </div>
                <span className="font-mono font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded text-[11px] shrink-0">
                  {p.quantity} units
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breakdown by Reason & Location */}
      {summary.byReason.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Usage by Reason
            </span>
            <div className="space-y-1">
              {summary.byReason.map((r) => (
                <div key={r.reason} className="flex justify-between items-center py-0.5 text-xs">
                  <span className="text-slate-600 truncate pr-2">{r.reason}</span>
                  <span className="font-mono font-bold text-slate-900 shrink-0">
                    {r.quantity} units
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Usage by Location
            </span>
            <div className="space-y-1">
              {summary.byLocation.map((l) => (
                <div key={l.locationName} className="flex justify-between items-center py-0.5 text-xs">
                  <span className="text-slate-600 truncate pr-2">{l.locationName}</span>
                  <span className="font-mono font-bold text-slate-900 shrink-0">
                    {l.quantity} units
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Chronological Usage Feed / Table */}
      <div className="space-y-2">
        <span className="text-[11px] font-bold text-slate-700 block">
          Chronological Audit Ledger ({summary.history.length} events)
        </span>

        {summary.history.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-400 font-medium">
            No usage or consumption recorded yet for this SKU.
          </div>
        ) : (
          <div className="space-y-2">
            {summary.history.map((record) => {
              const isCompensating = record.isReversal;
              const hasBeenReversed = summary.history.some(
                (r) => r.isReversal && r.reversalOfLedgerId === record.id
              );

              return (
                <div
                  key={record.id}
                  className={`p-3 rounded-xl border transition ${
                    isCompensating
                      ? "bg-emerald-50/50 border-emerald-200"
                      : hasBeenReversed
                      ? "bg-slate-50/50 border-slate-200 opacity-60 line-through"
                      : "bg-slate-50 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isCompensating
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {isCompensating ? "Reversal / Correction" : record.usageType || "Consumption"}
                        </span>
                        <span className="font-bold text-slate-900 text-xs">{record.reason}</span>
                        {record.customReason && (
                          <span className="text-slate-500 text-[11px]">({record.customReason})</span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                        <span>Ref: <strong className="text-slate-700">{record.reference}</strong></span>
                        <span>Facility: <strong className="text-slate-700">{record.sourceLocationName}</strong></span>
                        <span>By: <strong className="text-slate-700">{record.actorName}</strong></span>
                        <span>
                          {new Date(record.occurredAt || record.createdAt).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      {record.relatedProductSku && (
                        <div className="text-[11px] text-amber-800 font-medium">
                          Used For Product:{" "}
                          <span className="font-mono font-bold">{record.relatedProductSku}</span>
                          {record.relatedProductName ? ` (${record.relatedProductName})` : ""}
                        </div>
                      )}

                      {record.notes && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">Notes: {record.notes}</p>
                      )}
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                      <span
                        className={`font-black font-mono text-sm flex items-center gap-0.5 ${
                          isCompensating ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {isCompensating ? (
                          <>
                            <ArrowUpRight className="w-3.5 h-3.5" />+{record.quantity} {record.unit}
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="w-3.5 h-3.5" />−{record.quantity} {record.unit}
                          </>
                        )}
                      </span>

                      {!isCompensating && !hasBeenReversed && (
                        <div>
                          {reversingId === record.id ? (
                            <div className="p-2 bg-white border border-rose-200 rounded-xl shadow-lg space-y-1.5 text-left w-52 mt-1">
                              <span className="text-[10px] font-bold text-rose-800 block">
                                Reverse this usage?
                              </span>
                              <input
                                type="text"
                                placeholder="Reason for reversal..."
                                value={reversalReason}
                                onChange={(e) => setReversalReason(e.target.value)}
                                className="w-full p-1.5 text-[10px] border border-slate-200 rounded"
                              />
                              <div className="flex justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => setReversingId(null)}
                                  className="px-2 py-0.5 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={isSubmittingReversal}
                                  onClick={() => handleExecuteReversal(record.id)}
                                  className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 hover:bg-rose-700 text-white rounded shadow-sm"
                                >
                                  {isSubmittingReversal ? "..." : "Confirm"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setReversingId(record.id);
                                setReversalReason("");
                              }}
                              className="text-[10px] font-bold text-slate-500 hover:text-rose-600 flex items-center gap-1 transition"
                            >
                              <RotateCcw className="w-3 h-3" />
                              Reverse
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
