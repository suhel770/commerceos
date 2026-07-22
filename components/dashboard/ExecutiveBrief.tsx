import { Sparkles } from "lucide-react";

import type { DashboardData } from "@/lib/dashboard/dashboard-data";
import DashboardCard from "./DashboardCard";

interface ExecutiveBriefProps {
  brief: DashboardData["executiveBrief"];
  healthScore: number;
}

export default function ExecutiveBrief({ brief, healthScore }: ExecutiveBriefProps) {
  return (
    <DashboardCard
      className="h-full w-full border-violet-100 bg-gradient-to-br from-white via-white to-violet-50"
      contentClassName="flex h-full flex-col p-4"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
          <Sparkles className="h-5 w-5 text-violet-600" />
          Executive Brief
        </div>
        <span className="whitespace-nowrap rounded-full bg-violet-100 px-2 py-1 text-[10px] font-semibold text-violet-700">Powered by CommerceOS AI</span>
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-700">Today&apos;s Summary</p>
      <ul className="mt-2 space-y-2 rounded-xl bg-white/80 p-3 text-sm text-slate-700 shadow-sm ring-1 ring-slate-100">
        {brief.summary.map((item) => (
          <li key={item} className="flex gap-2"><span className="text-emerald-500">●</span>{item}</li>
        ))}
      </ul>

      <div className="mt-3 rounded-xl bg-violet-50 p-3.5">
        <div className="text-xs font-semibold text-slate-700">Top Recommendation</div>
        <div className="mt-1 text-[15px] font-semibold text-slate-900">{brief.recommendation}</div>
        <div className="mt-1.5 text-sm font-semibold text-emerald-600">Estimated extra profit: {brief.estimatedProfit}</div>
      </div>

      <div className="mt-auto pt-3">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-700"><span>AI Score</span><span className="text-emerald-600">{healthScore}/100</span></div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${healthScore}%` }} /></div>
      </div>
    </DashboardCard>
  );
}
