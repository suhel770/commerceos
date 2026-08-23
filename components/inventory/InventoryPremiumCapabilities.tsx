"use client";

import { Lock, Sparkles } from "lucide-react";

interface PremiumCapability {
  id: string;
  icon: string;
  name: string;
  description: string;
  benefit: string;
  tier: "Growth AI" | "Enterprise AI";
  color: string;
  borderColor: string;
}

const CAPABILITIES: PremiumCapability[] = [
  {
    id: "forecast",
    icon: "📈",
    name: "Demand Forecasting",
    description: "AI predicts demand 30, 60, 90 days ahead using sales velocity, seasonality, and market trends.",
    benefit: "Reduce overstock by 25% · Eliminate surprise stockouts",
    tier: "Growth AI",
    color: "from-indigo-50 to-blue-50",
    borderColor: "border-indigo-200",
  },
  {
    id: "scenario",
    icon: "🔬",
    name: "Scenario Simulator",
    description: "Simulate +40% sales growth, channel shifts, or supplier delays before making real decisions.",
    benefit: "Make confident inventory decisions with zero risk",
    tier: "Growth AI",
    color: "from-violet-50 to-purple-50",
    borderColor: "border-violet-200",
  },
  {
    id: "capital",
    icon: "🏦",
    name: "Working Capital Advisor",
    description: "Optimizes when to buy, how much to buy, and when to liquidate — minimizing capital lock-up.",
    benefit: "Free up 20–35% working capital from overstock",
    tier: "Growth AI",
    color: "from-emerald-50 to-teal-50",
    borderColor: "border-emerald-200",
  },
  {
    id: "marketplace",
    icon: "🛒",
    name: "Marketplace Optimizer",
    description: "AI allocates optimal stock across Amazon, Flipkart, Meesho, and direct channels in real time.",
    benefit: "Maximize sell-through rate across every channel",
    tier: "Enterprise AI",
    color: "from-amber-50 to-orange-50",
    borderColor: "border-amber-200",
  },
  {
    id: "profitability",
    icon: "💎",
    name: "Profitability Advisor",
    description: "Calculates true per-SKU profitability after marketplace fees, returns, storage, and shipping.",
    benefit: "Identify which SKUs make you money vs destroy margin",
    tier: "Enterprise AI",
    color: "from-rose-50 to-pink-50",
    borderColor: "border-rose-200",
  },
  {
    id: "supplier",
    icon: "🤝",
    name: "Supplier Intelligence",
    description: "Tracks lead time accuracy, fill rates, damage rates, and pricing trends per supplier.",
    benefit: "Reduce supply risk and negotiate from data, not gut",
    tier: "Enterprise AI",
    color: "from-slate-50 to-gray-50",
    borderColor: "border-slate-200",
  },
];

export default function InventoryPremiumCapabilities() {
  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs font-black text-slate-800">Premium AI Capabilities</p>
            <p className="text-[10px] text-slate-500">Unlock growth with business-grade AI advisors</p>
          </div>
        </div>
        <button
          type="button"
          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg text-[10px] transition cursor-pointer shadow-sm"
        >
          View Plans →
        </button>
      </div>

      {/* Capability Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {CAPABILITIES.map((cap) => (
          <div
            key={cap.id}
            className={`relative p-3.5 bg-gradient-to-br ${cap.color} rounded-xl border ${cap.borderColor} group hover:-translate-y-0.5 hover:shadow-md transition-all cursor-default overflow-hidden`}
          >
            {/* Lock badge */}
            <div className="absolute top-2.5 right-2.5">
              <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                cap.tier === "Growth AI"
                  ? "bg-indigo-100 text-indigo-700 border border-indigo-200"
                  : "bg-amber-100 text-amber-700 border border-amber-200"
              }`}>
                <Lock className="w-2 h-2" />
                {cap.tier === "Growth AI" ? "Growth" : "Enterprise"}
              </div>
            </div>

            {/* Icon */}
            <div className="text-2xl mb-2">{cap.icon}</div>

            {/* Name */}
            <p className="text-[11px] font-black text-slate-800 leading-snug mb-1">{cap.name}</p>

            {/* Description */}
            <p className="text-[10px] text-slate-500 leading-snug mb-2">{cap.description}</p>

            {/* Benefit */}
            <div className="pt-2 border-t border-slate-200/60">
              <p className="text-[9px] font-extrabold text-slate-600 leading-snug">{cap.benefit}</p>
            </div>

            {/* Upgrade CTA — appears on hover */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-white/90 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
              <button
                type="button"
                className="w-full text-center text-[9px] font-black text-indigo-700 hover:text-indigo-900 transition"
              >
                Unlock in {cap.tier} →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
