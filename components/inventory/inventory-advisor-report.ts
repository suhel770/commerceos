/**
 * Optional AI advisor report builders.
 * Deterministic planning inputs → advisory outputs. Never mutates stock.
 * Generating a report is credit-gated in the UI; viewing cache is free.
 */

import type {
  AllocationHint,
  InventoryPlanRow,
} from "@/lib/inventory/planning/types";
import type { StockBalance } from "@/lib/inventory/types";

import {
  buildInventoryAdvisorInsights,
  buildInventoryForecastCards,
  buildMarketplaceInventoryStrip,
  type AdvisorSeverity,
  type InventoryAdvisorInsight,
  type InventoryForecastCard,
  type MarketplaceChannelHealth,
} from "./inventory-command";
import { formatMoney, unitPrice, warehouseLabel } from "./inventory-ops";

export type InventoryAdvisorReportMeta = {
  id: string;
  label: string;
  createdAt: string;
  creditCost: number;
};

export type AiRecommendation = {
  id: string;
  action: string;
  quantityLabel: string;
  entity: string;
  reason: string;
  currentStock: number;
  avgDailySales: number;
  leadTimeDays: number;
  pendingOrders: number;
  confidence: number;
  impactLabel: string;
  impactValue: string;
  ignoreRisk: string;
  kind: "reorder" | "transfer" | "stop_buy" | "clearance" | "promote";
  productId?: string;
  hint?: AllocationHint;
};

export type DeadStockAdvice = {
  id: string;
  productId: string;
  productName: string;
  signal: "No Sales" | "Slow Movement" | "Overstock" | "Aging Inventory";
  available: number;
  daysOfCover: number | null;
  recommendations: string[];
  impact: string;
  confidence: number;
  ignoreRisk: string;
};

export type WarehouseAiAdvice = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  fromLabel: string;
  toLabel: string;
  reason: string;
  impact: string;
  confidence: number;
  ignoreRisk: string;
  hint: AllocationHint;
};

export type MarketplaceAiAdvice = {
  id: string;
  channel: string;
  action: "Increase Inventory" | "Maintain" | "Reduce Allocation" | "Healthy";
  detail: string;
  confidence: number;
};

export type SimulationInput = {
  mode: "purchase" | "sales_target";
  quantity: number;
  productId?: string;
};

export type SimulationResult = {
  expectedStock: number;
  daysOfCover: number;
  expectedRevenue: string;
  cashLocked: string;
  stockoutRisk: "Low" | "Medium" | "High";
  decision: "Recommended" | "Caution" | "Not recommended";
  reason: string;
};

export type InventoryAdvisorReport = InventoryAdvisorReportMeta & {
  status: "Ready" | "Stale";
  confidenceScore: number;
  forecast: InventoryForecastCard[];
  forecastExtras: Array<{
    id: string;
    title: string;
    value: string;
    detail: string;
  }>;
  recommendations: AiRecommendation[];
  deadStock: DeadStockAdvice[];
  warehouse: WarehouseAiAdvice[];
  marketplace: MarketplaceAiAdvice[];
  insights: InventoryAdvisorInsight[];
};

const REPORTS_KEY = "commerceos.inventory.ai.reports.v2";
const ENABLED_KEY = "commerceos.inventory.ai.enabled.v1";
const MAX_REPORTS = 8;

function moneyImpact(units: number, productId: string) {
  const price = unitPrice(productId) || 499;
  return formatMoney(units * price);
}

export function buildInventoryAdvisorReport(input: {
  plans: InventoryPlanRow[];
  balances: StockBalance[];
  allocationHints: AllocationHint[];
  multiWarehouse: boolean;
  marketplaceInventory: boolean;
  label?: string;
  creditCost?: number;
}): InventoryAdvisorReport {
  const now = new Date();
  const forecast = buildInventoryForecastCards(input.plans);
  const insights = buildInventoryAdvisorInsights({
    plans: input.plans,
    allocationHints: input.allocationHints,
  });

  const under7 = input.plans.filter(
    (p) => p.daysOfCover != null && p.daysOfCover <= 7,
  ).length;
  const rising = input.plans.filter(
    (p) => (p.forecastDemand ?? 0) > (p.available ?? 0) * 0.5,
  ).length;
  const falling = input.plans.filter(
    (p) => p.health === "slow_moving" || p.health === "overstock",
  ).length;

  const purchaseNeed = input.plans
    .filter((p) => p.suggestedOrderQty > 0)
    .reduce((s, p) => s + p.suggestedOrderQty * (unitPrice(p.productId) || 0), 0);

  const avgConfidence =
    insights.length === 0
      ? 0.72
      : insights.reduce((s, i) => s + i.confidence, 0) / insights.length;

  const recommendations: AiRecommendation[] = [];

  for (const plan of input.plans
    .filter((p) => p.suggestedOrderQty > 0 && p.health !== "overstock")
    .slice(0, 5)) {
    const daily = Math.max(
      1,
      Math.round((plan.forecastDemand || plan.available || 1) / 30),
    );
    const pending = Math.max(
      0,
      Math.round(daily * Math.max(3, plan.leadTimeDays)),
    );
    recommendations.push({
      id: `reo-${plan.productId}`,
      action: "Reorder",
      quantityLabel: `${plan.suggestedOrderQty.toLocaleString("en-IN")} Units`,
      entity: plan.productName,
      reason: `Cover ${plan.daysOfCover ?? "—"}d with lead time ${plan.leadTimeDays}d; reorder point ${plan.reorderPoint}.`,
      currentStock: plan.available,
      avgDailySales: daily,
      leadTimeDays: plan.leadTimeDays,
      pendingOrders: pending,
      confidence: plan.health === "oos_risk" ? 0.94 : 0.86,
      impactLabel: "Estimated revenue protected",
      impactValue: moneyImpact(plan.suggestedOrderQty, plan.productId),
      ignoreRisk: "Stock-out risk and marketplace suppression if ignored.",
      kind: "reorder",
      productId: plan.productId,
    });
  }

  for (const hint of input.allocationHints.slice(0, 3)) {
    recommendations.push({
      id: `tr-${hint.productId}-${hint.toWarehouseId}`,
      action: "Transfer",
      quantityLabel: `${hint.quantity.toLocaleString("en-IN")} Units`,
      entity: hint.productName,
      reason: hint.reason,
      currentStock:
        input.balances.find((b) => b.productId === hint.productId)?.available ??
        0,
      avgDailySales: 0,
      leadTimeDays: 0,
      pendingOrders: 0,
      confidence: 0.8,
      impactLabel: "Working capital avoided",
      impactValue: moneyImpact(hint.quantity, hint.productId),
      ignoreRisk: "Demand imbalance continues across warehouses.",
      kind: "transfer",
      productId: hint.productId,
      hint,
    });
  }

  const deadStock: DeadStockAdvice[] = input.plans
    .filter(
      (p) =>
        p.health === "slow_moving" ||
        p.health === "overstock" ||
        (p.daysOfCover != null && p.daysOfCover >= 60),
    )
    .slice(0, 5)
    .map((p) => {
      const signal: DeadStockAdvice["signal"] =
        p.health === "overstock"
          ? "Overstock"
          : p.health === "slow_moving"
            ? "Slow Movement"
            : (p.daysOfCover ?? 0) >= 90
              ? "Aging Inventory"
              : "No Sales";
      return {
        id: `dead-${p.productId}`,
        productId: p.productId,
        productName: p.productName,
        signal,
        available: p.available,
        daysOfCover: p.daysOfCover,
        recommendations:
          signal === "Overstock"
            ? ["Stop Purchasing", "Marketplace Promotion", "Bundles"]
            : ["Discount", "Bundles", "Marketplace Promotion", "Stop Purchasing"],
        impact: `${moneyImpact(p.available, p.productId)} cash may stay locked`,
        confidence: 0.78,
        ignoreRisk: "Working capital stays tied in slow inventory.",
      };
    });

  const warehouse: WarehouseAiAdvice[] = input.multiWarehouse
    ? input.allocationHints.slice(0, 4).map((hint) => ({
        id: `wh-${hint.productId}-${hint.fromWarehouseId}`,
        productId: hint.productId,
        productName: hint.productName,
        quantity: hint.quantity,
        fromLabel: warehouseLabel(hint.fromWarehouseId),
        toLabel: warehouseLabel(hint.toWarehouseId),
        reason: hint.reason || "Demand imbalance detected.",
        impact: "Balances channel fulfillment without new purchase.",
        confidence: 0.81,
        ignoreRisk: "One warehouse stockouts while another overstocks.",
        hint,
      }))
    : [];

  const marketplace: MarketplaceAiAdvice[] = input.marketplaceInventory
    ? buildMarketplaceInventoryStrip(input.plans, input.balances).map(
        (ch: MarketplaceChannelHealth) => ({
          id: ch.id,
          channel: ch.channel,
          action:
            ch.status === "Out of Stock" || ch.status === "Low Stock"
              ? ("Increase Inventory" as const)
              : ch.status === "Watch"
                ? ("Reduce Allocation" as const)
                : ("Maintain" as const),
          detail: ch.detail,
          confidence: ch.status === "Healthy" ? 0.88 : 0.79,
        }),
      )
    : [];

  return {
    id: `inv-ai-${now.getTime()}`,
    label: input.label ?? "Today's Analysis",
    createdAt: now.toISOString(),
    creditCost: input.creditCost ?? 1,
    status: "Ready",
    confidenceScore: Math.round(avgConfidence * 100),
    forecast,
    forecastExtras: [
      {
        id: "purchase_value",
        title: "Recommended Purchase Value",
        value: formatMoney(purchaseNeed),
        detail: "Suggested order qty × unit price for at-risk SKUs",
      },
      {
        id: "demand_up",
        title: "Expected Demand Increase",
        value: `${rising} SKUs`,
        detail: "Forecast demand elevated vs on-hand",
      },
      {
        id: "demand_down",
        title: "Expected Demand Decrease",
        value: `${falling} SKUs`,
        detail: "Slow / overstock health signals",
      },
      {
        id: "confidence",
        title: "Confidence Score",
        value: `${Math.round(avgConfidence * 100)}%`,
        detail: "Based on cover, lead time, and health classifiers",
      },
      {
        id: "stockout_7",
        title: "Estimated Stockouts",
        value: `${under7} SKUs`,
        detail: "≤7 days of cover",
      },
    ],
    recommendations,
    deadStock,
    warehouse,
    marketplace,
    insights,
  };
}

export function runInventorySimulation(
  input: SimulationInput,
  plans: InventoryPlanRow[],
  balances: StockBalance[],
): SimulationResult {
  const plan =
    (input.productId
      ? plans.find((p) => p.productId === input.productId)
      : null) ??
    plans[0] ??
    null;
  const balance =
    (plan
      ? balances.find((b) => b.productId === plan.productId)
      : balances[0]) ?? null;
  const available = balance?.available ?? plan?.available ?? 0;
  const daily = Math.max(
    1,
    Math.round(((plan?.forecastDemand ?? 30) || 30) / 30),
  );
  const price = plan ? unitPrice(plan.productId) || 499 : 499;
  const qty = Math.max(0, Math.floor(input.quantity));

  if (input.mode === "purchase") {
    const expectedStock = available + qty;
    const daysOfCover = Math.round(expectedStock / daily);
    const cashLocked = qty * price;
    const expectedRevenue = expectedStock * price * 0.85;
    const stockoutRisk: SimulationResult["stockoutRisk"] =
      daysOfCover < 10 ? "High" : daysOfCover < 21 ? "Medium" : "Low";
    const decision: SimulationResult["decision"] =
      daysOfCover >= 21 && daysOfCover <= 55
        ? "Recommended"
        : daysOfCover < 14
          ? "Caution"
          : "Not recommended";
    return {
      expectedStock,
      daysOfCover,
      expectedRevenue: formatMoney(expectedRevenue),
      cashLocked: formatMoney(cashLocked),
      stockoutRisk,
      decision,
      reason:
        decision === "Recommended"
          ? "Cover aligns with lead time and expected demand."
          : decision === "Caution"
            ? "Cover remains thin — consider a larger purchase or faster supplier."
            : "Purchase may overstock and lock excess cash.",
    };
  }

  const unitsNeeded = qty;
  const expectedStock = Math.max(0, available - unitsNeeded);
  const daysOfCover = Math.round(expectedStock / daily);
  return {
    expectedStock,
    daysOfCover,
    expectedRevenue: formatMoney(unitsNeeded * price),
    cashLocked: formatMoney(available * price),
    stockoutRisk:
      expectedStock < daily * 7
        ? "High"
        : expectedStock < daily * 14
          ? "Medium"
          : "Low",
    decision:
      expectedStock >= daily * 14 ? "Recommended" : "Caution",
    reason:
      expectedStock >= daily * 14
        ? "Sales target is reachable without severe stock-out risk."
        : "Sales target likely depletes cover before replenishment.",
  };
}

export function readAdvisorEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(ENABLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeAdvisorEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ENABLED_KEY, enabled ? "1" : "0");
  } catch {
    // ignore
  }
}

export function readAdvisorReports(): InventoryAdvisorReport[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(REPORTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InventoryAdvisorReport[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeAdvisorReports(reports: InventoryAdvisorReport[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      REPORTS_KEY,
      JSON.stringify(reports.slice(0, MAX_REPORTS)),
    );
  } catch {
    // ignore
  }
}

export function historyLabelFor(createdAt: string, index: number): string {
  const date = new Date(createdAt);
  const now = new Date();
  const sameDay =
    date.toDateString() === now.toDateString();
  if (sameDay && index === 0) return "Today's Analysis";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (24 * 60 * 60 * 1000),
  );
  if (diffDays <= 7) return "Last Week";
  if (diffDays <= 31) return "Last Month";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
  });
}

export function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 48) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export type { AdvisorSeverity };
