"use client";

import React, { useState } from "react";
import {
  ArrowUpRight,
  Info,
} from "lucide-react";

export type KpiHealthStatus = "normal" | "warning" | "critical" | "completed" | "info" | "orange";

export interface ActionableKpiCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: string;
  sourceEngine: string;
  lastUpdated?: string;
  status?: KpiHealthStatus;
  definition?: string;
  calculationLogic?: string;
  relatedModule?: string;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  onDrillDown?: () => void;
  icon: React.ElementType;
}

export default function ActionableKpiCard({
  label,
  value,
  unit,
  trend,
  sourceEngine,
  status = "normal",
  definition,
  calculationLogic,
  primaryActionLabel,
  onPrimaryAction,
  icon: IconComponent,
}: ActionableKpiCardProps) {
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  // Compact Accent Styles
  const statusStyles: Record<
    KpiHealthStatus,
    { border: string; bg: string; iconBg: string; iconColor: string; trendColor: string }
  > = {
    normal: {
      border: "border-slate-200/80 hover:border-emerald-300",
      bg: "bg-white",
      iconBg: "bg-emerald-50 border-emerald-100",
      iconColor: "text-emerald-600",
      trendColor: "text-emerald-600 font-bold",
    },
    warning: {
      border: "border-slate-200/80 hover:border-amber-300",
      bg: "bg-white",
      iconBg: "bg-amber-50 border-amber-100",
      iconColor: "text-amber-600",
      trendColor: "text-amber-600 font-medium",
    },
    completed: {
      border: "border-slate-200/80 hover:border-indigo-300",
      bg: "bg-white",
      iconBg: "bg-indigo-50 border-indigo-100",
      iconColor: "text-indigo-600",
      trendColor: "text-slate-500 font-medium",
    },
    critical: {
      border: "border-slate-200/80 hover:border-rose-300",
      bg: "bg-white",
      iconBg: "bg-rose-50 border-rose-100",
      iconColor: "text-rose-600",
      trendColor: "text-rose-600 font-medium",
    },
    info: {
      border: "border-slate-200/80 hover:border-blue-300",
      bg: "bg-white",
      iconBg: "bg-blue-50 border-blue-100",
      iconColor: "text-blue-600",
      trendColor: "text-emerald-600 font-bold",
    },
    orange: {
      border: "border-slate-200/80 hover:border-orange-300",
      bg: "bg-white",
      iconBg: "bg-orange-50 border-orange-100",
      iconColor: "text-orange-600",
      trendColor: "text-amber-600 font-medium",
    },
  };

  const style = statusStyles[status];

  return (
    <div
      className={`relative p-3 rounded-xl border ${style.border} ${style.bg} shadow-2xs hover:shadow-xs transition duration-150 flex flex-col justify-between group cursor-pointer h-full`}
      onClick={onPrimaryAction}
    >
      <div>
        {/* 1. TOP ROW: Compact Icon & Title */}
        <div className="flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg border ${style.iconBg} ${style.iconColor} shrink-0`}>
              <IconComponent className="w-3.5 h-3.5" />
            </div>
            <span className="text-[11px] font-extrabold text-slate-800 leading-tight">
              {label}
            </span>
          </div>

          {/* Info Icon with Clean Scope Tooltip */}
          <div
            className="relative"
            onMouseEnter={(e) => {
              e.stopPropagation();
              setShowInfoTooltip(true);
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              setShowInfoTooltip(false);
            }}
          >
            <Info className="w-3 h-3 text-slate-300 hover:text-slate-600 shrink-0 transition-colors" />

            {/* Non-Intrusive Info Tooltip */}
            {showInfoTooltip && (
              <div className="absolute right-0 top-full mt-1.5 w-52 p-2.5 bg-slate-900 text-white rounded-lg shadow-xl z-50 text-[10px] leading-snug pointer-events-none animate-in fade-in">
                <span className="font-bold text-indigo-300 block mb-0.5">{sourceEngine}</span>
                <p className="text-slate-200">{definition || `Calculated by ${sourceEngine}`}</p>
                {calculationLogic && (
                  <p className="text-slate-400 font-mono text-[9px] mt-1 pt-1 border-t border-slate-700">
                    Logic: {calculationLogic}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. COMPACT METRIC VALUE */}
        <div className="mt-2.5 flex items-baseline gap-1">
          <span className="text-xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </span>
          {unit && <span className="text-[11px] font-semibold text-slate-400">{unit}</span>}
        </div>

        {/* 3. TREND / SUBTEXT */}
        {trend && (
          <p className={`text-[11px] mt-0.5 ${style.trendColor}`}>
            {trend}
          </p>
        )}
      </div>

      {/* 4. COMPACT OUTLINE ACTION BUTTON */}
      <div className="mt-2.5 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPrimaryAction();
          }}
          className="w-full py-1 px-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition flex items-center justify-between shadow-2xs group/btn"
        >
          <span className="truncate">{primaryActionLabel}</span>
          <ArrowUpRight className="w-3 h-3 text-slate-400 group-hover/btn:text-slate-900 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform shrink-0" />
        </button>
      </div>
    </div>
  );
}
