"use client";

import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, History, MessageSquare, Zap } from "lucide-react";

interface LocationAiAdvisorCardProps {
  locationName: string;
  creditsAvailable: number;
  onRunAnalysis: () => void;
  onAskAiFree: () => void;
  onViewHistory: () => void;
}

export default function LocationAiAdvisorCard({
  locationName,
  creditsAvailable,
  onRunAnalysis,
  onAskAiFree,
  onViewHistory,
}: LocationAiAdvisorCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="rounded-2xl border border-violet-200/80 bg-gradient-to-b from-violet-50/50 to-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
              Storage Advisor — {locationName}
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

      <div className="mt-3 flex items-center justify-between border-t border-violet-100/80 pt-3">
        <div>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Potential Savings
          </span>
          <span className="text-sm font-extrabold text-emerald-700">₹18,500/mo</span>
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

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onRunAnalysis}
            className="flex items-center justify-center gap-1 rounded-xl bg-violet-600 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-violet-700 transition-colors"
          >
            <Sparkles className="h-3 w-3" />
            Run Analysis (1 Cr)
          </button>

          <button
            type="button"
            onClick={onAskAiFree}
            className="flex items-center justify-center gap-1 rounded-xl bg-slate-900 px-2.5 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <MessageSquare className="h-3 w-3 text-emerald-400" />
            Ask AI (FREE)
          </button>

          <button
            type="button"
            onClick={onViewHistory}
            className="flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <History className="h-3 w-3 text-slate-400" />
            History
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-3 rounded-xl bg-white p-3 text-[11px] text-slate-600 border border-slate-100">
          <p className="font-semibold text-slate-900">
            Automated Report: Dead Stock & Optimization Notice
          </p>
          <p className="mt-1 text-slate-500">
            40 units of slow-moving Footwear SKU have remained un-moved for &gt;60 days in this location. Recommended transfer or seasonal promo.
          </p>
        </div>
      )}
    </div>
  );
}
