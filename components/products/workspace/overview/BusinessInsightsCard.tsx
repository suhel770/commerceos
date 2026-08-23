"use client";

import WorkspaceCard from "@/components/ui/WorkspaceCard";
import { ArrowRight, Brain, Inbox, Sparkles } from "lucide-react";

interface BusinessInsightsCardProps {
  onOpenAi?: () => void;
}

export default function BusinessInsightsCard({
  onOpenAi,
}: BusinessInsightsCardProps) {
  return (
    <WorkspaceCard
      height="h-[570px]"
      header={
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">
              <Sparkles size={22} className="text-violet-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                CommerceOS AI
              </h2>
              <p className="text-sm text-slate-500">
                AI powered business recommendations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2">
            <Brain size={16} className="text-slate-500" />
            <span className="text-sm font-semibold text-slate-600">
              Waiting for data
            </span>
          </div>
        </div>
      }
      footer={
        <div className="flex items-center justify-between bg-slate-50 px-6 py-4">
          <div>
            <p className="text-xs text-slate-500">Last analysed</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">—</p>
          </div>
          <button
            type="button"
            onClick={onOpenAi}
            className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            View Full AI Analysis
            <ArrowRight size={16} />
          </button>
        </div>
      }
    >
      <div className="flex min-h-[280px] flex-col items-center justify-center px-5 py-10 text-center">
        <Inbox className="h-5 w-5 text-slate-400" />
        <p className="mt-2 text-sm font-semibold text-slate-700">
          No AI insights yet
        </p>
        <p className="mt-1 max-w-xs text-xs text-slate-500">
          Recommendations appear after sales, stock, and return signals are
          available.
        </p>
      </div>

      <div className="px-5 pb-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Estimated Monthly Opportunity
          </p>
          <h3 className="mt-2 text-4xl font-bold tracking-tight text-slate-400">
            ₹0
          </h3>
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              ["Actions", "0"],
              ["High Priority", "0"],
              ["Success Rate", "—"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl bg-white p-3 text-center"
              >
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </WorkspaceCard>
  );
}
