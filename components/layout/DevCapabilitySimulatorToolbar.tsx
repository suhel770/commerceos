"use client";

import { useState } from "react";
import {
  Boxes,
  CheckCircle2,
  ChevronDown,
  Layers,
  Shield,
  Sliders,
  Sparkles,
  Wrench,
  X,
} from "lucide-react";

import { useExperience } from "@/providers/ExperienceProvider";
import type { ExperienceLevel } from "@/lib/capabilities/capability-engine";

const MODE_CONFIG: Record<
  ExperienceLevel,
  { label: string; badge: string; color: string; indicator: string; bg: string }
> = {
  solo: {
    label: "Solo Seller Mode",
    badge: "🟢 Solo",
    color: "text-emerald-700 bg-emerald-50 border-emerald-200",
    indicator: "bg-emerald-500",
    bg: "hover:bg-emerald-100/60",
  },
  growing: {
    label: "Growing Seller Mode",
    badge: "🟡 Growing",
    color: "text-amber-800 bg-amber-50 border-amber-200",
    indicator: "bg-amber-500",
    bg: "hover:bg-amber-100/60",
  },
  enterprise: {
    label: "Enterprise Seller Mode",
    badge: "🔴 Enterprise",
    color: "text-rose-800 bg-rose-50 border-rose-200",
    indicator: "bg-rose-500",
    bg: "hover:bg-rose-100/60",
  },
};

export default function DevCapabilitySimulatorToolbar() {
  const { level, setLevel, capabilities, devPanelOpen, toggleDevSimulatorPanel } =
    useExperience();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const currentMode = MODE_CONFIG[level];

  return (
    <div className="flex items-center gap-2">
      {/* GLOBAL CAPABILITY SIMULATOR SELECTOR PILL */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen((open) => !open)}
          className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-bold transition shadow-2xs ${currentMode.color} ${currentMode.bg}`}
          title="Global Experience Capability Simulator (Dev Mode)"
        >
          <span className={`h-2 w-2 rounded-full animate-pulse ${currentMode.indicator}`} />
          <span className="font-mono">{currentMode.badge}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </button>

        {/* DROPDOWN SELECTOR MENU */}
        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-[60]"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 mt-2 z-[70] w-72 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl space-y-1">
              <div className="px-3 py-2 border-b border-slate-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Global Experience Mode Simulator
                </span>
                <p className="text-xs text-slate-500">
                  Select seller tier to instantly adapt the entire platform.
                </p>
              </div>

              {(["solo", "growing", "enterprise"] as const).map((m) => {
                const conf = MODE_CONFIG[m];
                const active = level === m;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setLevel(m);
                      setDropdownOpen(false);
                    }}
                    className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition ${
                      active
                        ? "bg-slate-100 font-bold text-slate-900 ring-1 ring-slate-300"
                        : "hover:bg-slate-50 text-slate-700"
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full mt-1.5 shrink-0 ${conf.indicator}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold">{conf.label}</span>
                        {active && <CheckCircle2 className="h-3.5 w-3.5 text-violet-600" />}
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-1">
                        {m === "solo" && "Minimal UI · Hides Warehouse, Dock & QC"}
                        {m === "growing" && "Unlocks Warehouse Queue, Basic QC & AI"}
                        {m === "enterprise" && "Full Platform · Digital Twin, Docks & Cost Centers"}
                      </p>
                    </div>
                  </button>
                );
              })}

              <div className="pt-2 border-t border-slate-100 flex justify-between items-center px-2">
                <button
                  type="button"
                  onClick={() => {
                    setDropdownOpen(false);
                    toggleDevSimulatorPanel();
                  }}
                  className="text-xs font-bold text-violet-700 hover:underline flex items-center gap-1"
                >
                  <Sliders className="h-3.5 w-3.5" />
                  Inspect All Capabilities
                </button>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                  DEV ONLY
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* DEV INSPECTOR TOGGLE BUTTON */}
      <button
        type="button"
        onClick={toggleDevSimulatorPanel}
        className="hidden sm:flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 transition shadow-2xs"
        title="Inspect Global Capabilities Drawer"
      >
        <Sliders className="h-3.5 w-3.5 text-violet-600" />
        <span className="font-mono text-[11px]">{capabilities.unlockedModulesCount} Modules</span>
      </button>

      {/* DEV INSPECTOR SLIDE-OVER PANEL */}
      {devPanelOpen && (
        <>
          <div
            onClick={toggleDevSimulatorPanel}
            className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-xs transition-opacity"
          />
          <div className="fixed inset-y-0 right-0 z-[110] w-full max-w-md bg-white shadow-2xl border-l border-slate-200 p-6 flex flex-col justify-between overflow-y-auto space-y-4">
            <div className="space-y-5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-full bg-violet-100 text-violet-800 px-2.5 py-0.5 font-mono font-bold text-[10px] uppercase">
                      Dev Capability Inspector
                    </span>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 font-mono font-bold text-[10px]">
                      Pricing Ready
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    {currentMode.label}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live platform capability engine inspection and pricing plan mapping.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={toggleDevSimulatorPanel}
                  className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mode Switcher Buttons */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                {(["solo", "growing", "enterprise"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setLevel(m)}
                    className={`rounded-xl py-2 text-xs font-bold capitalize transition ${
                      level === m
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Unlocked Modules List */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-400 block">
                  Unlocked Application Modules ({capabilities.unlockedModulesCount})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {capabilities.unlockedModules.map((mod) => (
                    <span
                      key={mod}
                      className="rounded-lg bg-violet-50 text-violet-800 border border-violet-200/70 px-2.5 py-1 text-xs font-bold"
                    >
                      ✓ {mod}
                    </span>
                  ))}
                </div>
              </div>

              {/* Visible Features List */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-400 block">
                  Active Operational Features
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {capabilities.visibleFeatures.map((feat) => (
                    <li key={feat} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Feature Flags State Table */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold uppercase tracking-wide text-slate-400 block">
                  Capability Flag Matrix (Single Source of Truth)
                </span>
                <div className="rounded-xl border border-slate-200 overflow-hidden text-xs">
                  <div className="bg-slate-50 p-2 font-bold text-slate-600 border-b border-slate-200 flex justify-between">
                    <span>Capability Flag</span>
                    <span>Status</span>
                  </div>
                  <div className="divide-y divide-slate-100 max-h-[220px] overflow-y-auto">
                    {[
                      { key: "canUseWarehouse", label: "Warehouse Module Access" },
                      { key: "canUseTransfers", label: "Stock Transfer Engine" },
                      { key: "canUseMultiWarehouse", label: "Multi-Warehouse Network" },
                      { key: "canUseDockPlanning", label: "Dock Planning & Logistics" },
                      { key: "canUseQC", label: "QC Inspection & Quarantine" },
                      { key: "canUsePutaway", label: "Directed Put-away Workstation" },
                      { key: "canUseDigitalTwin", label: "2D/3D Digital Twin Canvas" },
                      { key: "canUseBins", label: "Bin & Zone Storage" },
                      { key: "canUseASN", label: "Advanced Shipping Notice (ASN)" },
                      { key: "canUseRFID", label: "RFID & Scanning Operations" },
                      { key: "canUseRobotics", label: "Warehouse Robotics Integration" },
                      { key: "canUseHeatmaps", label: "Inventory Velocity Heatmaps" },
                      { key: "canUseAdvancedPIM", label: "Advanced Omnichannel PIM" },
                      { key: "canUseAdvancedFulfillment", label: "Split Fulfillment & SLA Engine" },
                      { key: "canUseDepartments", label: "Departmental Allocation" },
                      { key: "canUseCostCenters", label: "Cost Center Budgeting" },
                      { key: "canUseApprovals", label: "Multi-Level Approvals" },
                      { key: "canUseAuditLogs", label: "Compliance & Audit Trail" },
                      { key: "canUseEnterpriseAI", label: "Executive AI Advisor" },
                    ].map((flag) => {
                      const enabled = (capabilities as any)[flag.key];
                      return (
                        <div
                          key={flag.key}
                          className="px-3 py-1.5 flex items-center justify-between text-[11px]"
                        >
                          <span className="font-medium text-slate-700">{flag.label}</span>
                          <span
                            className={`font-mono font-bold rounded px-1.5 py-0.5 ${
                              enabled
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-100 text-slate-400"
                            }`}
                          >
                            {enabled ? "ENABLED" : "HIDDEN"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Pricing Engine Readiness Banner */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 space-y-1 text-xs">
                <span className="font-extrabold text-indigo-900 block flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  SaaS Pricing Engine Foundation
                </span>
                <p className="text-slate-600 text-[11px]">
                  This simulator powers the upcoming SaaS Subscription Plans (Starter, Growth, Enterprise). Future tier upgrades will swap this provider without rewriting any page UI.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleDevSimulatorPanel}
              className="w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition"
            >
              Close Capability Inspector
            </button>
          </div>
        </>
      )}
    </div>
  );
}
