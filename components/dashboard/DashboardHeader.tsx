"use client";

import { useExperience, useCapabilities } from "@/providers/ExperienceProvider";
import DashboardControls from "./DashboardControls";

export default function DashboardHeader() {
  const { level } = useExperience();
  const capabilities = useCapabilities();

  const planBadge =
    level === "solo"
      ? {
          label: "🟢 Solo Seller Mode",
          color: "border-emerald-200 bg-emerald-50 text-emerald-800",
          dot: "bg-emerald-500",
          desc: "Zero-complexity operational workspace — Purchase → Inventory → Sell.",
        }
      : level === "growing"
        ? {
            label: "🟡 Growing Seller Mode",
            color: "border-amber-200 bg-amber-50 text-amber-800",
            dot: "bg-amber-500",
            desc: "Expanding business tier — Warehouse receiving, Stock transfers & Basic QC unlocked.",
          }
        : {
            label: "🔴 Enterprise Plan",
            color: "border-rose-200 bg-rose-50 text-rose-800",
            dot: "bg-rose-500",
            desc: "Full CommerceOS platform — Digital Twin, High-volume Docks, Cost Centers & Executive AI.",
          };

  return (
    <header className="flex flex-col gap-4 py-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Good morning, Amir <span aria-hidden="true">👋</span>
          </h1>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider ${planBadge.color}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${planBadge.dot}`} />
            {planBadge.label}
          </span>
        </div>
        <p className="mt-0.5 text-xs font-semibold text-slate-500">{planBadge.desc}</p>
      </div>
      <DashboardControls />
    </header>
  );
}
