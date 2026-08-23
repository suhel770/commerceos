import type { InventoryHealthStatus } from "./types";

export function classifyHealth(input: {
  available: number;
  reserved: number;
  reorderPoint: number;
  daysOfCover: number | null;
  forecastDemand: number;
  ordersToday: number;
}): InventoryHealthStatus {
  if (input.available <= 0) return "oos_risk";

  if (
    input.daysOfCover != null &&
    input.daysOfCover < 7 &&
    input.available <= input.reorderPoint
  ) {
    return "oos_risk";
  }

  if (input.available <= input.reorderPoint) return "low_stock";

  if (
    input.forecastDemand > 0 &&
    input.daysOfCover != null &&
    input.daysOfCover > 90
  ) {
    return "overstock";
  }

  if (
    input.ordersToday === 0 &&
    input.forecastDemand < 5 &&
    input.available > 40
  ) {
    return "slow_moving";
  }

  return "ok";
}
