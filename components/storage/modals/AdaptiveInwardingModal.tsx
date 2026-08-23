"use client";

import { useState, useEffect } from "react";
import {
  X,
  PackageCheck,
  Sparkles,
  QrCode,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { StorageComplexityMode, SubLocationNode } from "@/lib/storage/domain/types";
import type { GrnLineItem } from "@/lib/warehouse/domain/grn.entity";
import { StorageAiCopilot } from "@/lib/ai/storage-ai-copilot";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdaptiveInwardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  grnLine: GrnLineItem | null;
  storageComplexityMode?: StorageComplexityMode;
  subLocations?: SubLocationNode[];
  userCredits?: number;
  onInwardComplete: (
    lineId: string,
    acceptedQty: number,
    damagedQty: number,
    binId?: string,
    binCode?: string
  ) => void;
}

export default function AdaptiveInwardingModal({
  isOpen,
  onClose,
  grnLine,
  storageComplexityMode = "simple",
  subLocations = [],
  userCredits = 25,
  onInwardComplete,
}: AdaptiveInwardingModalProps) {
  const [acceptedQty, setAcceptedQty] = useState<number>(0);
  const [damagedQty, setDamagedQty] = useState<number>(0);
  const [selectedRack, setSelectedRack] = useState<string>("");
  const [barcodeInput, setBarcodeInput] = useState<string>("");
  const [aiSuggestion, setAiSuggestion] = useState<ReturnType<typeof StorageAiCopilot.suggestOptimalBin> | null>(null);
  const [creditsState, setCreditsState] = useState<number>(userCredits);

  useEffect(() => {
    if (grnLine) {
      setAcceptedQty(grnLine.quantityPending);
      setDamagedQty(0);
      setBarcodeInput("");
      setAiSuggestion(null);

      if (subLocations.length > 0) {
        setSelectedRack(subLocations[0].code);
      }
    }
  }, [grnLine, subLocations]);

  if (!isOpen || !grnLine) return null;

  const totalQty = acceptedQty + damagedQty;
  const isOverQuantity = totalQty > grnLine.quantityPending;

  const handleRequestAiBin = () => {
    const available = subLocations.map((s) => ({
      id: s.id,
      code: s.code,
      level: s.level,
      currentUnits: s.currentUnitsCount,
    }));

    const result = StorageAiCopilot.suggestOptimalBin(
      grnLine.sku,
      grnLine.purchaseBillId,
      creditsState,
      available
    );

    setAiSuggestion(result);
    setCreditsState(result.remainingCredits);
    setBarcodeInput(result.suggestedBinCode);
  };

  const handleConfirmInward = () => {
    if (isOverQuantity || totalQty <= 0) return;

    let targetCode = "PRIMARY-STORAGE";
    if (storageComplexityMode === "medium") {
      targetCode = selectedRack || "RACK-01";
    } else if (storageComplexityMode === "advanced") {
      targetCode = barcodeInput || "Z1-A1-R01-B01";
    }

    onInwardComplete(
      grnLine.id,
      acceptedQty,
      damagedQty,
      `BIN-${targetCode}`,
      targetCode
    );

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600 font-bold">
              <PackageCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900">Adaptive Stock Inwarding</h3>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-600">
                  {storageComplexityMode} Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">SKU: {grnLine.sku}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Item Summary */}
        <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80 text-xs space-y-1.5">
          <div className="flex justify-between font-bold text-slate-700">
            <span>{grnLine.description}</span>
            <span className="text-violet-700">Pending: {grnLine.quantityPending} units</span>
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-[11px]">
            <Layers className="h-3.5 w-3.5 text-slate-400" />
            <span>Category: {grnLine.purchaseType}</span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Storage Inward Valid
            </span>
          </div>
        </div>

        {/* Quantity Controls (Pass / Fail QC) */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Accepted Qty (Pass)
            </label>
            <input
              type="number"
              min={0}
              max={grnLine.quantityPending}
              value={acceptedQty}
              onChange={(e) => setAcceptedQty(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-emerald-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
              Damaged Qty (Fail)
            </label>
            <input
              type="number"
              min={0}
              max={grnLine.quantityPending}
              value={damagedQty}
              onChange={(e) => setDamagedQty(Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold text-rose-700 focus:border-rose-500 focus:ring-2 focus:ring-rose-200 focus:outline-none"
            />
          </div>
        </div>

        {isOverQuantity && (
          <div className="flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs font-bold text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Total received ({totalQty}) exceeds pending ({grnLine.quantityPending}).
          </div>
        )}

        {/* Mode-Specific Adaptive UI */}
        <div className="border-t border-slate-100 pt-3">
          {/* Mode 1: Simple Mode */}
          {storageComplexityMode === "simple" && (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-3.5 text-xs text-emerald-900 space-y-1">
              <div className="font-extrabold flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Simple 1-Click Primary Inwarding
              </div>
              <p className="text-slate-600 text-[11px]">
                Stock will be directly credited to Primary Storage Available bucket without sub-bin tagging.
              </p>
            </div>
          )}

          {/* Mode 2: Medium Mode */}
          {storageComplexityMode === "medium" && (
            <div className="space-y-2">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                Select Rack / Shelf Location
              </label>
              <Select value={selectedRack || (subLocations[0]?.code || "RACK-A1")} onValueChange={setSelectedRack}>
                <SelectTrigger className="h-10 border-slate-300 bg-white font-bold text-slate-800 focus:border-violet-500">
                  <SelectValue placeholder="Select rack/shelf location..." />
                </SelectTrigger>
                <SelectContent>
                  {subLocations.length > 0 ? (
                    subLocations.map((sub) => (
                      <SelectItem key={sub.id} value={sub.code}>
                        <span className="font-mono text-[10px] text-slate-400 font-extrabold mr-1">[{sub.level.toUpperCase()}]</span>
                        <span className="font-bold text-slate-900">{sub.name}</span>
                        <span className="ml-1 text-[10px] text-slate-500 font-mono">({sub.code})</span>
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="RACK-A1">Rack A1 (Fast-Moving Zone)</SelectItem>
                      <SelectItem value="RACK-B2">Rack B2 (Standard Storage)</SelectItem>
                      <SelectItem value="RACK-C3">Rack C3 (Bulk Storage)</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Mode 3: Advanced Mode */}
          {storageComplexityMode === "advanced" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">
                  Bin Barcode Input / Scanner
                </label>
                <button
                  type="button"
                  onClick={handleRequestAiBin}
                  className="flex items-center gap-1 text-[11px] font-extrabold text-violet-700 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition-colors border border-violet-200"
                >
                  <Sparkles className="h-3.5 w-3.5 text-violet-600" />
                  AI Bin Suggestion (5 Credits)
                </button>
              </div>

              <div className="relative">
                <QrCode className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Scan or enter bin code e.g. Z1-A1-R01-B04"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 pl-9 pr-3 py-2 text-xs font-mono font-bold text-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 focus:outline-none"
                />
              </div>

              {/* AI Suggestion Badge */}
              {aiSuggestion && (
                <div className={`rounded-xl p-3 border text-xs space-y-1 ${aiSuggestion.usedAi ? "bg-violet-50/80 border-violet-200 text-violet-950" : "bg-slate-50 border-slate-200 text-slate-800"}`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-violet-600" />
                      {aiSuggestion.usedAi ? "AI Optimal Recommendation" : "Standard Heuristic Fallback"}
                    </span>
                    <span className="text-[10px] font-extrabold text-slate-500">
                      Credits: {aiSuggestion.remainingCredits}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600">{aiSuggestion.reasoning}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isOverQuantity || totalQty <= 0}
            onClick={handleConfirmInward}
            className="flex items-center gap-1.5 rounded-xl bg-violet-600 px-5 py-2 text-xs font-bold text-white shadow-md hover:bg-violet-700 disabled:opacity-50 transition-all"
          >
            <span>Confirm Inward</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
