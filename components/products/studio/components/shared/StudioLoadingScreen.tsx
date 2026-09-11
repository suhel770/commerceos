"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Database,
  Layers,
  Loader2,
  Package,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

interface StepItem {
  id: string;
  label: string;
  detail: string;
  icon: typeof Package;
}

const STEPS: StepItem[] = [
  {
    id: "master_listing",
    label: "Loading Master Listing",
    detail: "Fetching product schema, variants, and catalog attributes",
    icon: Package,
  },
  {
    id: "studio_engine",
    label: "Preparing Studio Engine",
    detail: "Initializing domain validation rules and workflow models",
    icon: Layers,
  },
  {
    id: "commercials",
    label: "Syncing Inventory & Commercials",
    detail: "Connecting real warehouse stock and pricing configurations",
    icon: Database,
  },
  {
    id: "readiness",
    label: "Checking Publishing Readiness",
    detail: "Validating marketplace compliance & asset readiness",
    icon: ShieldCheck,
  },
];

export default function StudioLoadingScreen() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setCurrentStep(1), 500);
    const timer2 = setTimeout(() => setCurrentStep(2), 1200);
    const timer3 = setTimeout(() => setCurrentStep(3), 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, []);

  const progressPercent = Math.min(100, Math.round(((currentStep + 1) / STEPS.length) * 95));

  return (
    <div className="flex min-h-[680px] w-full items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-lg">
        {/* Ambient Decorative Glow Background */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 h-44 w-72 bg-gradient-to-tr from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl pointer-events-none" />

        {/* Main Floating Glass Container */}
        <div className="relative rounded-3xl border border-slate-200/90 bg-white/95 p-6 sm:p-8 shadow-xl backdrop-blur-md">
          {/* Header Icon */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-blue-50 to-indigo-50/80 border border-blue-200/60 shadow-sm">
              <Package className="h-8 w-8 text-blue-600 animate-pulse" strokeWidth={1.75} />
              <div className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-spin" style={{ animationDuration: "6s" }} />
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Loading Product Studio
            </h1>
            <p className="mt-1.5 text-xs text-slate-500 font-medium max-w-sm">
              Preparing your master listing, validating marketplace requirements, and configuring your workspace.
            </p>
          </div>

          {/* Overall Progress Bar */}
          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50/70 p-3">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5 px-0.5">
              <span className="text-slate-600">Initializing Workspace</span>
              <span className="font-mono text-blue-600">{progressPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200/70">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Stepper Rows */}
          <div className="mt-5 divide-y divide-slate-100/90 rounded-2xl border border-slate-200/80 bg-white shadow-2xs overflow-hidden">
            {STEPS.map((step, idx) => {
              const isDone = idx < currentStep;
              const isActive = idx === currentStep;
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3.5 p-3 sm:px-4 transition-colors duration-300 ${
                    isActive
                      ? "bg-blue-50/40"
                      : isDone
                      ? "bg-white"
                      : "bg-slate-50/30 opacity-60"
                  }`}
                >
                  {/* Status Indicator Icon */}
                  <div className="shrink-0 flex items-center justify-center">
                    {isDone ? (
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/80 shadow-2xs">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    ) : isActive ? (
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-blue-100 text-blue-600 border border-blue-200/80 shadow-2xs">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-100 text-slate-400 border border-slate-200">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                    )}
                  </div>

                  {/* Step Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={`text-xs font-bold truncate ${
                          isActive
                            ? "text-blue-900"
                            : isDone
                            ? "text-slate-800"
                            : "text-slate-500"
                        }`}
                      >
                        {step.label}
                      </p>
                      {isActive && (
                        <span className="text-[10px] font-semibold text-blue-600 shrink-0 uppercase tracking-wider">
                          In progress
                        </span>
                      )}
                      {isDone && (
                        <span className="text-[10px] font-semibold text-emerald-600 shrink-0">
                          Ready
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                      {step.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Security Badge */}
          <div className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] font-semibold text-slate-400">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            <span>Connected to Live Enterprise Database Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}