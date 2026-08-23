"use client";

import { useState } from "react";
import {
  X,
  ArrowLeftRight,
  Trash2,
  Building2,
  Package,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Flame,
} from "lucide-react";
import { vendorExchangeEngine } from "@/lib/storage/engine/vendor-exchange.engine";
import type { SecurityContext } from "@/lib/storage/domain/types";
import type { StockDispositionType, VendorDamagePolicy } from "@/lib/storage/engine/exchange.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CommerceDatePicker from "@/components/ui/CommerceDatePicker";

interface DamagedStockDispositionModalProps {
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
  vendorPolicy?: VendorDamagePolicy;
  storageLocationId?: string;
  storageLocationName?: string;
  originalReceivedQty: number;
  originalDamagedQty: number;
  currentlyAvailableForDisposition: number;
}

const mockSecurityContext: SecurityContext = {
  tenantId: "tenant-default",
  organizationId: "org-commerceos",
  workspaceId: "ws-default",
  actorId: "usr-solo-founder",
  actorName: "Solo Founder",
};

export default function DamagedStockDispositionModal({
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
  vendorPolicy = "EXCHANGE_RETURN_SUPPORTED",
  storageLocationId = "LOC-0846",
  storageLocationName = "Home Storage",
  originalReceivedQty,
  originalDamagedQty,
  currentlyAvailableForDisposition,
}: DamagedStockDispositionModalProps) {
  const [selectedDisposition, setSelectedDisposition] = useState<StockDispositionType>("vendor_exchange");
  const [dispositionQty, setDispositionQty] = useState<number>(currentlyAvailableForDisposition || 1);
  const [damageReason, setDamageReason] = useState<string>("Damaged / Broken during transit from vendor");
  const [disposalReason, setDisposalReason] = useState<string>("Physical damage rendering item unserviceable");
  const [disposalMethod, setDisposalMethod] = useState<string>("Hazardous / Scrap Disposal");
  const [vendorRefNumber, setVendorRefNumber] = useState<string>("");
  const [expectedDate, setExpectedDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isOverrideApplied, setIsOverrideApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  if (!isOpen) return null;

  const isNonReturnable = vendorPolicy === "NON_RETURNABLE";
  const isExchangeBlocked = isNonReturnable && !isOverrideApplied;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (dispositionQty <= 0) {
      setError("Quantity must be greater than 0.");
      return;
    }

    if (dispositionQty > currentlyAvailableForDisposition) {
      setError(`Cannot resolve more than ${currentlyAvailableForDisposition} damaged units.`);
      return;
    }

    if (selectedDisposition === "vendor_exchange") {
      const res = vendorExchangeEngine.createExchange({
        billId,
        billNumber,
        lineId,
        sku,
        productName,
        vendorId,
        vendorName,
        vendorPolicy,
        isAuthorizedOverride: isOverrideApplied,
        storageLocationId,
        storageLocationName,
        originalReceivedQty,
        originalDamagedQty,
        exchangeQty: dispositionQty,
        reason: damageReason,
        notes,
        vendorRefNumber,
        expectedReplacementDate: expectedDate,
        securityContext: mockSecurityContext,
      });

      if (!res.success) {
        setError(res.error || "Failed to initiate exchange.");
        return;
      }

      setSuccessMessage(`Exchange Request Registered for ${dispositionQty} units.`);
    } else {
      // Scrap / Destroy disposition
      const res = vendorExchangeEngine.scrapDamagedStock({
        billId,
        billNumber,
        lineId,
        sku,
        productName,
        vendorId,
        vendorName,
        storageLocationId,
        storageLocationName,
        originalDamagedQty,
        scrapQty: dispositionQty,
        unitCost: 850,
        damageReason,
        disposalReason,
        disposalMethod,
        notes,
        securityContext: mockSecurityContext,
      });

      if (!res.success) {
        setError(res.error || "Failed to scrap damaged units.");
        return;
      }

      setSuccessMessage(`Scrap complete. ${dispositionQty} units permanently disposed and sent to Finance.`);
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
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-800 border border-slate-200">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 leading-tight">
                Resolve Damaged Stock
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Choose disposition decision for {currentlyAvailableForDisposition} QC damaged units.
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
            <h4 className="text-base font-black text-slate-900">Disposition Confirmed!</h4>
            <p className="text-xs font-semibold text-slate-500 max-w-xs mx-auto">
              {successMessage}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 [scrollbar-width:thin] [-ms-overflow-style:none]">
              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-3 text-xs font-bold text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Source Origin Bill Summary Card */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Receipt className="h-3.5 w-3.5 text-slate-400" />
                    Origin Bill:
                  </span>
                  <span className="font-mono text-slate-900 font-extrabold">{billNumber}</span>
                </div>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-slate-400" />
                    Target SKU:
                  </span>
                  <span className="font-mono text-slate-900">{sku}</span>
                </div>
                <div className="flex items-center justify-between font-bold">
                  <span className="text-slate-500 flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    Vendor / Terms:
                  </span>
                  <span className="text-slate-900 truncate max-w-[200px]">
                    {vendorName} · <strong className={isNonReturnable ? "text-rose-600" : "text-emerald-700"}>
                      {isNonReturnable ? "Non-Returnable" : "Exchange Supported"}
                    </strong>
                  </span>
                </div>
              </div>

              {/* STEP 1: PRIMARY DISPOSITION DECISION */}
              <div>
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-900 block mb-2">
                  1. What should happen to this damaged stock? *
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Option 1: Vendor Exchange / Return */}
                  <div
                    onClick={() => setSelectedDisposition("vendor_exchange")}
                    className={`rounded-2xl border p-3.5 cursor-pointer transition-all ${
                      selectedDisposition === "vendor_exchange"
                        ? "border-amber-400 bg-amber-50/50 shadow-xs ring-1 ring-amber-400/30"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                        <ArrowLeftRight className="h-3.5 w-3.5" />
                      </div>
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                        isNonReturnable ? "bg-rose-100 text-rose-800" : "bg-emerald-100 text-emerald-800"
                      }`}>
                        {isNonReturnable ? "Restricted" : "Vendor Return"}
                      </span>
                    </div>
                    <span className="font-extrabold text-xs text-slate-900 block">Vendor Exchange / Return</span>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">
                      Claim replacement/credit from supplier.
                    </p>
                  </div>

                  {/* Option 2: Scrap / Destroy */}
                  <div
                    onClick={() => setSelectedDisposition("scrap_destroy")}
                    className={`rounded-2xl border p-3.5 cursor-pointer transition-all ${
                      selectedDisposition === "scrap_destroy"
                        ? "border-rose-400 bg-rose-50/50 shadow-xs ring-1 ring-rose-400/30"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-rose-100 text-rose-800">
                        <Flame className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                        Write-Off
                      </span>
                    </div>
                    <span className="font-extrabold text-xs text-slate-900 block">Scrap / Destroy</span>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">
                      Dispose permanently and write-off in Finance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Policy Warning / Override if Non-Returnable */}
              {selectedDisposition === "vendor_exchange" && isNonReturnable && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-rose-900 block">Vendor Policy: Non-Returnable</span>
                      <p className="text-[11px] text-rose-700 font-medium mt-0.5">
                        This vendor does not accept returns/exchanges. Scrap/Destroy is recommended.
                      </p>
                    </div>
                  </div>
                  <label className="flex items-center gap-2 pt-1 border-t border-rose-200/60 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isOverrideApplied}
                      onChange={(e) => setIsOverrideApplied(e.target.checked)}
                      className="rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span className="text-[11px] font-extrabold text-rose-900">
                      Apply Owner Authorization Override to force return request
                    </span>
                  </label>
                </div>
              )}

              {/* Quantity to Resolve */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Quantity to {selectedDisposition === "vendor_exchange" ? "Exchange" : "Scrap"} *
                  </label>
                  <span className="text-[11px] font-bold text-slate-500">
                    Max Eligible: <strong className="text-slate-900">{currentlyAvailableForDisposition} Units</strong>
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max={currentlyAvailableForDisposition}
                  required
                  value={dispositionQty}
                  onChange={(e) => setDispositionQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:border-indigo-400 focus:bg-white focus:outline-none"
                />
              </div>

              {/* STEP 2: METADATA & REASONS */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Defect / Damage Reason *
                </label>
                <Select value={damageReason} onValueChange={setDamageReason}>
                  <SelectTrigger className="h-10 border-slate-200 bg-slate-50 font-bold text-xs text-slate-900 rounded-2xl focus:bg-white">
                    <SelectValue placeholder="Select defect reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Damaged / Broken during transit from vendor">Damaged / Broken during transit from vendor</SelectItem>
                    <SelectItem value="Manufacturing physical defect (QC Fail)">Manufacturing physical defect (QC Fail)</SelectItem>
                    <SelectItem value="Wrong item / variant supplied">Wrong item / variant supplied</SelectItem>
                    <SelectItem value="Expired / near-expiry batch">Expired / near-expiry batch</SelectItem>
                    <SelectItem value="Package seal compromised / leaking">Package seal compromised / leaking</SelectItem>
                    <SelectItem value="Other quality discrepancy">Other quality discrepancy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Conditional fields based on selected disposition */}
              {selectedDisposition === "vendor_exchange" ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Vendor RMA / Ticket # (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. RMA-99824 or TKT-441"
                        value={vendorRefNumber}
                        onChange={(e) => setVendorRefNumber(e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-indigo-400 focus:bg-white focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Expected Replacement Date
                      </label>
                      <CommerceDatePicker
                        value={expectedDate}
                        onChange={setExpectedDate}
                        placeholder="Pick replacement date"
                        size="sm"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Disposal Method
                    </label>
                    <Select value={disposalMethod} onValueChange={setDisposalMethod}>
                      <SelectTrigger className="h-10 border-slate-200 bg-slate-50 font-bold text-xs text-slate-900 rounded-2xl focus:bg-white">
                        <SelectValue placeholder="Select disposal method..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Hazardous / Scrap Disposal">Hazardous / Scrap Disposal</SelectItem>
                        <SelectItem value="Municipal Solid Waste Landfill">Municipal Solid Waste Landfill</SelectItem>
                        <SelectItem value="Material Recycling / Salvage">Material Recycling / Salvage</SelectItem>
                        <SelectItem value="Incineration / Destruction">Incineration / Destruction</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-3 text-[11px] font-semibold text-rose-800 space-y-1">
                    <div className="flex items-center gap-1.5 font-extrabold text-rose-900">
                      <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                      Permanent Stock Removal & Write-Off Notice
                    </div>
                    <p>
                      {dispositionQty} units will be permanently removed from QC holding. A pending inventory write-off of <strong>₹{(dispositionQty * 850).toLocaleString("en-IN")}</strong> will be recorded for Finance review.
                    </p>
                  </div>
                </>
              )}

              {/* Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Audit Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional context for warehouse supervisor or finance officer..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs font-medium text-slate-900 focus:border-indigo-400 focus:bg-white focus:outline-none resize-none"
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
                disabled={Boolean(isExchangeBlocked)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black text-white shadow-xs transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed ${
                  selectedDisposition === "vendor_exchange"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {selectedDisposition === "vendor_exchange" ? (
                  <>
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                    Submit Vendor Exchange Request
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    Confirm Permanent Scrap & Write-off
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
