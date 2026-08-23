import { describe, expect, it } from "vitest";

import {
  computeDaysOfCover,
  computePlannedQty,
  computeReorderPoint,
  forecastDemand,
  roundUpToMoq,
} from "./calculate";
import { classifyHealth } from "./classify";
import type { PlanningInputs } from "./types";

function input(overrides: Partial<PlanningInputs> = {}): PlanningInputs {
  return {
    productId: "prd_001",
    sku: "LW-001",
    productName: "Test",
    costPrice: 350,
    ordersToday: 2,
    orders30Days: 60,
    channelAvailable: 40,
    available: 100,
    reserved: 10,
    incoming: 20,
    damaged: 0,
    inTransit: 0,
    safetyStock: 25,
    leadTimeDays: 7,
    minimumOrderQuantity: 24,
    reorderQuantity: 48,
    supplierName: "Supplier",
    warehouseBalances: [],
    ...overrides,
  };
}

describe("inventory planning calculator", () => {
  it("computes planned qty from flowchart formula", () => {
    // 60 + 25 - 100 - 20 - 10 = -45 → 0
    expect(computePlannedQty(60, 25, 100, 20, 10)).toBe(0);
    // 60 + 25 - 30 - 0 - 5 = 50
    expect(computePlannedQty(60, 25, 30, 0, 5)).toBe(50);
  });

  it("returns zero plan when overstocked relative to demand", () => {
    expect(computePlannedQty(0, 25, 200, 0, 0)).toBe(0);
  });

  it("uses orders30Days as forecast demand proxy", () => {
    expect(forecastDemand(input({ orders30Days: 40, ordersToday: 1 }))).toBe(
      40,
    );
    expect(forecastDemand(input({ orders30Days: 0, ordersToday: 3 }))).toBe(
      90,
    );
  });

  it("subtracts reserved from planned qty per flowchart formula", () => {
    const withoutReserve = computePlannedQty(60, 25, 50, 0, 0);
    const withReserve = computePlannedQty(60, 25, 50, 0, 20);
    expect(withoutReserve).toBe(35);
    expect(withReserve).toBe(15);
    expect(withReserve).toBeLessThan(withoutReserve);
  });

  it("computes reorder point and days of cover", () => {
    expect(computeReorderPoint(60, 7, 25)).toBe(Math.ceil(2 * 7 + 25));
    expect(computeDaysOfCover(60, 60)).toBe(30);
    expect(computeDaysOfCover(10, 0)).toBeNull();
  });

  it("rounds suggestions up to MOQ", () => {
    expect(roundUpToMoq(10, 24)).toBe(24);
    expect(roundUpToMoq(25, 24)).toBe(48);
    expect(roundUpToMoq(0, 24)).toBe(0);
  });
});

describe("inventory health classifier", () => {
  it("flags oos risk when available is zero", () => {
    expect(
      classifyHealth({
        available: 0,
        reserved: 0,
        reorderPoint: 40,
        daysOfCover: 0,
        forecastDemand: 60,
        ordersToday: 5,
      }),
    ).toBe("oos_risk");
  });

  it("flags low stock at reorder point", () => {
    expect(
      classifyHealth({
        available: 40,
        reserved: 0,
        reorderPoint: 40,
        daysOfCover: 20,
        forecastDemand: 60,
        ordersToday: 5,
      }),
    ).toBe("low_stock");
  });

  it("flags overstock when cover exceeds 90 days", () => {
    expect(
      classifyHealth({
        available: 400,
        reserved: 0,
        reorderPoint: 40,
        daysOfCover: 120,
        forecastDemand: 60,
        ordersToday: 2,
      }),
    ).toBe("overstock");
  });
});
