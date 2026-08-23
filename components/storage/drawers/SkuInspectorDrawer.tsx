"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { X, Barcode, Printer, Copy, Check, Package, MapPin, Tag, ShieldCheck, Box, Layers, ChevronDown, Receipt, History, RotateCcw, PackageCheck, AlertCircle } from "lucide-react";
import type { StockBalance } from "@/lib/inventory/types";
import ReverseReceiptModal from "../modals/ReverseReceiptModal";
import DamagedStockDispositionModal from "../modals/DamagedStockDispositionModal";
import ReceiveExchangeReplacementModal from "../modals/ReceiveExchangeReplacementModal";
import { vendorExchangeEngine } from "@/lib/storage/engine/vendor-exchange.engine";
import type { VendorExchangeRecord, ScrapWriteOffRecord } from "@/lib/storage/engine/exchange.types";
import {
  resolveBarcodeIdentity,
  generateCode128SvgString,
  LABEL_SIZE_OPTIONS,
  type LabelSizeFormat,
  calculatePrintBatch,
  printBarcodeLabels,
} from "@/lib/storage/barcode";

interface SkuInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  skuItem: StockBalance | null;
  locationName?: string;
}

function CustomLabelSizeSelect({
  value,
  onChange,
}: {
  value: LabelSizeFormat;
  onChange: (val: LabelSizeFormat) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOpt = LABEL_SIZE_OPTIONS.find((o) => o.id === value) || LABEL_SIZE_OPTIONS[0];

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-xs hover:border-violet-400 focus:outline-none transition-colors"
      >
        <div className="flex items-center gap-1.5 truncate">
          <Layers className="h-3.5 w-3.5 text-violet-600 shrink-0" />
          <span className="truncate">{selectedOpt.label}</span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 bottom-full mb-1 w-full rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl space-y-0.5 animate-in fade-in duration-100">
          <div className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100">
            Label Format Size:
          </div>
          {LABEL_SIZE_OPTIONS.map((opt) => {
            const isSelected = value === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => {
                  onChange(opt.id);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-violet-50 text-violet-950 font-black"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div>
                  <div className="leading-tight">{opt.label}</div>
                  <div className="text-[9px] font-semibold text-slate-400">{opt.desc}</div>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-violet-600 shrink-0" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CustomPrintQtySelect({
  value,
  onChange,
  availableStock,
  labelSize,
}: {
  value: number;
  onChange: (val: number) => void;
  availableStock: number;
  labelSize: LabelSizeFormat;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const batch = calculatePrintBatch(value, labelSize);
  const stepCount = labelSize === "a4" ? 24 : 10;

  const presetOptions = [
    { qty: availableStock, label: `${availableStock} Labels (Exact Stock)`, desc: calculatePrintBatch(availableStock, labelSize).summaryText },
    { qty: stepCount * 1, label: `${stepCount * 1} Labels`, desc: calculatePrintBatch(stepCount * 1, labelSize).summaryText },
    { qty: stepCount * 2, label: `${stepCount * 2} Labels`, desc: calculatePrintBatch(stepCount * 2, labelSize).summaryText },
    { qty: stepCount * 3, label: `${stepCount * 3} Labels`, desc: calculatePrintBatch(stepCount * 3, labelSize).summaryText },
    { qty: stepCount * 4, label: `${stepCount * 4} Labels`, desc: calculatePrintBatch(stepCount * 4, labelSize).summaryText },
  ];

  const uniqueOptions = presetOptions.filter(
    (opt, index, self) => index === self.findIndex((t) => t.qty === opt.qty)
  );

  return (
    <div ref={containerRef} className="relative w-full">
      {isCustomMode ? (
        <div className="flex items-center gap-1">
          <input
            type="number"
            min="1"
            max="1000"
            value={value}
            onChange={(e) => onChange(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full rounded-xl border border-violet-400 bg-white px-3 py-2 text-xs font-bold text-slate-900 text-center focus:border-violet-600 focus:outline-none"
            placeholder="Custom Qty"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setIsCustomMode(false)}
            className="rounded-xl border border-slate-200 bg-slate-100 px-2 py-2 text-[10px] font-extrabold text-slate-600 hover:bg-slate-200 transition-colors shrink-0"
          >
            Presets
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-xs hover:border-violet-400 focus:outline-none transition-colors"
        >
          <div className="flex items-center gap-1.5 truncate">
            <Printer className="h-3.5 w-3.5 text-violet-600 shrink-0" />
            <span className="truncate">{value} Labels ({batch.summaryText})</span>
          </div>
          <ChevronDown className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>
      )}

      {isOpen && !isCustomMode && (
        <div className="absolute left-0 z-50 bottom-full mb-1 w-full rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl space-y-0.5 animate-in fade-in duration-100">
          <div className="px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-slate-100 flex justify-between items-center">
            <span>Select Print Batch:</span>
            <span className="text-violet-600 font-bold">{batch.summaryText}</span>
          </div>

          {uniqueOptions.map((opt) => {
            const isSelected = value === opt.qty;
            return (
              <div
                key={opt.qty}
                onClick={() => {
                  onChange(opt.qty);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold cursor-pointer transition-colors ${
                  isSelected
                    ? "bg-violet-50 text-violet-950 font-black"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div>
                  <div className="leading-tight">{opt.label}</div>
                  <div className="text-[9px] font-semibold text-slate-400">{opt.desc}</div>
                </div>
                {isSelected && <Check className="h-3.5 w-3.5 text-violet-600 shrink-0" />}
              </div>
            );
          })}

          <div
            onClick={() => {
              setIsCustomMode(true);
              setIsOpen(false);
            }}
            className="flex items-center justify-between rounded-xl px-2.5 py-2 text-xs font-bold cursor-pointer text-violet-700 hover:bg-violet-50 transition-colors border-t border-slate-100 mt-1"
          >
            <span>+ Enter Custom Qty...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SkuInspectorDrawer({
  isOpen,
  onClose,
  skuItem,
  locationName = "Storage Facility",
}: SkuInspectorDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [labelQty, setLabelQty] = useState(1);
  const [labelSize, setLabelSize] = useState<LabelSizeFormat>("50x25");
  const [isReverseModalOpen, setIsReverseModalOpen] = useState(false);
  const [isExchangeModalOpen, setIsExchangeModalOpen] = useState(false);
  const [isReceiveReplacementModalOpen, setIsReceiveReplacementModalOpen] = useState(false);
  const [activeExchange, setActiveExchange] = useState<VendorExchangeRecord | null>(null);

  useEffect(() => {
    if (skuItem) {
      setLabelQty(Math.max(1, skuItem.available || 1));
      const exchanges = vendorExchangeEngine.listExchanges({ sku: skuItem.sku });
      const pending = exchanges.find((e: VendorExchangeRecord) => e.status === "awaiting_replacement" || e.status === "exchange_requested");
      setActiveExchange(pending || null);
    }
  }, [skuItem, isOpen]);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Esc") {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !skuItem) return null;

  const handleCopySku = () => {
    navigator.clipboard.writeText(skuItem.sku);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Professional Multi-Page Barcode Sheet Print Engine
  const handlePrintBarcodes = () => {
    if (!skuItem) return;
    try {
      printBarcodeLabels({
        item: skuItem,
        quantity: labelQty,
        format: labelSize,
      });
    } catch (err) {
      console.error("Failed to print barcode labels:", err);
    }
  };

  const unitPrice = 350;
  const stockVal = (skuItem.available || 0) * unitPrice;
  const formattedVal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(stockVal).replace("\u20B9", "\u20B9\u2009");

  const formattedUnitPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(unitPrice).replace("\u20B9", "\u20B9\u2009");

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-250 border-l border-slate-200">
          
          {/* Header with Full Product Title & Primary Thumbnail */}
          <div className="flex items-start justify-between p-5 border-b border-slate-100 bg-slate-50/50 shrink-0 gap-3">
            <div className="flex items-start gap-3">
              {/* Primary Product Photo Thumbnail Placeholder */}
              <div className="h-14 w-14 rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-100 via-indigo-50 to-white flex items-center justify-center text-violet-600 shrink-0 shadow-xs relative overflow-hidden group">
                <Package className="h-7 w-7 text-violet-600" />
                <span className="absolute bottom-0 inset-x-0 bg-violet-600/90 text-[8px] font-black uppercase text-center text-white py-0.5">
                  Primary
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-violet-700 bg-violet-100 px-2 py-0.5 rounded-md">
                    SKU Inspector
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">• Product Details</span>
                </div>
                {/* Full Product Name without Truncation */}
                <h2 className="text-base font-black text-slate-900 leading-snug">
                  {skuItem.productName}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors shrink-0"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200">
            
            {/* SKU Badge & Quick Copy */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Master SKU Code
                </span>
                <button
                  type="button"
                  onClick={handleCopySku}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 hover:text-violet-900 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-slate-400" />
                      <span>Copy SKU</span>
                    </>
                  )}
                </button>
              </div>
              <div className="text-base font-mono font-black text-slate-900 tracking-wide select-all bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 text-center shadow-xs">
                {skuItem.sku}
              </div>
            </div>

            {/* Physical Inventory Allocation Breakdown Grid */}
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <Package className="h-4 w-4 text-violet-600" />
                Physical Stock Allocation & Quantities
              </h3>

              <div className="grid grid-cols-3 gap-2.5">
                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Available
                  </span>
                  <div className="text-base font-black text-slate-900">
                    {skuItem.available} <span className="text-[10px] text-slate-400 font-bold">Units</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Reserved
                  </span>
                  <div className="text-base font-black text-amber-600">
                    {skuItem.reserved || 0} <span className="text-[10px] text-slate-400 font-bold">Units</span>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Damaged (QC)
                  </span>
                  <div className="text-base font-black text-rose-600">
                    {skuItem.damaged || 0} <span className="text-[10px] text-slate-400 font-bold">Units</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Location & Intent info */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-2.5 text-xs font-medium">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-slate-400" />
                  Assigned Location:
                </span>
                <span className="font-bold text-slate-900">{locationName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-slate-400" />
                  Inventory Intent:
                </span>
                <span className="font-extrabold text-violet-700 capitalize">
                  {skuItem.intent === "consumable" ? "Consumable Packaging" : "Sellable Inventory"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                  Quality Status:
                </span>
                <span className="font-bold text-emerald-700">QC Passed & Audited</span>
              </div>
            </div>

            {/* Damaged Stock Lifecycle & Disposition Action Area */}
            {(skuItem.damaged > 0 || activeExchange) && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-extrabold text-rose-950 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-rose-600" />
                    Damaged Stock Resolution
                  </h3>
                  <span className="text-[10px] font-black text-rose-800 bg-rose-100 px-2 py-0.5 rounded-md border border-rose-200">
                    {activeExchange ? (activeExchange.status === "awaiting_replacement" ? "Awaiting Replacement" : "QC Holding") : "QC Holding"}
                  </span>
                </div>

                <div className="rounded-xl border border-rose-200/80 bg-white p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-500">Unresolved Damaged Units:</span>
                    <span className="font-black text-rose-600">{skuItem.damaged || activeExchange?.unresolvedQty || 0} Units</span>
                  </div>

                  {activeExchange && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500">Exchange Requested:</span>
                        <span className="font-bold text-amber-700">{activeExchange.exchangeQty} Units ({activeExchange.vendorRefNumber || "RMA Initiated"})</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500">Outstanding Replacement:</span>
                        <span className="font-black text-indigo-700">{activeExchange.unresolvedQty} Units Pending</span>
                      </div>
                    </>
                  )}

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    {activeExchange && activeExchange.unresolvedQty > 0 ? (
                      <button
                        type="button"
                        onClick={() => setIsReceiveReplacementModalOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-black text-white hover:bg-emerald-700 active:scale-98 transition-all shadow-sm"
                      >
                        <PackageCheck className="h-3.5 w-3.5" />
                        Receive Exchange Replacement & QC
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsExchangeModalOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 px-3 py-2 text-xs font-black text-white hover:bg-amber-700 active:scale-98 transition-all shadow-sm"
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        Resolve Damaged Stock ({skuItem.damaged} Units)
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Source Bill & Receiving Inflow History */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <History className="h-4 w-4 text-violet-600" />
                  Source Bill & Inflow History
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-violet-800 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-md">
                  <Receipt className="h-3 w-3 text-violet-600" />
                  {skuItem.billNumber || "BILL-1101"}
                </span>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-bold text-slate-500">Origin Purchase Bill:</span>
                  <span className="font-extrabold text-violet-700 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                    {skuItem.billNumber || "BILL-1101"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-bold text-slate-500">Receiving Facility:</span>
                  <span className="font-bold text-slate-900">{locationName || "Home Storage"}</span>
                </div>
                <div className="flex items-center justify-between text-slate-700">
                  <span className="font-bold text-slate-500">Allocated Units:</span>
                  <span className="font-black text-slate-900">{skuItem.available || 0} Available</span>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-500">Received by mistake or wrong bill?</span>
                  <button
                    type="button"
                    onClick={() => setIsReverseModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-extrabold text-amber-800 hover:bg-amber-100 active:scale-98 transition-all"
                  >
                    <RotateCcw className="h-3 w-3 text-amber-600" />
                    Reverse Receipt
                  </button>
                </div>
              </div>
            </div>

            {/* Reverse Receipt Confirmation Modal */}
            <ReverseReceiptModal
              isOpen={isReverseModalOpen}
              onClose={() => setIsReverseModalOpen(false)}
              onSuccess={() => {
                onClose();
                window.location.reload();
              }}
              billId={skuItem.receivedFromBillId || skuItem.billNumber || "BILL-1040"}
              billNumber={skuItem.billNumber || "BILL-1040"}
              sku={skuItem.sku}
              productName={skuItem.productName}
              originalReceivedQty={skuItem.available || 1}
              currentAvailableQty={skuItem.available || 1}
              storageLocationId={skuItem.warehouseId}
              storageLocationName={locationName}
            />

            {/* Damaged Stock Disposition Modal */}
            <DamagedStockDispositionModal
              isOpen={isExchangeModalOpen}
              onClose={() => setIsExchangeModalOpen(false)}
              onSuccess={() => {
                const exchanges = vendorExchangeEngine.listExchanges({ sku: skuItem.sku });
                const pending = exchanges.find((e: VendorExchangeRecord) => e.status === "awaiting_replacement");
                setActiveExchange(pending || null);
                window.dispatchEvent(new CustomEvent("commerceos_stock_updated"));
              }}
              billId={skuItem.receivedFromBillId || skuItem.billNumber || "BILL-1040"}
              billNumber={skuItem.billNumber || "BILL-1040"}
              lineId={skuItem.id || `line-${skuItem.sku}`}
              sku={skuItem.sku}
              productName={skuItem.productName}
              storageLocationId={skuItem.warehouseId}
              storageLocationName={locationName}
              originalReceivedQty={(skuItem.available || 0) + (skuItem.damaged || 0)}
              originalDamagedQty={skuItem.damaged || 1}
              currentlyAvailableForDisposition={skuItem.damaged || 1}
            />

            {/* Receive Exchange Replacement Modal */}
            {activeExchange && (
              <ReceiveExchangeReplacementModal
                isOpen={isReceiveReplacementModalOpen}
                onClose={() => setIsReceiveReplacementModalOpen(false)}
                onSuccess={() => {
                  const exchanges = vendorExchangeEngine.listExchanges({ sku: skuItem.sku });
                  const pending = exchanges.find((e: VendorExchangeRecord) => e.status === "awaiting_replacement");
                  setActiveExchange(pending || null);
                  window.dispatchEvent(new CustomEvent("commerceos_stock_updated"));
                }}
                exchange={activeExchange}
              />
            )}

            {/* Barcode & Label Printing Card */}
            {(() => {
              const barcodeIdentity = resolveBarcodeIdentity(skuItem);
              const previewBatch = calculatePrintBatch(labelQty, labelSize);
              const previewSvg = barcodeIdentity.isValid
                ? generateCode128SvgString(barcodeIdentity.value, {
                    height: 48,
                    moduleWidth: 1.8,
                    barColor: "#000000",
                    bgColor: "transparent",
                  })
                : "";

              return (
                <div className="rounded-2xl border border-violet-200 bg-violet-50/40 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Barcode className="h-4 w-4 text-violet-600" />
                      Item Barcode Label Generator
                    </h3>
                    <span className="text-[10px] font-black text-violet-800 bg-violet-100 px-2 py-0.5 rounded-md">
                      {barcodeIdentity.source === "gtin_ean_upc" ? "EAN/GTIN" : "CODE128"}
                    </span>
                  </div>

                  {/* Barcode Visual Preview */}
                  <div className="rounded-2xl bg-white p-4 border border-violet-200/80 text-center space-y-2 shadow-xs">
                    <p className="text-[11px] font-extrabold text-slate-900 leading-tight">
                      {skuItem.productName}
                    </p>

                    {barcodeIdentity.isValid ? (
                      <>
                        <div
                          className="flex justify-center py-2 overflow-hidden"
                          dangerouslySetInnerHTML={{ __html: previewSvg }}
                        />

                        <div className="font-mono text-xs font-black tracking-widest text-slate-800">
                          {barcodeIdentity.displayText}
                        </div>
                      </>
                    ) : (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-xs font-semibold text-left">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                        <span>Barcode cannot be generated because this SKU has no valid barcode identity.</span>
                      </div>
                    )}
                  </div>

                  {/* Label Options */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                        Label Print Qty
                      </label>
                      <CustomPrintQtySelect
                        value={labelQty}
                        onChange={setLabelQty}
                        availableStock={skuItem.available || 1}
                        labelSize={labelSize}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                        Label Size Format
                      </label>
                      <CustomLabelSizeSelect
                        value={labelSize}
                        onChange={setLabelSize}
                      />
                    </div>
                  </div>

                  {/* Print CTA Button */}
                  <button
                    type="button"
                    disabled={!barcodeIdentity.isValid}
                    onClick={handlePrintBarcodes}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-extrabold text-white shadow-md shadow-violet-200 hover:bg-violet-700 active:scale-98 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Printer className="h-4 w-4" />
                    Print {labelQty} Barcode {labelQty === 1 ? "Label" : "Labels"} ({previewBatch.summaryText})
                  </button>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
