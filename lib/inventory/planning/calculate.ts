import { classifyHealth } from "./classify";
import type {
  AllocationHint,
  InventoryPlanRow,
  PlanningInputs,
  PurchaseSuggestion,
} from "./types";

/** Rule-based 30-day demand proxy (no AI). */
export function forecastDemand(input: PlanningInputs): number {
  if (input.orders30Days > 0) return input.orders30Days;
  // Scale today's velocity to a rough 30-day view when listings lack history.
  return input.ordersToday * 30;
}

/**
 * Chart stage 3:
 * plannedQty = max(0, forecastDemand + safetyStock - available - incoming - reserved)
 */
export function computePlannedQty(
  forecast: number,
  safetyStock: number,
  available: number,
  incoming: number,
  reserved: number,
): number {
  return Math.max(
    0,
    Math.ceil(forecast + safetyStock - available - incoming - reserved),
  );
}

export function computeReorderPoint(
  forecast: number,
  leadTimeDays: number,
  safetyStock: number,
): number {
  const daily = forecast / 30;
  return Math.ceil(daily * leadTimeDays + safetyStock);
}

export function computeDaysOfCover(
  available: number,
  forecast: number,
): number | null {
  if (forecast <= 0) return null;
  const daily = forecast / 30;
  if (daily <= 0) return null;
  return Math.round((available / daily) * 10) / 10;
}

export function roundUpToMoq(qty: number, moq: number): number {
  if (qty <= 0) return 0;
  const step = Math.max(1, moq);
  return Math.ceil(qty / step) * step;
}

function addDays(isoDate: Date, days: number): string {
  const next = new Date(isoDate);
  next.setUTCDate(next.getUTCDate() + days);
  return next.toISOString().slice(0, 10);
}

export function buildPlanRow(input: PlanningInputs): InventoryPlanRow {
  const forecast = forecastDemand(input);
  const plannedQty = computePlannedQty(
    forecast,
    input.safetyStock,
    input.available,
    input.incoming,
    input.reserved,
  );
  const reorderPoint = computeReorderPoint(
    forecast,
    input.leadTimeDays,
    input.safetyStock,
  );
  const daysOfCover = computeDaysOfCover(input.available, forecast);
  const suggestedOrderQty = roundUpToMoq(
    Math.max(plannedQty, plannedQty > 0 ? input.reorderQuantity : 0),
    input.minimumOrderQuantity,
  );
  const now = new Date();
  const health = classifyHealth({
    available: input.available,
    reserved: input.reserved,
    reorderPoint,
    daysOfCover,
    forecastDemand: forecast,
    ordersToday: input.ordersToday,
  });

  return {
    productId: input.productId,
    sku: input.sku,
    productName: input.productName,
    forecastDemand: forecast,
    safetyStock: input.safetyStock,
    available: input.available,
    incoming: input.incoming,
    reserved: input.reserved,
    plannedQty,
    reorderPoint,
    daysOfCover,
    leadTimeDays: input.leadTimeDays,
    orderByDate: addDays(now, Math.max(0, input.leadTimeDays - 2)),
    supplierName: input.supplierName,
    minimumOrderQuantity: input.minimumOrderQuantity,
    suggestedOrderQty,
    unitCost: input.costPrice,
    expectedDeliveryDate: addDays(now, input.leadTimeDays),
    health,
  };
}

export function buildPurchaseSuggestion(
  plan: InventoryPlanRow,
): PurchaseSuggestion | null {
  if (plan.suggestedOrderQty <= 0) return null;

  return {
    id: crypto.randomUUID(),
    productId: plan.productId,
    sku: plan.sku,
    productName: plan.productName,
    supplierName: plan.supplierName,
    quantity: plan.suggestedOrderQty,
    unitCost: plan.unitCost,
    leadTimeDays: plan.leadTimeDays,
    expectedDeliveryDate: plan.expectedDeliveryDate,
    status: "draft",
    createdAt: new Date().toISOString(),
  };
}

export function buildAllocationHints(
  input: PlanningInputs,
): AllocationHint[] {
  if (input.warehouseBalances.length < 2) return [];

  const sorted = [...input.warehouseBalances].sort(
    (a, b) => b.available - a.available,
  );
  const richest = sorted[0];
  const poorest = sorted[sorted.length - 1];
  if (!richest || !poorest) return [];

  const gap = richest.available - poorest.available;
  if (gap < 10) return [];

  const quantity = Math.floor(gap / 2);
  if (quantity <= 0) return [];

  return [
    {
      productId: input.productId,
      sku: input.sku,
      productName: input.productName,
      fromWarehouseId: richest.warehouseId,
      toWarehouseId: poorest.warehouseId,
      quantity,
      reason: "Balance stock across warehouses for demand coverage",
    },
  ];
}
