import { inventoryRepository } from "@/lib/inventory/repository";

import {
  buildAllocationHints,
  buildPlanRow,
  buildPurchaseSuggestion,
} from "./calculate";
import { collectPlanningInputs } from "./collect";
import { buildAlerts, buildHealthRows } from "./health";
import { purchaseSuggestionStore } from "./suggestions";
import type {
  InventoryInsights,
  InventoryPlanRow,
  PurchaseSuggestion,
} from "./types";

export async function buildPlanningBundle(filter?: {
  organizationId?: string;
  workspaceId?: string;
  productId?: string;
}) {
  const inputs = await collectPlanningInputs(filter);
  const plans = inputs.map(buildPlanRow);
  const draftSuggestions = plans
    .map(buildPurchaseSuggestion)
    .filter((row): row is PurchaseSuggestion => Boolean(row));
  const allocationHints = inputs.flatMap(buildAllocationHints);
  const savedSuggestions = await purchaseSuggestionStore.list({
    productId: filter?.productId,
  });

  return {
    inputs,
    plans,
    suggestions: draftSuggestions,
    savedSuggestions,
    allocationHints,
  };
}

export async function buildHealthBundle(filter?: {
  organizationId?: string;
  workspaceId?: string;
  productId?: string;
}) {
  const { inputs, plans } = await buildPlanningBundle(filter);
  return {
    rows: buildHealthRows(plans),
    alerts: buildAlerts(plans, inputs),
  };
}

export async function buildInsightsBundle(filter?: {
  organizationId?: string;
  workspaceId?: string;
}): Promise<InventoryInsights> {
  const { inputs, plans } = await buildPlanningBundle(filter);
  const alerts = buildAlerts(plans, inputs);
  const movements = await inventoryRepository.listMovements({
    organizationId: filter?.organizationId,
    workspaceId: filter?.workspaceId,
    limit: 500,
  });

  const stockOutRiskCount = plans.filter((p) => p.health === "oos_risk").length;
  const lowStockCount = plans.filter((p) => p.health === "low_stock").length;
  const overstockCount = plans.filter((p) => p.health === "overstock").length;
  const inStock = plans.filter((p) => p.available > 0).length;
  const fillRateProxy =
    plans.length === 0 ? 100 : Math.round((inStock / plans.length) * 100);

  let excessUnits = 0;
  let excessValue = 0;
  for (const plan of plans) {
    if (plan.health !== "overstock") continue;
    const daily = plan.forecastDemand / 30;
    const target = Math.ceil(daily * 60 + plan.safetyStock);
    const excess = Math.max(0, plan.available - target);
    excessUnits += excess;
    excessValue += excess * plan.unitCost;
  }

  return {
    skuCount: plans.length,
    stockOutRiskCount,
    lowStockCount,
    overstockCount,
    fillRateProxy,
    excessUnits,
    excessValue,
    movementCount: movements.length,
    topRisks: alerts.filter((a) => a.severity !== "info").slice(0, 8),
  };
}

export function summarizePlanForProduct(
  plans: InventoryPlanRow[],
  productId: string,
) {
  return plans.find((plan) => plan.productId === productId) ?? null;
}
