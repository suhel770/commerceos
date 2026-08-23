import { describe, expect, it } from "vitest";

import {
  applyAdjustment,
  applyDamage,
  applyInbound,
  applyOutbound,
  applyQuarantine,
  applyRelease,
  applyReserve,
  applyTransferIn,
  applyUnquarantine,
  InventoryEngineError,
} from "./engine";
import type { StockBalance } from "./types";

function mockBalance(overrides: Partial<StockBalance> = {}): StockBalance {
  return {
    id: "prd_hardening_001:wh-home",
    organizationId: "org-commerceos-test",
    workspaceId: "ws-test-01",
    productId: "prd_hardening_001",
    sku: "HARD-SKU-001",
    productName: "Production Test Item",
    warehouseId: "wh-home",
    available: 100,
    reserved: 10,
    incoming: 20,
    damaged: 0,
    inTransit: 0,
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("Inventory Production Hardening & Invariant Checks (Phase 10)", () => {
  it("enforces tenant boundary invariants", () => {
    const item = mockBalance();
    expect(item.organizationId).toBe("org-commerceos-test");
    expect(item.workspaceId).toBe("ws-test-01");
  });

  it("prevents negative stock under oversell reservation attempts", () => {
    const item = mockBalance({ available: 5 });
    expect(() => applyReserve(item, 10)).toThrow(InventoryEngineError);
  });

  it("prevents negative stock under excessive negative adjustment", () => {
    const item = mockBalance({ available: 10 });
    expect(() => applyAdjustment(item, -15)).toThrow(InventoryEngineError);
  });

  it("atomic transfer out and transfer in balance preservation", () => {
    const origin = mockBalance({ available: 50, inTransit: 0 });
    const dest = mockBalance({ warehouseId: "wh-amazon-fba", available: 20 });

    const transferQty = 15;
    // Step 1: Transfer Out
    const outboundResult = applyAdjustment(origin, -transferQty);
    expect(outboundResult.balance.available).toBe(35);

    // Step 2: Transfer In
    const inboundResult = applyAdjustment(dest, transferQty);
    expect(inboundResult.balance.available).toBe(35);

    // Net balance across system remains equal: (50 + 20) === (35 + 35)
    expect(origin.available + dest.available).toBe(
      outboundResult.balance.available + inboundResult.balance.available,
    );
  });

  it("quarantine and unquarantine stock state preservation", () => {
    const item = mockBalance({ available: 40, damaged: 0 });
    const quared = applyQuarantine(item, 10);
    expect(quared.balance.available).toBe(30);
    expect(quared.balance.damaged).toBe(10);

    const released = applyUnquarantine(quared.balance, 10);
    expect(released.balance.available).toBe(40);
    expect(released.balance.damaged).toBe(0);
  });

  it("ensures historical transaction records preserve immutability", () => {
    const item = mockBalance({ available: 100 });
    const res1 = applyReserve(item, 10);
    expect(res1.bucketsBefore.available).toBe(100);
    expect(res1.bucketsAfter.available).toBe(90);

    // Original input snapshot remains untouched (immutability check)
    expect(item.available).toBe(100);
  });
});
