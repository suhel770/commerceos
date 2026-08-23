import { buildAllocationHints } from "./calculate";
import type {
  InventoryAlert,
  InventoryHealthRow,
  InventoryPlanRow,
  PlanningInputs,
} from "./types";

export { classifyHealth } from "./classify";

export function buildHealthRows(
  plans: InventoryPlanRow[],
): InventoryHealthRow[] {
  return plans.map((plan) => ({
    productId: plan.productId,
    sku: plan.sku,
    productName: plan.productName,
    status: plan.health,
    available: plan.available,
    reserved: plan.reserved,
    daysOfCover: plan.daysOfCover,
    reorderPoint: plan.reorderPoint,
  }));
}

export function buildAlerts(
  plans: InventoryPlanRow[],
  inputs: PlanningInputs[],
): InventoryAlert[] {
  const alerts: InventoryAlert[] = [];

  for (const plan of plans) {
    if (plan.health === "oos_risk") {
      alerts.push({
        id: `${plan.productId}:oos_risk`,
        productId: plan.productId,
        sku: plan.sku,
        productName: plan.productName,
        kind: "oos_risk",
        severity: "critical",
        message: `${plan.sku} is at stock-out risk (${plan.available} available, cover ${plan.daysOfCover ?? "n/a"} days).`,
      });
    } else if (plan.health === "low_stock") {
      alerts.push({
        id: `${plan.productId}:low_stock`,
        productId: plan.productId,
        sku: plan.sku,
        productName: plan.productName,
        kind: "low_stock",
        severity: "warning",
        message: `${plan.sku} is below reorder point (${plan.available} ≤ ${plan.reorderPoint}).`,
      });
    } else if (plan.health === "overstock") {
      alerts.push({
        id: `${plan.productId}:overstock`,
        productId: plan.productId,
        sku: plan.sku,
        productName: plan.productName,
        kind: "overstock",
        severity: "info",
        message: `${plan.sku} may be overstocked (${plan.daysOfCover} days of cover).`,
      });
    } else if (plan.health === "slow_moving") {
      alerts.push({
        id: `${plan.productId}:slow_moving`,
        productId: plan.productId,
        sku: plan.sku,
        productName: plan.productName,
        kind: "slow_moving",
        severity: "info",
        message: `${plan.sku} looks slow-moving with low recent demand.`,
      });
    }

    if (plan.plannedQty > 0) {
      alerts.push({
        id: `${plan.productId}:reorder`,
        productId: plan.productId,
        sku: plan.sku,
        productName: plan.productName,
        kind: "reorder",
        severity: plan.health === "oos_risk" ? "critical" : "warning",
        message: `Reorder suggested: ${plan.suggestedOrderQty} units from ${plan.supplierName}.`,
      });
    }
  }

  for (const input of inputs) {
    for (const hint of buildAllocationHints(input)) {
      alerts.push({
        id: `${hint.productId}:unbalanced`,
        productId: hint.productId,
        sku: hint.sku,
        productName: hint.productName,
        kind: "unbalanced",
        severity: "info",
        message: `Unbalanced stock: transfer ${hint.quantity} from ${hint.fromWarehouseId} → ${hint.toWarehouseId}.`,
      });
    }
  }

  const severityRank = { critical: 0, warning: 1, info: 2 } as const;
  return alerts.sort(
    (a, b) => severityRank[a.severity] - severityRank[b.severity],
  );
}
