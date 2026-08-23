"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  Sparkles,
  Wand2,
} from "lucide-react";
import type {
  AllocationHint,
  InventoryPlanRow,
} from "@/lib/inventory/planning/types";
import type { StockBalance } from "@/lib/inventory/types";

import {
  buildInventoryAdvisorReport,
  historyLabelFor,
  readAdvisorEnabled,
  readAdvisorReports,
  relativeTime,
  runInventorySimulation,
  writeAdvisorEnabled,
  writeAdvisorReports,
  type AiRecommendation,
  type InventoryAdvisorReport,
  type SimulationResult,
} from "./inventory-advisor-report";

const COLLAPSE_KEY = "commerceos.inventory.advisor.panel.collapsed.v2";

type Props = {
  plans: InventoryPlanRow[];
  balances: StockBalance[];
  allocationHints: AllocationHint[];
  multiWarehouse: boolean;
  marketplaceInventory: boolean;
  creditsRemaining: number;
  onCreditsChange(next: number): void;
  consumeCredit(cost?: number): boolean;
  onReviewRecommendation(rec: AiRecommendation): void;
  onApplyTransfer?(hint: AllocationHint): void;
};

const CAPABILITIES = [
  "Demand Forecasting",
  "Inventory Forecast",
  "Reorder Suggestions",
  "Dead Stock Detection",
  "Overstock Analysis",
  "Warehouse Transfer Suggestions",
  "Seasonal Demand Planning",
  "Inventory Simulation",
] as const;

function Metric({
  title,
  value,
  detail,
}: {
  title: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {title}
      </p>
      <p className="mt-1 text-sm font-bold text-slate-900">{value}</p>
      {detail ? (
        <p className="mt-0.5 text-[11px] text-slate-500">{detail}</p>
      ) : null}
    </div>
  );
}

export default function InventoryAdvisorPanel({
  plans,
  balances,
  allocationHints,
  multiWarehouse,
  marketplaceInventory,
  creditsRemaining,
  onCreditsChange,
  consumeCredit,
  onReviewRecommendation,
  onApplyTransfer,
}: Props) {
  const [collapsed, setCollapsed] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [reports, setReports] = useState<InventoryAdvisorReport[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [simQty, setSimQty] = useState("500");
  const [simMode, setSimMode] = useState<"purchase" | "sales_target">(
    "purchase",
  );
  const [simResult, setSimResult] = useState<SimulationResult | null>(null);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    // Always mount collapsed — expand only on user click.
    setCollapsed(true);
    try {
      window.localStorage.setItem(COLLAPSE_KEY, "1");
    } catch {
      // ignore
    }
    const on = readAdvisorEnabled();
    setEnabled(on);
    const cached = readAdvisorReports();
    setReports(cached);
    if (cached[0]) setActiveId(cached[0].id);
  }, []);

  const active = useMemo(
    () => reports.find((r) => r.id === activeId) ?? reports[0] ?? null,
    [reports, activeId],
  );

  const toggleCollapsed = () => {
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
    writeAdvisorEnabled(true);
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
    const report = buildInventoryAdvisorReport({
      plans,
      balances,
      allocationHints,
      multiWarehouse,
      marketplaceInventory,
      label: "Today's Analysis",
      creditCost: 1,
    });
    const next = [report, ...reports].slice(0, 8);
    writeAdvisorReports(next);
    setReports(next);
    setActiveId(report.id);
    setSimResult(null);
    setBusy(false);
    setBanner("New analysis ready. Viewing reports does not use credits.");
  };

  const runSimulation = () => {
    const qty = Number(simQty);
    if (!Number.isFinite(qty) || qty <= 0) {
      setBanner("Enter a valid quantity for simulation.");
      return;
    }
    if (!consumeCredit(1)) {
      setBanner("Not enough AI credits to run simulation.");
      return;
    }
    const result = runInventorySimulation(
      { mode: simMode, quantity: qty },
      plans,
      balances,
    );
    setSimResult(result);
    setBanner("Simulation complete (1 credit). Recommendations are advisory only.");
  };

  const collapsedContext = !enabled
    ? "AI is optional — enable to get forecast & reorder advice."
    : active
      ? `${active.recommendations.length} recommendation${active.recommendations.length === 1 ? "" : "s"} ready · last analysis ${relativeTime(active.createdAt)}.`
      : "AI is on. Generate an analysis to see forecast, recommendations, dead stock, and simulation.";

  return (
    <section
      className={`overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${
        collapsed ? "flex h-full flex-col" : "border-violet-200/80"
      }`}
    >
      <button
        type="button"
        onClick={toggleCollapsed}
        className="flex w-full items-center justify-between gap-3 border-b border-slate-100 bg-white px-4 py-3 text-left transition hover:bg-slate-50/80"
        aria-expanded={!collapsed}
      >
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
            <Sparkles size={16} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-base font-semibold text-slate-900">
                CommerceOS Inventory Advisor
              </p>
              <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-semibold text-violet-800">
                AI Powered
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                Optional
              </span>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Intelligence only — core inventory never depends on AI
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
          <span className="hidden text-xs font-semibold text-slate-400 sm:inline">
            {collapsed ? "Open" : "Collapse"}
          </span>
          <ChevronDown
            size={16}
            className={`text-slate-400 transition ${collapsed ? "" : "rotate-180"}`}
          />
        </div>
      </button>

      {collapsed ? (
        <div className="flex flex-1 items-center border-t border-slate-100 px-4 py-3">
          <p className="text-sm text-slate-500">{collapsedContext}</p>
        </div>
      ) : (
        <div className="space-y-4 px-4 py-4">
          {banner ? (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {banner}
            </p>
          ) : null}

          {!enabled ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5">
              <p className="text-sm font-semibold text-slate-900">
                Inventory Advisor
              </p>
              <p className="mt-1 text-sm text-slate-600">
                AI is currently disabled. CommerceOS inventory continues working
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
                <Metric
                  title="Status"
                  value={active ? active.status : "Ready"}
                />
                <Metric
                  title="Confidence"
                  value={active ? `${active.confidenceScore}%` : "—"}
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
                  Costs 1 credit · viewing history is free · never auto-executes
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
                        {historyLabelFor(report.createdAt, index)}
                      </button>
                    );
                  })}
                </div>
              ) : null}

              {active ? (
                <div className="space-y-5">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Inventory Forecast
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Historical sales, marketplace orders, cover, lead time &
                      seasonality signals — advisory only
                    </p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                      {[...active.forecast, ...active.forecastExtras].map(
                        (card) => (
                          <Metric
                            key={card.id}
                            title={card.title}
                            value={card.value}
                            detail={"detail" in card ? card.detail : undefined}
                          />
                        ),
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      AI Recommendations
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      What to do, why, impact if ignored, and confidence
                    </p>
                    <ul className="mt-3 space-y-3">
                      {active.recommendations.length === 0 ? (
                        <li className="text-xs text-slate-500">
                          No recommendations in this report.
                        </li>
                      ) : (
                        active.recommendations.map((rec) => (
                          <li
                            key={rec.id}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-3"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  {rec.action}{" "}
                                  <span className="text-violet-700">
                                    {rec.quantityLabel}
                                  </span>
                                </p>
                                <p className="text-xs text-slate-500">
                                  {rec.entity}
                                </p>
                              </div>
                              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                                Confidence {Math.round(rec.confidence * 100)}%
                              </span>
                            </div>
                            <dl className="mt-2 grid gap-1.5 text-[11px] text-slate-600 sm:grid-cols-2">
                              <div>
                                <dt className="font-semibold text-slate-400">
                                  Reason
                                </dt>
                                <dd>{rec.reason}</dd>
                              </div>
                              <div>
                                <dt className="font-semibold text-slate-400">
                                  Current stock
                                </dt>
                                <dd>{rec.currentStock.toLocaleString("en-IN")}</dd>
                              </div>
                              {rec.avgDailySales > 0 ? (
                                <div>
                                  <dt className="font-semibold text-slate-400">
                                    Avg daily sales
                                  </dt>
                                  <dd>{rec.avgDailySales}</dd>
                                </div>
                              ) : null}
                              {rec.leadTimeDays > 0 ? (
                                <div>
                                  <dt className="font-semibold text-slate-400">
                                    Supplier lead time
                                  </dt>
                                  <dd>{rec.leadTimeDays} days</dd>
                                </div>
                              ) : null}
                              <div>
                                <dt className="font-semibold text-slate-400">
                                  Business impact
                                </dt>
                                <dd>
                                  {rec.impactLabel}: {rec.impactValue}
                                </dd>
                              </div>
                              <div>
                                <dt className="font-semibold text-slate-400">
                                  If ignored
                                </dt>
                                <dd>{rec.ignoreRisk}</dd>
                              </div>
                            </dl>
                            <button
                              type="button"
                              onClick={() => onReviewRecommendation(rec)}
                              className="mt-2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-slate-800"
                            >
                              Review
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-slate-900">
                      Dead Stock AI
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      Detects slow / aging stock — never auto-acts
                    </p>
                    <ul className="mt-3 grid gap-2 md:grid-cols-2">
                      {active.deadStock.length === 0 ? (
                        <li className="text-xs text-slate-500">
                          No dead-stock signals in this report.
                        </li>
                      ) : (
                        active.deadStock.map((row) => (
                          <li
                            key={row.id}
                            className="rounded-xl border border-amber-100 bg-amber-50/40 px-3 py-2.5"
                          >
                            <p className="text-sm font-semibold text-slate-900">
                              {row.productName}
                            </p>
                            <p className="text-[11px] font-semibold text-amber-800">
                              {row.signal} · {row.available.toLocaleString("en-IN")}{" "}
                              units
                            </p>
                            <p className="mt-1 text-[11px] text-slate-600">
                              Suggest: {row.recommendations.join(" · ")}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              Impact: {row.impact}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              If ignored: {row.ignoreRisk}
                            </p>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-200 px-3 py-3">
                    <h3 className="text-base font-semibold text-slate-900">
                      Inventory Simulation
                    </h3>
                    <p className="mt-0.5 text-xs text-slate-500">
                      What-if purchase or sales target · costs 1 credit
                    </p>
                    <div className="mt-3 flex flex-wrap items-end gap-2">
                      <label className="text-xs font-semibold text-slate-600">
                        Mode
                        <select
                          value={simMode}
                          onChange={(e) =>
                            setSimMode(
                              e.target.value as "purchase" | "sales_target",
                            )
                          }
                          className="mt-1 block h-9 rounded-lg border border-slate-200 bg-white px-2 text-sm"
                        >
                          <option value="purchase">Purchase quantity</option>
                          <option value="sales_target">Sales target</option>
                        </select>
                      </label>
                      <label className="text-xs font-semibold text-slate-600">
                        Quantity
                        <input
                          value={simQty}
                          onChange={(e) => setSimQty(e.target.value)}
                          className="mt-1 block h-9 w-28 rounded-lg border border-slate-200 px-2 text-sm"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={runSimulation}
                        className="inline-flex h-9 items-center rounded-lg bg-violet-700 px-3 text-xs font-semibold text-white hover:bg-violet-800"
                      >
                        Run simulation
                      </button>
                    </div>
                    {simResult ? (
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        <Metric
                          title="Expected stock"
                          value={simResult.expectedStock.toLocaleString("en-IN")}
                        />
                        <Metric
                          title="Days of cover"
                          value={String(simResult.daysOfCover)}
                        />
                        <Metric
                          title="Expected revenue"
                          value={simResult.expectedRevenue}
                        />
                        <Metric
                          title="Cash locked"
                          value={simResult.cashLocked}
                        />
                        <Metric
                          title="Stockout risk"
                          value={simResult.stockoutRisk}
                        />
                        <Metric
                          title="Recommendation"
                          value={simResult.decision}
                          detail={simResult.reason}
                        />
                      </div>
                    ) : null}
                  </div>

                  {multiWarehouse ? (
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        Warehouse AI
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Transfer suggestions — review before applying
                      </p>
                      <ul className="mt-3 space-y-2">
                        {active.warehouse.length === 0 ? (
                          <li className="text-xs text-slate-500">
                            No transfer imbalance detected.
                          </li>
                        ) : (
                          active.warehouse.map((row) => (
                            <li
                              key={row.id}
                              className="flex flex-col gap-2 rounded-xl border border-slate-200 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="text-sm font-semibold text-slate-900">
                                  Move {row.quantity.toLocaleString("en-IN")} units ·{" "}
                                  {row.fromLabel} → {row.toLabel}
                                </p>
                                <p className="text-[11px] text-slate-600">
                                  {row.productName} — {row.reason}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Impact: {row.impact} · If ignored:{" "}
                                  {row.ignoreRisk}
                                </p>
                              </div>
                              {onApplyTransfer ? (
                                <button
                                  type="button"
                                  onClick={() => onApplyTransfer(row.hint)}
                                  className="shrink-0 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  Review transfer
                                </button>
                              ) : null}
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  ) : null}

                  {marketplaceInventory ? (
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">
                        Marketplace AI
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Allocation advice only — never duplicates inventory
                      </p>
                      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                        {active.marketplace.map((ch) => (
                          <div
                            key={ch.id}
                            className="rounded-xl border border-slate-200 px-3 py-2.5"
                          >
                            <p className="text-sm font-semibold text-slate-900">
                              {ch.channel}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-violet-700">
                              {ch.action}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              {ch.detail}
                            </p>
                            <p className="mt-1 text-[10px] text-slate-400">
                              Confidence {Math.round(ch.confidence * 100)}%
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  AI is on. Generate an analysis to see forecast, recommendations,
                  dead stock, and simulation.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}
