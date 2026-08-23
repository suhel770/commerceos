"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Crown,
  HelpCircle,
  MessageSquare,
  Sparkles,
  X,
} from "lucide-react";
import {
  inventoryAiCopilotEngine,
  type InventoryAiInsight,
} from "@/lib/inventory/inventory-ai-copilot";
import { notificationEngine } from "@/lib/core/notification-engine";

interface InventoryAiCopilotPanelProps {
  onOpenWhatIfSimulator?: () => void;
}

export default function InventoryAiCopilotPanel({ onOpenWhatIfSimulator }: InventoryAiCopilotPanelProps) {
  const router = useRouter();

  // Collapsed by default (50% height reduction)
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "priority" | "reorder" | "marketplace" | "transfers" | "suppliers" | "dead_stock" | "forecast"
  >("priority");

  const [insights, setInsights] = useState<InventoryAiInsight[]>(
    inventoryAiCopilotEngine.generateInventoryAiInsights()
  );
  const [expandedWhyId, setExpandedWhyId] = useState<string | null>(null);
  const [showBriefModal, setShowBriefModal] = useState(false);
  const [successAnimationId, setSuccessAnimationId] = useState<string | null>(null);

  // ESC key listener: collapses panel, closes modals/why expansions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowBriefModal(false);
        setExpandedWhyId(null);
        setIsExpanded(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleApplyAction = (insight: InventoryAiInsight) => {
    setSuccessAnimationId(insight.id);
    setTimeout(() => {
      notificationEngine.send({
        recipientId: "usr-amir-patel",
        channels: ["in_app"],
        priority: "high",
        title: `✨ AI Action Executed: ${insight.title}`,
        body: `Recommendation approved. Protected ₹${insight.expectedRevenueIncreaseInr.toLocaleString()} revenue & saved ₹${insight.expectedSavingInr.toLocaleString()}.`,
      });
      if (insight.actionRoute) router.push(insight.actionRoute);
      setInsights((prev) => prev.filter((i) => i.id !== insight.id));
      setSuccessAnimationId(null);
    }, 400);
  };

  const handleDismiss = (id: string) => {
    setInsights((prev) => prev.filter((i) => i.id !== id));
  };

  const getBusinessValueTitle = (ins: InventoryAiInsight) => {
    if (ins.category === "reorder") return `Revenue protected: ₹${(ins.expectedRevenueIncreaseInr / 100000).toFixed(1)} Lakhs`;
    if (ins.category === "dead_stock") return `₹${(ins.expectedSavingInr / 1000).toFixed(1)}K Working Capital recoverable`;
    if (ins.category === "marketplace") return `Reduce stock-out probability by 82% at Amazon FBA`;
    if (ins.category === "supplier") return `Save ₹${ins.expectedSavingInr.toLocaleString()} on lead time variance`;
    return ins.title;
  };

  // Filter & cap at MAX 2 cards (per spec)
  const filteredInsights = insights.filter((i) => {
    if (activeTab === "priority") return true;
    if (activeTab === "reorder") return i.category === "reorder";
    if (activeTab === "dead_stock") return i.category === "dead_stock";
    if (activeTab === "marketplace" || activeTab === "transfers") return i.category === "marketplace";
    if (activeTab === "suppliers") return i.category === "supplier";
    return true;
  }).slice(0, 2); // STRICT MAX: 2 cards when expanded

  const criticalCount = insights.filter((i) => i.severity === "critical").length;
  const opportunityCount = insights.filter((i) => i.severity !== "critical").length;
  const totalSavingsInr = insights.reduce((acc, i) => acc + i.expectedSavingInr, 0);
  const totalRevenueInr = insights.reduce((acc, i) => acc + i.expectedRevenueIncreaseInr, 0);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 rounded-2xl border border-indigo-900/40 shadow-xl text-white overflow-hidden">

      {/* ─────────────────────────────────────────────────── */}
      {/* COLLAPSED BAR — always visible, ~48px tall          */}
      {/* ─────────────────────────────────────────────────── */}
      <div className="px-4 py-3 flex flex-wrap items-center gap-2.5 relative">
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-64 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Brand + Health Score */}
        <div className="flex items-center gap-2 shrink-0 z-10">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-xs font-black text-white">🤖 AI Copilot</span>
          <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
            Health 84/100 ↑4%
          </span>
        </div>

        {/* Divider */}
        <div className="hidden sm:block w-px h-4 bg-indigo-800/60 shrink-0 z-10" />

        {/* Live Summary Chips */}
        <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0 z-10">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-mono whitespace-nowrap">
            🔴 {criticalCount} Critical
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono whitespace-nowrap">
            ⚡ {opportunityCount} Opps
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono whitespace-nowrap">
            💰 ₹{totalSavingsInr.toLocaleString()} Saved
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono whitespace-nowrap">
            🛡️ ₹{(totalRevenueInr / 100000).toFixed(1)}L Protected
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0 z-10">
          <button
            type="button"
            onClick={() => setShowBriefModal(true)}
            className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 font-bold rounded-lg text-[10px] transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <svg className="w-3 h-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
            Brief
          </button>
          <button
            type="button"
            className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 font-bold rounded-lg text-[10px] transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <MessageSquare className="w-3 h-3" />
            Ask AI
          </button>
          {onOpenWhatIfSimulator && (
            <button
              type="button"
              onClick={onOpenWhatIfSimulator}
              className="px-2.5 py-1.5 bg-white text-slate-900 font-black rounded-lg text-[10px] shadow hover:bg-slate-100 flex items-center gap-1 cursor-pointer whitespace-nowrap transition"
            >
              <BarChart3 className="w-3 h-3 text-indigo-600" />
              What-If
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded((v) => !v)}
            className="px-2.5 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-extrabold rounded-lg text-[10px] transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {isExpanded ? "Collapse" : "Expand AI Brief"}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────── */}
      {/* EXPANDED SECTION — slides down on toggle            */}
      {/* ─────────────────────────────────────────────────── */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isExpanded ? "max-h-[700px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="px-4 pb-4 space-y-3 border-t border-indigo-900/40 pt-3">

          {/* Category Filter Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 text-[10px] font-bold overflow-x-auto scrollbar-none">
              {[
                { id: "priority", label: "Priority" },
                { id: "reorder", label: "Reorder" },
                { id: "marketplace", label: "Marketplace" },
                { id: "transfers", label: "Transfers" },
                { id: "suppliers", label: "Suppliers" },
                { id: "dead_stock", label: "Dead Stock" },
                { id: "forecast", label: "Forecast" },
              ].map((tb) => (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setActiveTab(tb.id as any)}
                  className={`px-2.5 py-1 rounded-lg transition cursor-pointer whitespace-nowrap ${
                    activeTab === tb.id
                      ? "bg-indigo-600 text-white shadow-sm font-extrabold"
                      : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  {tb.label}
                </button>
              ))}
            </div>
            <span className="text-[9px] font-mono text-indigo-400 font-bold flex items-center gap-1 whitespace-nowrap">
              <Crown className="w-3 h-3 text-amber-400" /> Enterprise Advisor · Max 2 Cards
            </span>
          </div>

          {/* Recommendation Cards — MAX 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredInsights.length === 0 ? (
              <div className="md:col-span-2 p-5 text-center text-xs text-slate-400 bg-slate-800/40 rounded-xl border border-slate-700/60">
                ✓ No active recommendations for this category — inventory is optimized.
              </div>
            ) : (
              filteredInsights.map((ins) => {
                const isExpWhy = expandedWhyId === ins.id;
                const isApplying = successAnimationId === ins.id;
                return (
                  <div
                    key={ins.id}
                    className={`p-3.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition space-y-2.5 shadow-md hover:-translate-y-0.5 duration-200 flex flex-col justify-between ${
                      isApplying ? "scale-95 opacity-50" : ""
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          ins.severity === "critical"
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                            : ins.severity === "warning"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                        }`}>
                          {ins.severity === "critical" ? "🔴 Critical" : "⚡ Opp"} · {ins.category}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                          {ins.confidencePct}% Conf.
                        </span>
                      </div>

                      <h4 className="font-extrabold text-white text-[11px] leading-snug">{getBusinessValueTitle(ins)}</h4>
                      <p className="text-[10px] text-slate-300 leading-snug">{ins.suggestedAction}</p>

                      <div className="flex items-center gap-2 font-mono text-[9px] font-extrabold">
                        {ins.expectedSavingInr > 0 && (
                          <span className="text-emerald-400">Save ₹{ins.expectedSavingInr.toLocaleString()}</span>
                        )}
                        <span className="text-indigo-300">ROI 14.2x</span>
                      </div>

                      {isExpWhy && (
                        <div className="p-2.5 bg-slate-900/90 rounded-lg border border-indigo-500/30 text-[10px] space-y-1 text-slate-200">
                          <div className="font-extrabold text-indigo-300 text-[9px] uppercase tracking-wide">AI Reasoning</div>
                          <p className="text-slate-300 leading-relaxed">{ins.reason}</p>
                          <div className="pt-1 border-t border-slate-800 text-emerald-400 font-mono font-bold text-[9px]">
                            Expected Return: ₹{(ins.expectedSavingInr + ins.expectedRevenueIncreaseInr).toLocaleString()}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setExpandedWhyId(isExpWhy ? null : ins.id)}
                        className="text-[9px] font-bold text-slate-400 hover:text-indigo-300 transition flex items-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3 h-3" />
                        {isExpWhy ? "Hide" : "Why?"}
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDismiss(ins.id)}
                          className="px-2 py-1 bg-slate-700/80 hover:bg-slate-700 text-slate-300 font-bold rounded text-[9px] transition cursor-pointer"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyAction(ins)}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded text-[9px] transition cursor-pointer"
                        >
                          Approve →
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* AI Impact Chips (inside expanded) */}
          <div className="pt-2 border-t border-indigo-900/40">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] font-extrabold text-indigo-300 uppercase tracking-wider font-mono">
                This Month · AI Business Impact
              </span>
              <span className="text-[9px] font-mono text-emerald-400 font-bold">Verified ROI: 28.4x</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { label: "Money Saved", value: "₹3,28,450", color: "text-emerald-400" },
                { label: "Hours Saved", value: "42.5h", color: "text-white" },
                { label: "Dead Stock↓", value: "18 SKUs", color: "text-amber-400" },
                { label: "Stockouts↓", value: "18", color: "text-rose-400" },
                { label: "Capital Freed", value: "₹1.8L", color: "text-indigo-300" },
                { label: "Accept Rate", value: "94%", color: "text-emerald-400" },
              ].map((chip) => (
                <div key={chip.label} className="p-2 bg-slate-800/60 rounded-lg border border-slate-700/50 space-y-0.5">
                  <span className="text-slate-400 block font-sans text-[8px]">{chip.label}</span>
                  <strong className={`font-black text-[10px] ${chip.color}`}>{chip.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* EXECUTIVE BRIEF MODAL */}
      {showBriefModal && (
        <div
          onClick={() => setShowBriefModal(false)}
          className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 cursor-pointer text-slate-900"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4 cursor-default text-xs"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">🤖 Executive Morning Business Brief</h3>
              <button onClick={() => setShowBriefModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-100 space-y-1">
                <span className="font-extrabold text-indigo-950 block">Good Morning Amir</span>
                <p className="text-slate-700 text-[11px] leading-relaxed">
                  Network inventory health improved <strong>4%</strong> overnight. Your highest priority action today is reordering Running Shoes (potential stockout in 3 days; expected revenue protected: <strong>₹1.8 Lakhs</strong>).
                </p>
              </div>
              <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-100 space-y-1 font-mono text-[11px]">
                <span className="font-extrabold text-emerald-950 block font-sans">Today's ROI Summary</span>
                <div className="flex justify-between text-slate-700">
                  <span>Estimated Savings:</span>
                  <strong className="text-emerald-700">₹{totalSavingsInr.toLocaleString()}</strong>
                </div>
                <div className="flex justify-between text-slate-700">
                  <span>Protected Revenue:</span>
                  <strong className="text-indigo-700">₹{(totalRevenueInr / 100000).toFixed(1)} Lakhs</strong>
                </div>
              </div>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowBriefModal(false)}
                className="px-5 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Close Executive Brief
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
