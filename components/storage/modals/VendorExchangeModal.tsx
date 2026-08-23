"use client";

import { useState } from "react";
import { X, ArrowLeftRight, Building2, Package, Receipt, Calendar, AlertTriangle, CheckCircle2 } from "lucide-react";
import { vendorExchangeEngine } from "@/lib/storage/engine/vendor-exchange.engine";
import type { SecurityContext } from "@/lib/storage/domain/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CommerceDatePicker from "@/components/ui/CommerceDatePicker";

interface VendorExchangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  billId: string;
  billNumber: string;
  lineId: string;
  sku: string;
  productName: string;
  vendorId?: string;
  vendorName?: string;
  storageLocationId?: string;
  storageLocationName?: string;
  originalReceivedQty: number;
  originalDamagedQty: number;
  currentlyAvailableForExchange: number;
}

const mockSecurityContext: SecurityContext = {
  tenantId: "tenant-default",
  organizationId: "org-commerceos",
  workspaceId: "ws-default",
  actorId: "usr-solo-founder",
  actorName: "Solo Founder",
};

export default function VendorExchangeModal({
  isOpen,
  onClose,
  onSuccess,
  billId,
  billNumber,
  lineId,
  sku,
  productName,
  vendorId = "v-default",
  vendorName = "Primary Supplier",
  storageLocationId = "LOC-0846",
  storageLocationName = "Home Storage",
  originalReceivedQty,
  originalDamagedQty,
  currentlyAvailableForExchange,
}: VendorExchangeModalProps) {
  const [exchangeQty, setExchangeQty] = useState<number>(currentlyAvailableForExchange || 1);
  const [reason, setReason] = useState<string>("Damaged / Broken during transit from vendor");
  const [vendorRefNumber, setVendorRefNumber] = useState<string>("");
  const [expectedDate, setExpectedDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (exchangeQty <= 0) {
      setError("Exchange quantity must be greater than 0.");
      return;
    }

    if (exchangeQty > currentlyAvailableForExchange) {
      setError(`Cannot exchange more than ${currentlyAvailableForExchange} damaged units.`);
      return;
    }

    const res = vendorExchangeEngine.createExchange({
      billId,
      billNumber,
      lineId,
      sku,
      productName,
      vendorId,
      vendorName,
      storageLocationId,
      storageLocationName,
      originalReceivedQty,
      originalDamagedQty,
      exchangeQty,
      reason,
      notes,
      vendorRefNumber,
      expectedReplacementDate: expectedDate,
      securityContext: mockSecurityContext,
    });

    if (!res.success) {
      setError(res.error || "Failed to initiate exchange.");
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
              <ArrowLeftRight className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">
                Initiate Vendor Exchange
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Request replacement units from vendor for QC damaged stock.
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
            <h4 className="text-base font-black text-slate-900">Exchange Request Registered!</h4>
            <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto">
              Vendor exchange for {exchangeQty} units of {productName} is now in Awaiting Replacement status.
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

              {/* Traceability Context Card */}
              <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-bold text-slate-500 flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-violet-600" /> Source Bill:
                  </span>
                  <span className="font-extrabold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    {billNumber} ({vendorName})
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
                    <Building2 className="h-3.5 w-3.5 text-slate-500" /> Receiving Facility:
                  </span>
                  <span className="font-bold text-slate-800">
                    {storageLocationName}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-center">
                  <div className="rounded-xl bg-white p-2 border border-slate-200/60 shadow-xs">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Total Recv</p>
                    <p className="text-sm font-black text-slate-800 mt-0.5">{originalReceivedQty}</p>
                  </div>
                  <div className="rounded-xl bg-rose-50 p-2 border border-rose-200/80">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-rose-700">QC Damaged</p>
                    <p className="text-sm font-black text-rose-800 mt-0.5">{originalDamagedQty}</p>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-2 border border-amber-200/80">
                    <p className="text-[9px] font-extrabold uppercase tracking-wider text-amber-700">Exchangable</p>
                    <p className="text-sm font-black text-amber-800 mt-0.5">{currentlyAvailableForExchange}</p>
                  </div>
                </div>
              </div>

              {/* Exchange Quantity */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-extrabold text-slate-700">
                    Quantity to Exchange
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">
                    Max: {currentlyAvailableForExchange} Units
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={currentlyAvailableForExchange}
                    value={exchangeQty}
                    onChange={(e) =>
                      setExchangeQty(Math.max(1, Math.min(currentlyAvailableForExchange, parseInt(e.target.value) || 1)))
                    }
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-black text-slate-900 focus:border-amber-500 focus:outline-none"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setExchangeQty(currentlyAvailableForExchange)}
                    className="rounded-xl border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-extrabold text-slate-700 hover:bg-slate-200 transition-colors"
                  >
                    All ({currentlyAvailableForExchange})
                  </button>
                </div>
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Defect / Exchange Reason
                </label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger className="h-10 border-slate-300 bg-white text-xs font-bold text-slate-900 focus:border-amber-500 focus:ring-amber-100">
                    <SelectValue placeholder="Select reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Damaged / Broken during transit from vendor">Damaged / Broken during transit from vendor</SelectItem>
                    <SelectItem value="Manufacturing physical defect (QC Fail)">Manufacturing physical defect (QC Fail)</SelectItem>
                    <SelectItem value="Wrong item variant supplied in packaging">Wrong item variant supplied in packaging</SelectItem>
                    <SelectItem value="Expired or near-expiry batch delivered">Expired or near-expiry batch delivered</SelectItem>
                    <SelectItem value="Package seal compromised / leaking">Package seal compromised / leaking</SelectItem>
                    <SelectItem value="Other (specify in notes)">Other (specify in notes)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Vendor Ref & Expected Date */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Vendor RMA / Ticket #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. RMA-99420"
                    value={vendorRefNumber}
                    onChange={(e) => setVendorRefNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1">
                    Expected Replacement Date
                  </label>
                  <CommerceDatePicker
                    value={expectedDate}
                    onChange={setExpectedDate}
                    placeholder="Select expected date"
                    size="md"
                  />
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Additional Exchange Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Vendor communication details, tracking details..."
                  className="w-full rounded-xl border border-slate-300 bg-white p-2.5 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none"
                  rows={2}
                />
              </div>

              {/* Invariant Note */}
              <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> Accounting Invariant:
                </p>
                <p>
                  Initiating an exchange holds the {exchangeQty} damaged units in <strong>Awaiting Replacement</strong> status. Available inventory does NOT increase until replacement units physically arrive and pass QC.
                </p>
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2 text-xs font-black text-white hover:bg-amber-700 shadow-md transition-all active:scale-95"
              >
                <ArrowLeftRight className="h-4 w-4" />
                <span>Create Exchange Request</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
