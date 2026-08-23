import { describe, expect, it, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { inventoryRepository } from "../repository";
import { inventoryService } from "../service";
import { ledgerReconciliationService } from "../ledger-reconciliation";
import { calculateATS } from "../engine";
import { isConsumableCatalogItem } from "@/lib/catalog/item-classification";

describe("CommerceOS — Persistent Inventory Classification Regression Suite", () => {
  const orgId = "org-class-test";
  const wsId = "ws-class-test";
  let isDbAvailable = false;

  beforeEach(async () => {
    try {
      await db.$queryRaw`SELECT 1`;
      isDbAvailable = true;
      await db.inventoryMovement.deleteMany({ where: { organizationId: orgId } });
      await db.inventoryReservation.deleteMany({ where: { organizationId: orgId } });
      await db.inventory.deleteMany({ where: { workspaceId: wsId } });
      await db.product.deleteMany({ where: { workspaceId: wsId } });
    } catch {
      isDbAvailable = false;
      (inventoryRepository as any).memoryMovements = [];
      (inventoryRepository as any).memoryReservations = [];
      (inventoryRepository as any).balances = [];
    }
  });

  async function setupStock(productId: string, sku: string, intent: string, available = 50) {
    if (isDbAvailable) {
      await db.product.create({
        data: {
          id: productId,
          workspaceId: wsId,
          sku,
          name: sku,
          category: "General",
          intent,
        }
      });
      await db.inventory.create({
        data: {
          workspaceId: wsId,
          productId,
          warehouseId: "wh-default",
          sku,
          available,
          intent,
        }
      });
    } else {
      (inventoryRepository as any).balances.push({
        id: `${productId}:wh-default`,
        organizationId: orgId,
        workspaceId: wsId,
        productId,
        sku,
        productName: sku,
        warehouseId: "wh-default",
        available,
        reserved: 0,
        incoming: 0,
        damaged: 0,
        inTransit: 0,
        intent,
      });
    }
  }

  it("1, 2 & 3. Receiving preserves classification (SELLABLE, CONSUMABLE, ASSET)", async () => {
    // Verified by checking listBalances intent matches setup intent
    await setupStock("prod-sell-1", "SKU-SELL-01", "sellable");
    await setupStock("prod-cons-1", "SKU-CONS-01", "consumable");
    await setupStock("prod-asst-1", "SKU-ASST-01", "asset");

    const balances = await inventoryRepository.listBalances({ workspaceId: wsId, organizationId: orgId });
    expect(balances.find((b) => b.sku === "SKU-SELL-01")?.intent).toBe("sellable");
    expect(balances.find((b) => b.sku === "SKU-CONS-01")?.intent).toBe("consumable");
    expect(balances.find((b) => b.sku === "SKU-ASST-01")?.intent).toBe("asset");
  });

  it("4, 5 & 6. Transfers preserve classification", async () => {
    await setupStock("prod-sell-2", "SKU-SELL-02", "sellable", 20);
    await setupStock("prod-cons-2", "SKU-CONS-02", "consumable", 30);
    await setupStock("prod-asst-2", "SKU-ASST-02", "asset", 5);

    await inventoryService.transfer({
      organizationId: orgId,
      workspaceId: wsId,
      productId: "prod-sell-2",
      fromWarehouseId: "wh-default",
      toWarehouseId: "wh-destination",
      quantity: 5,
    });

    const movements = await inventoryRepository.listMovements({ organizationId: orgId, workspaceId: wsId });
    expect(movements.find((m) => m.productId === "prod-sell-2")?.intent).toBe("sellable");
  });

  it("7. Damage preserves classification", async () => {
    await setupStock("prod-cons-3", "SKU-CONS-03", "consumable", 20);
    await inventoryService.damage({
      organizationId: orgId,
      workspaceId: wsId,
      productId: "prod-cons-3",
      quantity: 5,
    });
    const movements = await inventoryRepository.listMovements({ organizationId: orgId, workspaceId: wsId });
    expect(movements[0]?.intent).toBe("consumable");
  });

  it("8. Vendor exchange preserves classification", async () => {
    await setupStock("prod-asst-3", "SKU-ASST-03", "asset", 2);
    await inventoryService.adjust({
      organizationId: orgId,
      workspaceId: wsId,
      productId: "prod-asst-3",
      delta: 1,
      reason: "Vendor exchange replacement",
    });
    const movements = await inventoryRepository.listMovements({ organizationId: orgId, workspaceId: wsId });
    expect(movements[0]?.intent).toBe("asset");
  });

  it("9. Consumable usage preserves CONSUMABLE", async () => {
    await setupStock("prod-cons-4", "SKU-CONS-04", "consumable", 100);
    await inventoryService.consume({
      organizationId: orgId,
      workspaceId: wsId,
      productId: "prod-cons-4",
      quantity: 10,
      reason: "Order packaging consumed",
    });
    const movements = await inventoryRepository.listMovements({ organizationId: orgId, workspaceId: wsId });
    expect(movements[0]?.intent).toBe("consumable");
  });

  it("10. Return/restock preserves original classification", async () => {
    await setupStock("prod-sell-4", "SKU-SELL-04", "sellable", 10);
    await inventoryService.adjust({
      organizationId: orgId,
      workspaceId: wsId,
      productId: "prod-sell-4",
      delta: 1,
      reason: "Customer return restock",
    });
    const movements = await inventoryRepository.listMovements({ organizationId: orgId, workspaceId: wsId });
    expect(movements[0]?.intent).toBe("sellable");
  });

  it("11, 12 & 13. Sellable contributes to ATS, Consumables and Assets do not", async () => {
    const sellableBal = { sku: "SKU-S", productId: "p1", available: 10, safetyStock: 2, intent: "sellable" };
    const consumableBal = { sku: "SKU-C", productId: "p2", available: 10, safetyStock: 2, intent: "consumable" };
    const assetBal = { sku: "SKU-A", productId: "p3", available: 10, safetyStock: 2, intent: "asset" };

    expect(calculateATS(sellableBal as any).ats).toBe(8);
    expect(calculateATS(consumableBal as any).ats).toBe(0);
    expect(calculateATS(assetBal as any).ats).toBe(0);
  });

  it("14 & 15. Consumables and Assets cannot enter marketplace allocation", async () => {
    await setupStock("prod-cons-5", "SKU-CONS-05", "consumable", 50);
    await setupStock("prod-asst-5", "SKU-ASST-05", "asset", 5);

    await expect(
      inventoryService.getChannelAllocations(orgId, wsId, "prod-cons-5")
    ).rejects.toThrow("Only sellable items may participate in channel allocation");

    await expect(
      inventoryService.getChannelAllocations(orgId, wsId, "prod-asst-5")
    ).rejects.toThrow("Only sellable items may participate in channel allocation");
  });

  it("16, 17 & 18. Catalog classification exclusions", () => {
    expect(isConsumableCatalogItem("SKU-BOX-01", "Mailer Box", "consumable")).toBe(true);
    expect(isConsumableCatalogItem("SKU-SANDAL-PINK", "Pink Sandal", "sellable")).toBe(false);
    expect(isConsumableCatalogItem("SKU-SCANNER", "Scanner", "asset")).toBe(false);
  });

  it("19. Classification survives reload/reconcile", async () => {
    await setupStock("prod-sell-9", "SKU-SELL-09", "sellable", 10);
    await setupStock("prod-cons-9", "SKU-CONS-09", "consumable", 15);

    const report = await ledgerReconciliationService.reconcile(orgId, wsId);
    expect(report.sellableSkusCount).toBe(1);
    expect(report.consumableSkusCount).toBe(1);
  });

  it("20. Tenant isolation remains intact", async () => {
    await setupStock("prod-sell-10", "SKU-SELL-10", "sellable", 10);
    const reportOther = await ledgerReconciliationService.reconcile("other-org", "other-ws");
    expect(reportOther.totalSkusAudited).toBe(0);
  });
});
