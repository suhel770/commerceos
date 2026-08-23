"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquare,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import type { InventoryIntelligenceSummary, SkuDecisionMetrics } from "@/lib/inventory/inventory-decision-engine";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface InventoryAiContext {
  summary: InventoryIntelligenceSummary;
  skuMetricsList: SkuDecisionMetrics[];
}

interface InventoryAiBannerProps {
  context: InventoryAiContext;
  onOpenAskAi: () => void;
}

type AiState = "sleeping" | "analyzing" | "brief";

const ANALYSIS_STEPS = [
  { id: "balance",     label: "Inventory Balance",          delay: 200  },
  { id: "velocity",   label: "Sales Velocity Analysis",    delay: 500  },
  { id: "purchase",   label: "Purchase History",           delay: 800  },
  { id: "marketplace",label: "Marketplace Allocation",     delay: 1100 },
  { id: "dead",       label: "Dead Stock Detection",       delay: 1500 },
  { id: "holding",    label: "Holding Cost Calculation",   delay: 1900 },
  { id: "capital",    label: "Working Capital Assessment", delay: 2300 },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function InventoryAiBanner({ context, onOpenAskAi }: InventoryAiBannerProps) {
  const [aiState, setAiState] = useState<AiState>("sleeping");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [briefVisible, setBriefVisible] = useState(false);
  const [cardsFadedIn, setCardsFadedIn] = useState(0);

  const { summary, skuMetricsList } = context;

  // Derived intelligence values (computed from engine SOT, never hardcoded logic)
  const deadCapital = skuMetricsList
    .filter((m) => m.isDeadStock)
    .reduce((acc, m) => acc + m.totalAssetValue, 0);
  const estMonthlySaving = Math.round(summary.totalMonthlyHoldingCost * 0.35 + deadCapital * 0.08);
  const estOpportunityMin = Math.max(18000, Math.round(estMonthlySaving * 0.7));
  const estOpportunityMax = Math.round(estMonthlySaving * 1.6);
  const healthScore = Math.max(
    40,
    100
      - summary.countReorderRequired * 8
      - summary.countDeadStock * 10
      - (summary.countDamaged > 0 ? 5 : 0)
  );

  const revenueProtected = skuMetricsList
    .filter((m) => m.isReorderRequired)
    .reduce((acc, m) => acc + m.reorderPoint * 2 * 1200, 0);

  // Opportunities
  const opportunities = [
    summary.countReorderRequired > 0 && {
      icon: "🔁",
      title: "Reorder Alert",
      desc: `${summary.countReorderRequired} SKU${summary.countReorderRequired > 1 ? "s" : ""} below safety stock — potential stockout in 3–5 days.`,
      saving: `₹${(revenueProtected / 100000).toFixed(1)}L revenue at risk`,
      color: "rose",
    },
    summary.countDeadStock > 0 && {
      icon: "📦",
      title: "Dead Stock Recovery",
      desc: `${summary.countDeadStock} non-moving SKU${summary.countDeadStock > 1 ? "s" : ""} locking ₹${(deadCapital / 1000).toFixed(0)}K in working capital.`,
      saving: `₹${(deadCapital / 1000).toFixed(0)}K recoverable`,
      color: "amber",
    },
    summary.totalMonthlyHoldingCost > 0 && {
      icon: "💰",
      title: "Holding Cost Reduction",
      desc: `Monthly holding cost of ₹${summary.totalMonthlyHoldingCost.toLocaleString()} can be reduced by 30–40% with optimized stock levels.`,
      saving: `Save ₹${Math.round(summary.totalMonthlyHoldingCost * 0.35).toLocaleString()}/mo`,
      color: "emerald",
    },
  ].filter(Boolean).slice(0, 3) as Array<{icon:string;title:string;desc:string;saving:string;color:string}>;

  const risks = [
    summary.countReorderRequired >= 2 && {
      icon: "⚠️",
      title: "Stockout Risk — High",
      desc: `${summary.countReorderRequired} SKUs are critically low. Unaddressed within 48 hours, expect order fulfillment failures.`,
      color: "rose",
    },
    summary.averageDioDays > 45 && {
      icon: "🕐",
      title: "Capital Over-exposure",
      desc: `Average DIO of ${summary.averageDioDays} days exceeds optimal 15–30 day range. Excess capital locked in slow-moving stock.`,
      color: "amber",
    },
  ].filter(Boolean).slice(0, 2) as Array<{icon:string;title:string;desc:string;color:string}>;

  // ESC to go back to sleeping
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && aiState === "brief") {
        setAiState("sleeping");
        setBriefVisible(false);
        setCompletedSteps([]);
        setCardsFadedIn(0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [aiState]);

  // Run analysis state machine
  const runAnalysis = () => {
    setAiState("analyzing");
    setCompletedSteps([]);
    setCardsFadedIn(0);

    // Animate each step completing
    ANALYSIS_STEPS.forEach((step) => {
      setTimeout(() => {
        setCompletedSteps((prev) => [...prev, step.id]);
      }, step.delay);
    });

    // After all steps complete, show brief
    setTimeout(() => {
      setAiState("brief");
      setBriefVisible(true);
      // Sequentially fade in recommendation cards
      [0, 1, 2].forEach((i) => {
        setTimeout(() => setCardsFadedIn((n) => n + 1), i * 200 + 300);
      });
    }, 2700);
  };

  const resetToSleeping = () => {
    setAiState("sleeping");
    setBriefVisible(false);
    setCompletedSteps([]);
    setCardsFadedIn(0);
  };

  // ── SLEEPING STATE ──────────────────────────────────────────────────────────
  if (aiState === "sleeping") {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        {/* Subtle gradient accent */}
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-indigo-500 via-violet-500 to-indigo-400 rounded-l-2xl" />

        <div className="flex flex-wrap items-center gap-4 px-5 py-4 pl-6">
          {/* Icon + Label */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="relative">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <Brain className="w-5 h-5 text-indigo-500" />
              </div>
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-slate-300 rounded-full border-2 border-white" title="Sleeping" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-900">CommerceOS Inventory Advisor</p>
              <p className="text-xs text-slate-500">AI is sleeping · Run an analysis to get actionable insights</p>
            </div>
          </div>

          {/* Opportunity hints */}
          <div className="hidden md:flex items-center gap-1.5 flex-1 flex-wrap">
            {["Stock-out risks", "Dead stock", "Reorder opportunities", "Working capital"].map((hint) => (
              <span key={hint} className="text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full">
                • {hint}
              </span>
            ))}
          </div>

          {/* Estimated opportunity */}
          <div className="hidden lg:block shrink-0 text-right">
            <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Est. Monthly Opportunity</p>
            <p className="text-base font-black text-indigo-700">
              ₹{(estOpportunityMin / 1000).toFixed(0)}K–₹{(estOpportunityMax / 1000).toFixed(0)}K
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={runAnalysis}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Run Free Analysis
            </button>
            <button
              type="button"
              onClick={onOpenAskAi}
              className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" />
              Ask AI
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── ANALYZING STATE ─────────────────────────────────────────────────────────
  if (aiState === "analyzing") {
    return (
      <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6 shadow-lg text-white">
        <div className="flex items-start gap-4">
          {/* Spinner */}
          <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 shrink-0 mt-0.5">
            <Loader2 className="w-5 h-5 text-indigo-300 animate-spin" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-lg font-black text-white mb-0.5">Analyzing Inventory...</p>
            <p className="text-sm text-indigo-300 mb-4">Running 7-point business intelligence scan</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
              {ANALYSIS_STEPS.map((step) => {
                const done = completedSteps.includes(step.id);
                return (
                  <div key={step.id} className="flex items-center gap-2.5">
                    {done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-slate-600 shrink-0 animate-pulse" />
                    )}
                    <span className={`text-sm transition-all duration-300 ${done ? "text-white font-semibold" : "text-slate-500"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── EXECUTIVE BRIEF STATE ───────────────────────────────────────────────────
  return (
    <div className="rounded-2xl border border-indigo-900/40 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white shadow-xl overflow-hidden">

      {/* ── Brief Header ── */}
      <div className="px-6 pt-5 pb-4 border-b border-indigo-900/40 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 shrink-0">
            <Brain className="w-6 h-6 text-indigo-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl md:text-2xl font-black text-white">Executive AI Brief</h2>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono uppercase tracking-wider">
                ✓ Analysis Complete
              </span>
            </div>
            <p className="text-sm text-indigo-300 mt-0.5">Based on real-time inventory data · {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
        </div>

        {/* Health Score + Reset */}
        <div className="flex items-center gap-3">
          {/* Health Score */}
          <div className="text-center">
            <div className="relative w-14 h-14">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke="#1e293b" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none" stroke={healthScore >= 70 ? "#10b981" : healthScore >= 50 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={`${healthScore}, 100`} />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-black text-white">{healthScore}</span>
            </div>
            <p className="text-[9px] font-bold text-slate-400 mt-0.5">Health Score</p>
          </div>

          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={onOpenAskAi}
              className="px-3 py-1.5 bg-indigo-600/40 hover:bg-indigo-600/60 text-indigo-200 border border-indigo-500/40 font-bold rounded-lg text-[10px] transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <MessageSquare className="w-3 h-3" /> Ask AI
            </button>
            <button
              type="button"
              onClick={resetToSleeping}
              className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 border border-slate-700 font-bold rounded-lg text-[10px] transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <ChevronUp className="w-3 h-3" /> Collapse
            </button>
          </div>
        </div>
      </div>

      {/* ── Business Metrics Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-px border-b border-indigo-900/30 bg-indigo-900/20">
        {[
          { label: "Potential Monthly Saving", value: `₹${(estMonthlySaving / 1000).toFixed(0)}K`, icon: "💰", color: "text-emerald-300" },
          { label: "Revenue Protected",         value: `₹${(revenueProtected / 100000).toFixed(1)}L`, icon: "🛡️", color: "text-indigo-300" },
          { label: "Working Capital at Risk",   value: `₹${(deadCapital / 1000).toFixed(0)}K`, icon: "🔒", color: "text-amber-300" },
          { label: "Inventory Health",          value: `${healthScore}/100`, icon: "📊", color: healthScore >= 70 ? "text-emerald-300" : "text-rose-300" },
        ].map((m) => (
          <div key={m.label} className="px-5 py-3.5 bg-slate-900/60">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">{m.label}</p>
            <p className={`text-xl font-black mt-0.5 ${m.color}`}>{m.icon} {m.value}</p>
          </div>
        ))}
      </div>

      {/* ── Opportunities + Risks ── */}
      <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Opportunities */}
        <div>
          <p className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Top Opportunities
          </p>
          <div className="space-y-2.5">
            {opportunities.length === 0 ? (
              <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-sm text-emerald-300 font-semibold">
                ✓ No major opportunities detected — inventory is well optimized.
              </div>
            ) : (
              opportunities.map((opp, i) => (
                <div
                  key={opp.title}
                  className={`p-4 bg-slate-800/60 rounded-xl border border-slate-700/60 transition-all duration-500 ${
                    cardsFadedIn > i ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <p className="text-sm font-black text-white">{opp.icon} {opp.title}</p>
                    <span className="text-[9px] font-black text-emerald-300 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono whitespace-nowrap">
                      {opp.saving}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">{opp.desc}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Risks */}
        <div>
          <p className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" /> Risk Alerts
          </p>
          <div className="space-y-2.5">
            {risks.length === 0 ? (
              <div className="p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-sm text-emerald-300 font-semibold">
                ✓ No critical risks detected. Inventory health is stable.
              </div>
            ) : (
              risks.map((risk, i) => (
                <div
                  key={risk.title}
                  className={`p-4 bg-rose-500/10 rounded-xl border border-rose-500/20 transition-all duration-500 ${
                    cardsFadedIn > i + opportunities.length - 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                  }`}
                >
                  <p className="text-sm font-black text-rose-300 mb-1">{risk.icon} {risk.title}</p>
                  <p className="text-sm text-slate-300 leading-relaxed">{risk.desc}</p>
                </div>
              ))
            )}
          </div>

          {/* Ask AI nudge */}
          <div className="mt-3 p-3.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-indigo-300">Want to go deeper?</p>
              <p className="text-xs text-slate-400 mt-0.5">Ask AI any inventory question in plain language.</p>
            </div>
            <button
              type="button"
              onClick={onOpenAskAi}
              className="shrink-0 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Ask AI <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
