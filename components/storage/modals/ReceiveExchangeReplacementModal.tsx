"use client";

import { useState } from "react";
import { X, PackageCheck, Building2, Package, Receipt, AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { vendorExchangeEngine } from "@/lib/storage/engine/vendor-exchange.engine";
import type { VendorExchangeRecord } from "@/lib/storage/engine/exchange.types";
import type { SecurityContext } from "@/lib/storage/domain/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ReceiveExchangeReplacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  exchange: VendorExchangeRecord;
}

const mockSecurityContext: SecurityContext = {
  tenantId: "tenant-default",
  organizationId: "org-commerceos",
  workspaceId: "ws-default",
  actorId: "usr-solo-founder",
  actorName: "Solo Founder",
};

export default function ReceiveExchangeReplacementModal({
  isOpen,
  onClose,
  onSuccess,
  exchange,
}: ReceiveExchangeReplacementModalProps) {
  const maxOutstanding = exchange.unresolvedQty || 1;
  const [acceptedQty, setAcceptedQty] = useState<number>(maxOutstanding);
  const [damagedQty, setDamagedQty] = useState<number>(0);
  const [targetLocation, setTargetLocation] = useState<string>(exchange.storageLocationId || "LOC-0846");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const totalReceived = acceptedQty + damagedQty;
  const isOverQuantity = totalReceived > maxOutstanding;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (totalReceived <= 0) {
      setError("Total inspected units must be greater than 0.");
      return;
    }

    if (isOverQuantity) {
      setError(`Total inspected units (${totalReceived}) cannot exceed outstanding exchange balance (${maxOutstanding}).`);
      return;
    }

    const res = vendorExchangeEngine.receiveReplacement({
      exchangeId: exchange.id,
      receivedQty: totalReceived,
      acceptedQty,
      damagedQty,
      storageLocationId: targetLocation,
      storageLocationName: exchange.storageLocationName,
      notes,
      securityContext: mockSecurityContext,
    });

    if (!res.success) {
      setError(res.error || "Failed to process replacement receipt.");
      return;
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onSuccess();
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150 overflow-y-auto">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden my-auto">
        
        {/* Fixed Header */}
        <div className="flex items-start justify-between border-b border-slate-100 p-5 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">
                Receive Exchange Replacement & QC
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Inspect replacement package from vendor and credit passed stock.
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

        {isSuccess ? (
          <div className="p-8 py-12 text-center space-y-3">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="text-base font-black text-slate-900">Replacement Stock Processed!</h4>
            <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto">
              +{acceptedQty} Good units credited to Available Storage. {damagedQty > 0 ? `${damagedQty} units retained in Damaged QC.` : "Exchange fully resolved."}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200">
              {error && (
                <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 font-medium">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Exchange Reference Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-bold text-slate-500 flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-violet-600" /> Exchange Reference:
                  </span>
                  <span className="font-extrabold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    {exchange.billNumber} • {exchange.vendorName}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-bold text-slate-500 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-slate-500" /> SKU / Product:
                  </span>
                  <span className="font-mono font-bold text-slate-800">
                    {exchange.sku} ({exchange.productName})
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
                  <div className="rounded-xl bg-white p-2 border border-slate-200/60 shadow-xs">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Total Exchanged</p>
                    <p className="text-sm font-black text-slate-800 mt-0.5">{exchange.exchangeQty}</p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-2 border border-emerald-200/80">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-700">Already Accepted</p>
                    <p className="text-sm font-black text-emerald-800 mt-0.5">{exchange.replacementAcceptedQty}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-2 border border-amber-200/80">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-amber-700">Outstanding</p>
                    <p className="text-sm font-black text-amber-800 mt-0.5">{maxOutstanding}</p>
                  </div>
                </div>
              </div>

              {/* QC Inspection Inputs (Good vs Damaged) */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-black text-emerald-800 mb-1 flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Good Units (Passed QC) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={maxOutstanding}
                    value={acceptedQty}
                    onChange={(e) => setAcceptedQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full rounded-xl border border-emerald-300 bg-white px-3.5 py-2 text-xs font-black text-emerald-900 focus:border-emerald-500 focus:outline-none"
                    required
                  />
                  <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                    Credits to Available Inventory
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-black text-rose-800 mb-1 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    Defective / Damaged (Failed QC)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={maxOutstanding}
                    value={damagedQty}
                    onChange={(e) => setDamagedQty(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full rounded-xl border border-rose-300 bg-white px-3.5 py-2 text-xs font-black text-rose-900 focus:border-rose-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-rose-700 font-semibold mt-1">
                    Retained in QC Holding
                  </p>
                </div>
              </div>

              {/* Storage Facility Allocation */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Receiving Storage Facility
                </label>
                <Select value={targetLocation} onValueChange={setTargetLocation}>
                  <SelectTrigger className="h-10 border-slate-300 bg-white text-xs font-bold text-slate-900 focus:border-emerald-500 focus:ring-emerald-100">
                    <SelectValue placeholder="Select facility..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOC-0846">COS Home (Primary Facility)</SelectItem>
                    <SelectItem value="LOC-9182">Bengaluru Main Warehouse</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* QC Notes */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  QC Inspection Notes / Carrier Details
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Inspected box seal, batch barcode verified, replacement unit serial #..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                  rows={2}
                />
              </div>
            </div>

            {/* Fixed Action Footer */}
            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100 bg-slate-50/60 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isOverQuantity || totalReceived <= 0}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-black text-white hover:bg-emerald-700 shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                <PackageCheck className="h-4 w-4" />
                <span>Confirm Replacement QC</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
