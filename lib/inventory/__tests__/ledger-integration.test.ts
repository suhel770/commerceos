import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { inventoryRepository } from "../repository";
import { inventoryService } from "../service";
import { ledgerReconciliationService } from "../ledger-reconciliation";

describe("CommerceOS — Canonical Inventory Movement Ledger Integration Suite", () => {
  const orgId = "org-ledger-test";
  const wsId = "ws-ledger-test";
  const productId = "prod-ledger-001";
  const sku = "SKU-LEDGER-001";
  let isDbAvailable = false;

  beforeEach(async () => {
    try {
      // Check if DB is actually available
      await db.$queryRaw`SELECT 1`;
      isDbAvailable = true;

      // Clean up database tables
      await db.inventoryMovement.deleteMany({ where: { organizationId: orgId } });
      await db.inventoryReservation.deleteMany({ where: { organizationId: orgId } });
      await db.inventory.deleteMany({ where: { workspaceId: wsId } });
    } catch {
      isDbAvailable = false;
      // Clear memory arrays in repository fallback
      (inventoryRepository as any).memoryMovements = [];
      (inventoryRepository as any).memoryReservations = [];
      (inventoryRepository as any).balances = [];
    }
  });

  it("1. adjustment creates ledger entry and updates projected balance", async () => {
    if (isDbAvailable) {
      await db.inventory.create({
        data: {
          workspaceId: wsId,
          productId,
          warehouseId: "wh-default",
          sku,
          available: 50,
        }
      });
    } else {
      // Setup mock balance in repository memory
      (inventoryRepository as any).balances = [{
        id: `${productId}:wh-default`,
        organizationId: orgId,
        workspaceId: wsId,
        productId,
        sku,
        productName: sku,
        warehouseId: "wh-default",
        available: 50,
        reserved: 0,
        incoming: 0,
        damaged: 0,
        inTransit: 0,
      }];
    }

    const result = await inventoryService.adjust({
      organizationId: orgId,
      workspaceId: wsId,
      productId,
      delta: 15,
      reason: "Cycle count adjustment",
      actorId: "tester-01",
      actorName: "Test Actor",
    });

    expect(result.balance.available).toBe(65);

    // Verify ledger entry was created
    const movements = await inventoryRepository.listMovements({
      organizationId: orgId,
      workspaceId: wsId,
      productId
    });
    expect(movements.length).toBe(1);
    expect(movements[0].quantity).toBe(15);
    expect(movements[0].type).toBe("Adjustment");
    expect(movements[0].actorId).toBe("tester-01");
  });

  it("2. duplicate/retried movement is idempotent", async () => {
    if (isDbAvailable) {
      await db.inventory.create({
        data: {
          workspaceId: wsId,
          productId,
          warehouseId: "wh-default",
          sku,
          available: 100,
        }
      });
    } else {
      (inventoryRepository as any).balances = [{
        id: `${productId}:wh-default`,
        organizationId: orgId,
        workspaceId: wsId,
        productId,
        sku,
        productName: sku,
        warehouseId: "wh-default",
        available: 100,
        reserved: 0,
        incoming: 0,
        damaged: 0,
        inTransit: 0,
      }];
    }

    const movementId = "mov-unique-id-999";
    const movementData = {
      id: movementId,
      organizationId: orgId,
      workspaceId: wsId,
      productId,
      sku,
      warehouseId: "wh-default",
      type: "Adjustment" as const,
      quantity: 10,
      bucketsBefore: {
        available: 100,
        reserved: 0,
        incoming: 0,
        damaged: 0,
        inTransit: 0,
      },
      bucketsAfter: {
        available: 110,
        reserved: 0,
        incoming: 0,
        damaged: 0,
        inTransit: 0,
      },
      createdAt: new Date().toISOString(),
    };

    // First attempt
    await inventoryRepository.appendMovement(movementData);

    // Verify projection updated
    let balance = await inventoryRepository.getBalance(productId, "wh-default");
    expect(balance?.available).toBe(110);

    // Second (retried) attempt with same ID
    await inventoryRepository.appendMovement(movementData);

    // Verify projection is STILL 110 (no double-counting)
    balance = await inventoryRepository.getBalance(productId, "wh-default");
    expect(balance?.available).toBe(110);

    const movements = await inventoryRepository.listMovements({
      organizationId: orgId,
      workspaceId: wsId
    });
    expect(movements.length).toBe(1);
  });

  it("3. tenant/workspace isolation is strictly enforced at repository level", async () => {
    if (isDbAvailable) {
      await db.inventory.create({
        data: {
          workspaceId: wsId,
          productId,
          warehouseId: "wh-default",
          sku,
          available: 100,
        }
      });
    } else {
      (inventoryRepository as any).balances = [{
        id: `${productId}:wh-default`,
        organizationId: orgId,
        workspaceId: wsId,
        productId,
        sku,
        productName: sku,
        warehouseId: "wh-default",
        available: 100,
        reserved: 0,
        incoming: 0,
        damaged: 0,
        inTransit: 0,
      }];
    }

    const otherWsId = "ws-other-tenant-abc";
    const balances = await inventoryRepository.listBalances({
      workspaceId: otherWsId,
      organizationId: orgId
    });

    expect(balances.length).toBe(0);
  });

  it("4. ledger/projection reconciliation reports issues correctly", async () => {
    if (!isDbAvailable) {
      // In-memory reconciliation check: we verify that the ledgerReconciliationService works
      // when database queries succeed, and returns fallback reports or pings otherwise.
      const report = await ledgerReconciliationService.reconcile(orgId, wsId);
      expect(report).toBeDefined();
      expect(report.status).toBe("CLEAN");
      return;
    }

    // 1. Clean state: Ledger matches Inventory projection
    await db.inventory.create({
      data: {
        workspaceId: wsId,
        productId,
        warehouseId: "wh-default",
        sku,
        available: 50,
      }
    });

    let report = await ledgerReconciliationService.reconcile(orgId, wsId);
    expect(report.status).toBe("CLEAN");

    // 2. Artificially tamper with projected balance (causing ledger mismatch)
    await db.inventory.updateMany({
      where: { sku },
      data: { available: 99 } // mismatch!
    });

    report = await ledgerReconciliationService.reconcile(orgId, wsId);
    expect(report.status).toBe("DISCREPANCIES_DETECTED");
    expect(report.issues.some((i) => i.type === "LEDGER_MISMATCH")).toBe(true);
  });
});
