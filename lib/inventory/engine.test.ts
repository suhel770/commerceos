import { describe, expect, it } from "vitest";

import {
  applyAdjustment,
  applyDamage,
  applyRelease,
  applyReserve,
  InventoryEngineError,
} from "./engine";
import type { StockBalance } from "./types";

function balance(overrides: Partial<StockBalance> = {}): StockBalance {
  return {
    id: "prd_001:wh-default",
    organizationId: "org-commerceos",
    workspaceId: "ws-default",
    productId: "prd_001",
    sku: "LW-001",
    productName: "LilWalk Dino Clogs",
    warehouseId: "wh-default",
    available: 100,
    reserved: 10,
    incoming: 20,
    damaged: 0,
    inTransit: 0,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("inventory engine", () => {
  it("reserves by moving Available to Reserved", () => {
    const result = applyReserve(balance(), 15);
    expect(result.balance.available).toBe(85);
    expect(result.balance.reserved).toBe(25);
  });

  it("rejects oversell on reserve", () => {
    expect(() => applyReserve(balance({ available: 5 }), 6)).toThrow(
      InventoryEngineError,
    );
  });

  it("releases reserved stock back to available", () => {
    const result = applyRelease(balance({ available: 80, reserved: 20 }), 8);
    expect(result.balance.available).toBe(88);
    expect(result.balance.reserved).toBe(12);
  });

  it("applies adjustment deltas", () => {
    const up = applyAdjustment(balance(), 5);
    expect(up.balance.available).toBe(105);
    const down = applyAdjustment(balance(), -5);
    expect(down.balance.available).toBe(95);
  });

  it("moves available into damaged", () => {
    const result = applyDamage(balance(), 3);
    expect(result.balance.available).toBe(97);
    expect(result.balance.damaged).toBe(3);
  });
});
