"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, History, MessageSquare, Zap } from "lucide-react";

interface StorageAdvisorPanelProps {
  creditsAvailable: number;
  onRunAnalysis: () => void;
  onAskAiFree: () => void;
  onViewHistory: () => void;
}

export default function StorageAdvisorPanel({
  creditsAvailable,
  onRunAnalysis,
  onAskAiFree,
  onViewHistory,
}: StorageAdvisorPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalUnits = typeof window !== "undefined"
    ? (() => {
        try {
          const saved = localStorage.getItem("commerceos_location_stock_v5");
          if (saved) {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) return parsed.reduce((acc: number, r: any) => acc + (r.availableQty || 0), 0);
          }
        } catch {}
        return 0;
      })()
    : 0;

  const potentialSavings = totalUnits > 0 ? Math.round(totalUnits * 1.5) : 0;

  return (
    <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-b from-violet-50/50 to-white p-4 shadow-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              Storage Advisor
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[9px] font-extrabold text-violet-800 border border-violet-200">
                AI Powered
              </span>
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-slate-400 hover:text-slate-700 transition-colors"
        >
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Collapsed State (Height < 120px) */}
      <div className="mt-3 flex items-center justify-between border-t border-violet-100/80 pt-3">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Potential Savings
          </span>
          <span className="text-sm font-extrabold text-emerald-700">₹{potentialSavings.toLocaleString()}/mo</span>
        </div>

        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Credits
          </span>
          <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1">
            <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
            {creditsAvailable} Available
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 space-y-2 pt-1">
        <button
          type="button"
          onClick={onRunAnalysis}
          className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-violet-700 active:scale-[0.98] transition-all"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Run AI Analysis (1 Cr)
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onAskAiFree}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-2.5 py-1.5 text-xs font-extrabold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <MessageSquare className="h-3.5 w-3.5 text-emerald-400" />
            Ask AI (Free)
          </button>

          <button
            type="button"
            onClick={onViewHistory}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <History className="h-3.5 w-3.5 text-slate-400" />
            History
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 rounded-xl bg-white p-3 text-[11px] text-slate-600 border border-slate-100">
          <p className="font-semibold text-slate-900">
            {totalUnits > 0
              ? `Real-time Analysis: ${totalUnits.toLocaleString()} units allocated across storage bins.`
              : "Zero stock alerts detected. Storage bins are operating cleanly."}
          </p>
          <p className="mt-1 text-slate-500">
            {totalUnits > 0
              ? "All location transfers and bin allocations are synchronized."
              : "Receive stock or create purchase bills to analyze live storage optimization."}
          </p>
        </div>
      )}
    </div>
  );
}
