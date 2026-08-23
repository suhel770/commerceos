"use client";

import { Sparkles, Bot, ShieldCheck, Zap } from "lucide-react";

import type { DashboardData } from "@/lib/dashboard/dashboard-data";
import { useCapabilities } from "@/providers/ExperienceProvider";
import DashboardCard from "./DashboardCard";

interface ExecutiveBriefProps {
  brief: DashboardData["executiveBrief"];
  healthScore: number;
}

export default function ExecutiveBrief({ brief, healthScore }: ExecutiveBriefProps) {
  const capabilities = useCapabilities();
  const { aiTier } = capabilities;

  const title =
    aiTier === "simple_guidance"
      ? "AI Guidance"
      : aiTier === "optimization"
        ? "AI Optimization Brief"
        : "Executive AI Advisor";

  const badgeText =
    aiTier === "simple_guidance"
      ? "🟢 Solo Guidance AI"
      : aiTier === "optimization"
        ? "🟡 Growth Optimization AI"
        : "🔴 Executive AI Advisor";

  const Icon =
    aiTier === "simple_guidance"
      ? Bot
      : aiTier === "optimization"
        ? Zap
        : Sparkles;

  const recommendations =
    aiTier === "simple_guidance"
      ? [
          "Maintain daily purchase logging to track stock accurately.",
          "Check low stock alerts before creating new customer orders.",
        ]
      : aiTier === "optimization"
        ? [
          "Rebalance fast-moving SKUs between main stock and active bins.",
          "Review vendor lead-time trends to reduce stockout risk.",
        ]
        : [
          ...brief.summary,
          "Department cost-center threshold alert: Procurement budget on track.",
        ];

  return (
    <DashboardCard
      className="h-full w-full border-violet-100 bg-gradient-to-br from-white via-white to-violet-50"
      contentClassName="flex h-full flex-col p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-extrabold tracking-tight text-slate-900">
          <Icon className="h-4.5 w-4.5 text-violet-600" />
          {title}
        </div>
        <span className="whitespace-nowrap rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-violet-700">
          {badgeText}
        </span>
      </div>

      <p className="mt-4 text-xs font-extrabold uppercase tracking-wider text-slate-900">
        {aiTier === "simple_guidance"
          ? "Daily Operational Tips"
          : aiTier === "optimization"
            ? "Inventory & Profit Insights"
            : "Strategic Executive Brief"}
      </p>
      <ul className="mt-4 space-y-2 rounded-xl bg-white/80 p-3 text-sm text-slate-700 shadow-sm ring-1 ring-slate-100">
        {recommendations.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-emerald-500">●</span>
            {item}
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-xl bg-violet-50 p-3.5">
        <div className="text-xs font-semibold text-slate-700">Recommended Action</div>
        <div className="mt-1 text-[15px] font-semibold text-slate-900">
          {aiTier === "simple_guidance"
            ? "Review current inventory and log incoming purchases"
            : aiTier === "optimization"
              ? "Optimize SKU reorder points across active channels"
              : brief.recommendation}
        </div>
        <div className="mt-1.5 text-sm font-semibold text-emerald-600">
          Estimated value: {brief.estimatedProfit}
        </div>
      </div>

      <div className="mt-auto pt-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>{aiTier === "simple_guidance" ? "Health Index" : "AI Optimization Score"}</span>
          <span className="text-emerald-600">{healthScore}/100</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-emerald-500"
            style={{ width: `${healthScore}%` }}
          />
        </div>
      </div>
    </DashboardCard>
  );
}
