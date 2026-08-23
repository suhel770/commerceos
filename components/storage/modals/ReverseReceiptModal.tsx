"use client";

import { useState } from "react";
import { X, RotateCcw, AlertTriangle, CheckCircle2, Receipt, Building2, Package } from "lucide-react";
import { safeResponseJson } from "@/lib/api/client";
import { locationStockRepository } from "@/lib/storage/engine/receiving.engine";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReverseReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  billId: string;
  billNumber: string;
  vendorName?: string;
  sku: string;
  productName?: string;
  originalReceivedQty: number;
  currentAvailableQty: number;
  storageLocationId?: string;
  storageLocationName?: string;
  lineId?: string;
}

export default function ReverseReceiptModal({
  isOpen,
  onClose,
  onSuccess,
  billId,
  billNumber,
  vendorName,
  sku,
  productName,
  originalReceivedQty,
  currentAvailableQty,
  storageLocationId,
  storageLocationName,
  lineId,
}: ReverseReceiptModalProps) {
  // Max reversible quantity is the minimum of original received on this bill and currently available physical stock
  const maxReversible = Math.min(originalReceivedQty, currentAvailableQty);

  const [reverseQty, setReverseQty] = useState<number>(maxReversible || 1);
  const [reason, setReason] = useState<string>("Wrong quantity received");
  const [customReason, setCustomReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const finalReason = reason === "Other" ? customReason.trim() : reason;
    if (!finalReason) {
      setError("Please provide a mandatory reason for reversing this receipt.");
      return;
    }

    if (reverseQty <= 0) {
      setError("Reversal quantity must be greater than 0.");
      return;
    }

    if (reverseQty > maxReversible) {
      setError(
        `Cannot reverse ${reverseQty} units. Maximum reversible stock is ${maxReversible} units (some units may have been consumed, reserved, or already reversed).`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/v1/storage/receipts/reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purchaseBillId: billId,
          reason: finalReason,
          lines: [
            {
              lineId,
              sku,
              reverseQty,
              storageLocationId,
            },
          ],
        }),
      });

      const payload = await safeResponseJson(res);

      if (!res.ok) {
        throw new Error(payload?.error?.message || payload?.message || "Failed to reverse receipt.");
      }

      // Sync local in-memory storage repository
      locationStockRepository.reverseStock({
        sku,
        quantity: reverseQty,
        storageLocationId,
      });

      window.dispatchEvent(new CustomEvent("commerceos_stock_updated"));

      onSuccess(payload?.data || payload);
      onClose();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred during receipt reversal.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200/80">
              <RotateCcw className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Reverse Storage Receipt
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Controlled correction of received stock with immutable audit logging.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Origin Receipt Summary */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 space-y-2.5 text-xs">
          <div className="flex items-center justify-between text-slate-700">
            <span className="font-bold text-slate-500 flex items-center gap-1.5">
              <Receipt className="h-3.5 w-3.5 text-violet-600" /> Origin Bill:
            </span>
            <span className="font-extrabold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
              {billNumber} {vendorName ? `(${vendorName})` : ""}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-700">
            <span className="font-bold text-slate-500 flex items-center gap-1.5">
              <Package className="h-3.5 w-3.5 text-slate-500" /> SKU / Item:
            </span>
            <span className="font-mono font-bold text-slate-800">
              {sku}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-700">
            <span className="font-bold text-slate-500 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-slate-500" /> Storage Location:
            </span>
            <span className="font-bold text-slate-800">
              {storageLocationName || "Internal Storage"}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
            <div className="rounded-lg bg-white p-2 border border-slate-200/60">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Received</p>
              <p className="text-sm font-black text-slate-800 mt-0.5">{originalReceivedQty}</p>
            </div>
            <div className="rounded-lg bg-white p-2 border border-slate-200/60">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">In Storage</p>
              <p className="text-sm font-black text-slate-800 mt-0.5">{currentAvailableQty}</p>
            </div>
            <div className="rounded-lg bg-emerald-50 p-2 border border-emerald-200/80">
              <p className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-700">Reversible</p>
              <p className="text-sm font-black text-emerald-800 mt-0.5">{maxReversible}</p>
            </div>
          </div>
        </div>

        {/* Form Controls */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Quantity to Reverse (Max: {maxReversible} units)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max={maxReversible}
                value={reverseQty}
                onChange={(e) => setReverseQty(Math.max(1, Math.min(maxReversible, parseInt(e.target.value) || 1)))}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-black text-slate-900 focus:border-amber-500 focus:outline-none"
                required
              />
              <button
                type="button"
                onClick={() => setReverseQty(maxReversible)}
                className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                All ({maxReversible})
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-700 mb-1">
              Mandatory Reversal Reason
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger className="h-10 border-slate-300 bg-white text-xs font-bold text-slate-900 focus:border-amber-500 focus:ring-amber-100">
                <SelectValue placeholder="Select reversal reason..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Wrong quantity received">Wrong quantity received</SelectItem>
                <SelectItem value="Wrong purchase bill received">Wrong purchase bill received</SelectItem>
                <SelectItem value="Defective/damaged items returned to vendor">Defective/damaged items returned to vendor</SelectItem>
                <SelectItem value="Duplicate inwarding record created">Duplicate inwarding record created</SelectItem>
                <SelectItem value="Bill cancelled/rejected post-inwarding">Bill cancelled/rejected post-inwarding</SelectItem>
                <SelectItem value="Other">Other (specify reason)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {reason === "Other" && (
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1">
                Specify Custom Reason
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Explain why this receipt is being reversed..."
                className="w-full rounded-xl border border-slate-300 bg-white p-3 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
                rows={2}
                required
              />
            </div>
          )}

          <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 text-[11px] text-amber-800 space-y-1">
            <p className="font-bold flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Invariant Protection:
            </p>
            <p>
              Reversing will decrease Storage Available by {reverseQty}, decrease Inventory Available by {reverseQty}, and restore {reverseQty} units back to the Pending Inwarding queue.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || maxReversible <= 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-4 py-2 text-xs font-extrabold text-white shadow-sm hover:bg-amber-700 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>Reversing Stock...</>
              ) : (
                <>
                  <RotateCcw className="h-3.5 w-3.5" />
                  Confirm Reversal (-{reverseQty} Units)
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
