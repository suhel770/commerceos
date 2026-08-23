"use client";

import { useState, useMemo, useEffect } from "react";
import { X, SlidersHorizontal, Package, CheckCircle2, Check } from "lucide-react";
import SearchableSkuSelect from "./SearchableSkuSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { StockBalance } from "@/lib/inventory/types";

interface AdjustInventoryWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: StockBalance[];
  onAdjustComplete: (data: { sku: string; delta: number; reason: string }) => void;
  currentLocationId: string;
}

const adjustmentReasons = [
  { id: "audit_count", label: "Cycle Count Variance (Audit Audit)" },
  { id: "qc_damaged", label: "QC Damage Write-off" },
  { id: "found_stock", label: "Found Surplus Physical Stock" },
  { id: "vendor_return", label: "Vendor Return Claim" },
  { id: "expired_scrap", label: "Expired Stock Scrap" },
];

export default function AdjustInventoryWorkspaceModal({
  isOpen,
  onClose,
  balances,
  onAdjustComplete,
  currentLocationId,
}: AdjustInventoryWorkspaceModalProps) {
  const [selectedSkuKey, setSelectedSkuKey] = useState<string>("");
  const [reasonId, setReasonId] = useState<string>("audit_count");
  const [adjustmentType, setAdjustmentType] = useState<"add" | "subtract">("add");
  const [adjustmentQty, setAdjustmentQty] = useState<number>(1);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const selectedItem = useMemo(() => {
    if (!selectedSkuKey && balances.length > 0) return balances[0];
    return balances.find((b) => (b.sku || b.id) === selectedSkuKey) || balances[0];
  }, [balances, selectedSkuKey]);

  if (!isOpen) return null;

  const currentAvailable = selectedItem ? selectedItem.available || 0 : 0;
  const reasonObj = adjustmentReasons.find((r) => r.id === reasonId) || adjustmentReasons[0];

  const handleExecuteAdjustment = async () => {
    if (!selectedItem || adjustmentQty <= 0) return;

    setErrorMsg(null);
    try {
      const isAdd = adjustmentType === "add";
      const res = await fetch("/api/v1/storage/operations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operationType: "cycle_count_adjustment",
          sku: selectedItem.sku,
          qty: adjustmentQty,
          sourceLocationId: isAdd ? undefined : currentLocationId,
          targetLocationId: isAdd ? currentLocationId : undefined,
          reason: reasonObj.label,
        }),
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || "Failed to execute adjustment.");
      }

      setIsSuccess(true);
      setTimeout(() => {
        onAdjustComplete({
          sku: selectedItem.sku,
          delta: isAdd ? adjustmentQty : -adjustmentQty,
          reason: reasonObj.label,
        });
        setIsSuccess(false);
        onClose();
      }, 800);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete adjustment.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto font-sans">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl transition-all border border-slate-100">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 shadow-xs">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 leading-tight">Stock Balance Adjustment</h3>
                <p className="text-xs font-semibold text-slate-400">Reconcile physical stock counts & audit variances</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
              <X className="h-4 w-4" />
            </button>
          </div>

          {isSuccess ? (
            <div className="py-12 text-center space-y-3">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h4 className="text-base font-black text-slate-900">Inventory Adjusted!</h4>
              <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto">
                Successfully adjusted {selectedItem?.productName} ({adjustmentType === "add" ? "+" : "-"}{adjustmentQty} Units).
              </p>
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              {errorMsg && (
                <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 border border-red-100">
                  {errorMsg}
                </div>
              )}
              {/* SKU Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select SKU to Adjust</label>
                <SearchableSkuSelect
                  balances={balances}
                  selectedSkuKey={selectedSkuKey || (balances[0]?.sku || balances[0]?.id || "")}
                  onSelectSkuKey={setSelectedSkuKey}
                  placeholder="Search and select SKU to adjust..."
                  unitLabel="Current Units"
                  accentColor="amber"
                />
              </div>

              {/* Adjustment Direction Toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setAdjustmentType("add")}
                  className={`py-2 text-xs font-black rounded-xl transition-all ${
                    adjustmentType === "add"
                      ? "bg-white text-emerald-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  + Add Stock Surplus
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustmentType("subtract")}
                  className={`py-2 text-xs font-black rounded-xl transition-all ${
                    adjustmentType === "subtract"
                      ? "bg-white text-rose-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  - Deduct Deficit / Damage
                </button>
              </div>

              {/* Adjustment Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adjustment Reason</label>
                <Select value={reasonId} onValueChange={setReasonId}>
                  <SelectTrigger className="h-10 border-slate-200 bg-white text-xs font-bold text-slate-900">
                    <SelectValue placeholder="Select adjustment reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    {adjustmentReasons.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity Input */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>Adjustment Units</span>
                  <span className="text-slate-400">Current Balance: {currentAvailable}</span>
                </div>
                <input
                  type="number"
                  min={1}
                  value={adjustmentQty}
                  onChange={(e) => setAdjustmentQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-black text-slate-900 focus:border-amber-600 focus:bg-white focus:outline-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteAdjustment}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2 text-xs font-black text-white hover:bg-amber-700 shadow-md transition-all active:scale-95"
                >
                  <Check className="h-4 w-4" />
                  <span>Save Adjustment</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
