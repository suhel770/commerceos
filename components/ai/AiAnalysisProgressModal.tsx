"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

interface AiAnalysisProgressModalProps {
  isOpen: boolean;
  moduleName?: string;
  onComplete: () => void;
}

const STAGES = [
  { id: "s1", label: "Reading Inventory Engine SOT", delay: 300 },
  { id: "s2", label: "Reading Purchase Engine",     delay: 700 },
  { id: "s3", label: "Reading Storage Network Engine",delay: 1100 },
  { id: "s4", label: "Analyzing Marketplace Velocity",delay: 1500 },
  { id: "s5", label: "Generating Executive Report",  delay: 2000 },
  { id: "s6", label: "Saving Report to AI History",  delay: 2500 },
  { id: "s7", label: "Complete",                     delay: 3000 },
];

export default function AiAnalysisProgressModal({
  isOpen,
  moduleName = "Inventory",
  onComplete,
}: AiAnalysisProgressModalProps) {
  const [completedStages, setCompletedStages] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) {
      setCompletedStages([]);
      STAGES.forEach((stage) => {
        setTimeout(() => {
          setCompletedStages((prev) => [...prev, stage.id]);
        }, stage.delay);
      });

      // Complete callback after final stage
      setTimeout(() => {
        onComplete();
      }, 3400);
    }
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  const currentProgressPct = Math.round((completedStages.length / STAGES.length) * 100);

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-indigo-900/40 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6 text-white shadow-2xl space-y-6">

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 shrink-0">
            <Loader2 className="w-6 h-6 text-indigo-300 animate-spin" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">Generating Executive {moduleName} Report...</h3>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xs text-indigo-300 mt-0.5">Running CommerceOS Decision Intelligence scan</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-indigo-300">Analysis Progress</span>
            <span className="font-extrabold text-amber-400">{currentProgressPct}%</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-amber-400 transition-all duration-300 rounded-full"
              style={{ width: `${currentProgressPct}%` }}
            />
          </div>
        </div>

        {/* Stages List */}
        <div className="space-y-2 pt-2 border-t border-indigo-900/40">
          {STAGES.map((stage) => {
            const isDone = completedStages.includes(stage.id);
            return (
              <div key={stage.id} className="flex items-center justify-between py-1 text-xs">
                <div className="flex items-center gap-2.5">
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-slate-700 shrink-0 animate-pulse" />
                  )}
                  <span className={`transition-colors ${isDone ? "text-white font-semibold" : "text-slate-500"}`}>
                    {stage.label}
                  </span>
                </div>
                {isDone && <span className="text-[10px] font-mono text-emerald-400">DONE</span>}
              </div>
            );
          })}
        </div>

        <p className="text-[10px] text-slate-400 text-center font-mono pt-2 border-t border-indigo-900/30">
          CommerceOS Universal AI Engine • Deducting 5 Credits
        </p>

      </div>
    </div>
  );
}
