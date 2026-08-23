"use client";

import { useEffect, useState } from "react";
import {
  AlertCircle,
  Brain,
  CheckCircle2,
  Clock,
  Coins,
  FileText,
  Sparkles,
  TrendingUp,
  X,
} from "lucide-react";
import {
  aiReportEngine,
  CREDIT_TIER_COSTS,
  type CreditTier,
} from "@/lib/core/ai-report-engine";

interface AiCreditConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (tier: CreditTier) => void;
  moduleName?: string;
}

export default function AiCreditConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  moduleName = "Inventory",
}: AiCreditConfirmationModalProps) {
  const [selectedTier, setSelectedTier] = useState<CreditTier>("simulation");
  const stats = aiReportEngine.getRoiStats();

  const currentTierInfo = CREDIT_TIER_COSTS[selectedTier];
  const hasEnough = aiReportEngine.hasEnoughCredits(selectedTier);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-black">Generate Executive AI Report</h3>
              <p className="text-xs text-indigo-300">Select Analysis Depth for {moduleName} Module</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">

          {/* Credit Tier Selector */}
          <div>
            <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-2">
              Analysis Depth & Credit Pricing Tier
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(CREDIT_TIER_COSTS) as CreditTier[]).map((tierKey) => {
                const tier = CREDIT_TIER_COSTS[tierKey];
                const isSelected = selectedTier === tierKey;
                return (
                  <div
                    key={tierKey}
                    onClick={() => setSelectedTier(tierKey)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-500/20 shadow-2xs"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900">{tier.label}</span>
                        <span className={`text-[10px] font-mono font-black px-1.5 py-0.5 rounded-full ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-700"
                        }`}>
                          {tier.credits} {tier.credits === 1 ? "Credit" : "Credits"}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1 leading-snug">{tier.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Credits Summary Bar */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-indigo-100 border border-indigo-200 text-indigo-700">
                <Coins className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Credits Required</p>
                <p className="text-base font-black text-slate-900">{currentTierInfo.credits} Credits</p>
              </div>
            </div>

            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <div className="p-2 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-700">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Credits Available</p>
                <p className="text-base font-black text-emerald-700">{stats.creditsRemaining} Credits</p>
              </div>
            </div>
          </div>

          {/* Specs List */}
          <div className="space-y-1.5 text-xs pt-1">
            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Estimated Runtime
              </span>
              <span className="font-bold text-slate-800 font-mono">
                {selectedTier === "quick" ? "~1.2s" : selectedTier === "forecast" ? "~2.5s" : selectedTier === "simulation" ? "~3.8s" : "~5.5s"}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Output Document
              </span>
              <span className="font-bold text-indigo-700">Formal Saved Executive Report</span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-slate-400" /> Business Benefit
              </span>
              <span className="font-bold text-emerald-700">Actionable Savings & Risk Forecast</span>
            </div>
          </div>

          {/* Transparent Guarantee Note */}
          <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-indigo-900 leading-relaxed">
              <strong>Transparent Credit Policy:</strong> {currentTierInfo.credits} credits deducted upon report completion. Saved permanently to Universal AI History.
            </p>
          </div>

          {!hasEnough && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs text-rose-800 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              Insufficient credit balance ({stats.creditsRemaining} remaining).
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!hasEnough}
            onClick={() => {
              onClose();
              onConfirm(selectedTier);
            }}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white font-black rounded-xl text-xs shadow-sm transition flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Generate Report ({currentTierInfo.credits} {currentTierInfo.credits === 1 ? "Credit" : "Credits"})
          </button>
        </div>

      </div>
    </div>
  );
}
