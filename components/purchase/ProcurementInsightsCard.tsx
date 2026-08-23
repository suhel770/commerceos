"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ChevronDown,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";

import type {
  InsightSeverity,
  ProcurementInsight,
} from "@/lib/purchase";

const COLLAPSE_KEY = "commerceos.purchase.insights.collapsed.v1";
const ENABLED_KEY = "commerceos.purchase.advisor.enabled.v1";
const REPORTS_KEY = "commerceos.purchase.advisor.reports.v2";
const MAX_REPORTS = 8;

const DOT: Record<InsightSeverity, string> = {
  ok: "bg-emerald-500",
  watch: "bg-amber-500",
  risk: "bg-rose-500",
  opportunity: "bg-orange-500",
};

const CAPABILITIES = [
  "Vendor price risk",
  "Reorder pressure",
  "Damage / stock signals",
  "Outstanding payables",
  "Alternate vendor review",
  "Purchase planning tips",
] as const;

type CachedReport = {
  id: string;
  label: string;
  createdAt: string;
  items: ProcurementInsight[];
};

type ProcurementInsightsCardProps = {
  creditsRemaining: number;
  onCreditsChange(next: number): void;
  consumeCredit(cost?: number): boolean;
  /** Fresh insights snapshot — called only when generating (credits). */
  buildInsights(): ProcurementInsight[];
  onAct(insight: ProcurementInsight): void;
  onView(insight: ProcurementInsight): void;
};

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function historyLabel(createdAt: string, index: number): string {
  const date = new Date(createdAt);
  const now = new Date();
  if (date.toDateString() === now.toDateString() && index === 0) {
    return "Today's Analysis";
  }
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays <= 7) return "Last Week";
  if (diffDays <= 31) return "Last Month";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function readEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeEnabled(enabled: boolean) {
  try {
    window.localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // ignore
  }
}

function readReports(): CachedReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CachedReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeReports(reports: CachedReport[]) {
  try {
    window.localStorage.setItem(
      REPORTS_KEY,
      JSON.stringify(reports.slice(0, MAX_REPORTS)),
    );
  } catch {
    // ignore
  }
}

function Metric({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

export default function ProcurementInsightsCard({
  creditsRemaining,
  onCreditsChange,
  consumeCredit,
  buildInsights,
  onAct,
  onView,
}: ProcurementInsightsCardProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [reports, setReports] = useState<CachedReport[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(COLLAPSE_KEY);
      if (raw === "0") setCollapsed(false);
      else setCollapsed(true);
    } catch {
      setCollapsed(true);
    }
    setEnabled(readEnabled());
    const cached = readReports();
    setReports(cached);
    if (cached[0]) setActiveId(cached[0].id);
  }, []);

  const active = useMemo(
    () => reports.find((r) => r.id === activeId) ?? reports[0] ?? null,
    [reports, activeId],
  );

  const visible = useMemo(() => {
    if (!active) return [];
    return active.items.filter((item) => !dismissed.has(item.id));
  }, [active, dismissed]);

  const alertHint = !enabled
    ? "AI is optional — enable to get procurement advice"
    : active
      ? `${active.items.length} signal${active.items.length === 1 ? "" : "s"} ready · last analysis ${relativeTime(active.createdAt)}`
      : "AI has something to say — generate procurement analysis";

  const toggle = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  };

  const enableAi = () => {
    writeEnabled(true);
    setEnabled(true);
    setBanner("AI enabled. Generate an analysis to consume 1 credit.");
  };

  const generateAnalysis = () => {
    if (!consumeCredit(1)) {
      setBanner("Not enough AI credits to generate analysis.");
      onCreditsChange(creditsRemaining);
      return;
    }
    setBusy(true);
    setBanner(null);
    const items = buildInsights();
    const report: CachedReport = {
      id: `proc-ai-${Date.now()}`,
      label: "Today's Analysis",
      createdAt: new Date().toISOString(),
      items,
    };
    const next = [report, ...reports].slice(0, MAX_REPORTS);
    writeReports(next);
    setReports(next);
    setActiveId(report.id);
    setDismissed(new Set());
    setBusy(false);
    setBanner(
      items.length === 0
        ? "Analysis complete — no signals right now. Viewing history is free."
        : "New analysis ready. Viewing reports does not use credits.",
    );
  };

  return (
    <section
      className={`overflow-hidden rounded-2xl shadow-sm ${
        collapsed
          ? "border border-amber-200 bg-gradient-to-r from-amber-50 via-violet-50 to-white"
          : "border border-violet-200/80 bg-white"
      }`}
    >
      <button
        type="button"
        onClick={toggle}
        className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition ${
          collapsed
            ? "hover:bg-amber-50/80"
            : "border-b border-violet-100 bg-violet-50/40 hover:bg-violet-50/70"
        }`}
        aria-expanded={!collapsed}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              collapsed
                ? "bg-amber-100 text-amber-700"
                : "bg-violet-100 text-violet-700"
            }`}
          >
            {collapsed ? <AlertTriangle size={16} /> : <Sparkles size={16} />}
            {collapsed ? (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-amber-50" />
            ) : null}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-slate-900">
                CommerceOS Procurement Advisor
              </p>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-800">
                AI Powered
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                Optional
              </span>
              {collapsed ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                  Needs attention
                </span>
              ) : null}
            </div>
            <p
              className={`mt-0.5 truncate text-[11px] ${
                collapsed ? "font-medium text-amber-900/80" : "text-slate-500"
              }`}
            >
              {collapsed
                ? alertHint
                : "Intelligence only — purchase workflows never depend on AI"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              AI Credits
            </p>
            <p className="text-sm font-bold tabular-nums text-violet-800">
              {creditsRemaining}
            </p>
          </div>
          <span
            className={`hidden text-xs font-semibold sm:inline ${
              collapsed ? "text-amber-800" : "text-slate-400"
            }`}
          >
            {collapsed ? "Open" : "Collapse"}
          </span>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition ${collapsed ? "" : "rotate-180"}`}
          />
        </div>
      </button>

      {!collapsed ? (
        <div className="space-y-4 px-4 py-4">
          {banner ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {banner}
            </p>
          ) : null}

          {!enabled ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5">
              <p className="text-sm font-semibold text-slate-900">
                Procurement Advisor
              </p>
              <p className="mt-1 text-sm text-slate-600">
                AI is currently disabled. CommerceOS purchase continues working
                normally.
              </p>
              <p className="mt-3 text-xs font-semibold text-slate-500">
                Enable AI to receive:
              </p>
              <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {CAPABILITIES.map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-xs text-slate-600"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={enableAi}
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800"
              >
                <Wand2 size={15} />
                Enable AI
              </button>
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <Metric
                  title="AI Credits Available"
                  value={String(creditsRemaining)}
                />
                <Metric
                  title="Last Analysis"
                  value={
                    active ? relativeTime(active.createdAt) : "Not run yet"
                  }
                />
                <Metric title="Status" value={active ? "Ready" : "Ready"} />
                <Metric
                  title="Signals"
                  value={active ? String(active.items.length) : "—"}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={busy || creditsRemaining <= 0}
                  onClick={generateAnalysis}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-violet-700 px-4 text-sm font-semibold text-white hover:bg-violet-800 disabled:opacity-50"
                >
                  <Sparkles size={15} />
                  {active ? "Generate New Analysis" : "Generate AI Analysis"}
                </button>
                <p className="text-[11px] text-slate-500">
                  Costs 1 credit · viewing history is free · never auto-buys
                </p>
              </div>

              {reports.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {reports.map((report, index) => {
                    const selected = active?.id === report.id;
                    return (
                      <button
                        key={report.id}
                        type="button"
                        onClick={() => {
                          setActiveId(report.id);
                          setBanner(null);
                        }}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition ${
                          selected
                            ? "bg-violet-100 text-violet-800"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {historyLabel(report.createdAt, index)}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {active ? (
                <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                  {visible.length === 0 ? (
                    <p className="px-4 py-6 text-center text-sm text-slate-500">
                      No signals in this report.
                    </p>
                  ) : (
                    visible.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-2">
                            <span
                              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[item.severity]}`}
                              aria-hidden
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900">
                                {item.entity}
                              </p>
                              <ul className="mt-1 space-y-0.5">
                                {item.lines.map((line) => (
                                  <li
                                    key={line}
                                    className="text-xs leading-snug text-slate-600"
                                  >
                                    {line}
                                  </li>
                                ))}
                              </ul>
                              <p className="mt-1.5 text-[11px] text-slate-400">
                                Why: {item.why}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-start">
                          <button
                            type="button"
                            onClick={() => onView(item)}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            View
                          </button>
                          {item.action ? (
                            <button
                              type="button"
                              onClick={() => onAct(item)}
                              className="rounded-lg bg-violet-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-violet-700"
                            >
                              Act
                            </button>
                          ) : null}
                          <button
                            type="button"
                            aria-label="Dismiss"
                            onClick={() =>
                              setDismissed((prev) => new Set(prev).add(item.id))
                            }
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                  <div className="flex items-center justify-between gap-2 bg-slate-50/80 px-4 py-2.5">
                    <p className="text-[11px] text-slate-500">
                      Never auto-creates purchases · you decide
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  AI is on. Generate an analysis to see vendor, reorder, and
                  stock signals.
                </p>
              )}
            </>
          )}
        </div>
      ) : null}
    </section>
  );
}
