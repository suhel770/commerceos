import { db } from "@/lib/db";
import { inventoryRepository } from "@/lib/inventory/repository";
import { isConsumableCatalogItem } from "@/lib/catalog/item-classification";

export interface ConsumableItem {
  id: string;
  productId?: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  available: number;
  reserved: number;
  used: number;
  incoming: number;
  damaged: number;
  reorderPoint: number;
  unitCost: number;
  status: "In Stock" | "Low Stock" | "Out of Stock" | "Reorder Needed";
  lastUsedAt?: string;
  locationId?: string;
  storageLocationName?: string;
}

export function isConsumableSku(sku = "", name = ""): boolean {
  return isConsumableCatalogItem(sku, name);
}

export class ConsumableService {
  /**
   * Live Inventory is the source of truth. Unreceived purchase lines are not stock
   * and therefore must not be visible in Product Control Center.
   */
  public static async getConsumables(options?: {
    organizationId?: string;
    workspaceId?: string;
    search?: string;
    status?: string;
  }): Promise<ConsumableItem[]> {
    const orgId = options?.organizationId || "org-commerceos";
    const wsId = options?.workspaceId || "ws-default";

    const consumableMap = new Map<string, ConsumableItem>();

    // Purchase/receiving intent is authoritative for legacy inventory rows
    // whose SKU is a purchase line id (for example, line-24e3f3b4-2).
    const intentByKey = new Map<string, string>();
    try {
      const lines = await db.purchaseBillLine.findMany({
        where: { workspaceId: wsId },
        select: { id: true, sku: true, productId: true, intent: true, bill: { select: { purchaseType: true } } },
      });
      for (const line of lines) {
        const intent = line.intent === "sellable" && line.bill.purchaseType === "packaging_material"
          ? "consumable"
          : line.intent;
        for (const key of [line.id, line.sku, line.productId]) {
          if (key) intentByKey.set(key.toLowerCase(), intent);
        }
      }
    } catch {}

    // 1. Project available consumables from the same live Inventory balances
    // used by the Inventory page.
    let defaultLocationName = "Main Facility";
    try {
      const defaultLoc = await db.storageLocation.findFirst({
        where: { workspaceId: wsId, isDefault: true },
        select: { name: true }
      });
      if (defaultLoc) {
        defaultLocationName = defaultLoc.name;
      }
    } catch {}

    const prdIdBySku = new Map<string, string>();
    const costPriceBySku = new Map<string, number>();
    const productBySku = new Map<string, { id: string; productId: string | null; name: string; costPrice: number; category: string }>();

    try {
      const consumableProducts = await db.product.findMany({
        where: { workspaceId: wsId },
        select: { id: true, sku: true, productId: true, name: true, costPrice: true, category: true }
      });
      for (const cp of consumableProducts) {
        const cost = Number(cp.costPrice) || 0;
        const skuK = cp.sku.toLowerCase().trim();
        productBySku.set(skuK, {
          id: cp.id,
          productId: cp.productId,
          name: cp.name,
          costPrice: cost,
          category: cp.category || "Packaging Supplies",
        });
        if (cp.productId) {
          prdIdBySku.set(skuK, cp.productId);
          prdIdBySku.set(cp.name.toLowerCase().trim(), cp.productId);
        }
        if (cost > 0) {
          costPriceBySku.set(skuK, cost);
          if (cp.productId) costPriceBySku.set(cp.productId.toLowerCase().trim(), cost);
          if (cp.name) costPriceBySku.set(cp.name.toLowerCase().trim(), cost);
        }
      }
    } catch {}

    // Fallback: Latest Purchase Bill Line unitPrice for this workspace
    const billLineCostBySku = new Map<string, number>();
    try {
      const billLines = await db.purchaseBillLine.findMany({
        where: { workspaceId: wsId },
        select: { sku: true, productId: true, unitPrice: true, id: true },
        orderBy: { id: "desc" },
      });
      for (const bl of billLines) {
        const p = Number(bl.unitPrice) || 0;
        if (p > 0) {
          if (bl.sku && !billLineCostBySku.has(bl.sku.toLowerCase().trim())) {
            billLineCostBySku.set(bl.sku.toLowerCase().trim(), p);
          }
          if (bl.productId && !billLineCostBySku.has(bl.productId.toLowerCase().trim())) {
            billLineCostBySku.set(bl.productId.toLowerCase().trim(), p);
          }
        }
      }
    } catch {}

    try {
      const inventoryBalances = await inventoryRepository.listBalances({ organizationId: orgId, workspaceId: wsId });
      for (const balance of inventoryBalances) {
        const intent = intentByKey.get(balance.productId.toLowerCase()) || intentByKey.get(balance.sku.toLowerCase());
        if (balance.available <= 0 || !isConsumableCatalogItem(balance.sku, balance.productName, intent)) continue;
        const skuKey = balance.sku.toLowerCase().trim();

        // Calculate consumed qty directly from database movements of type "Consumption"
        const usageAgg = await db.inventoryMovement.aggregate({
          where: {
            workspaceId: wsId,
            sku: balance.sku,
            type: "Consumption",
          },
          _sum: { quantity: true }
        });
        const totalUsed = Math.abs(usageAgg._sum.quantity || 0);

        const stockLoc = await db.storageStock.findFirst({
          where: { workspaceId: wsId, sku: balance.sku },
          include: { storageLocation: true }
        });
        const locName = stockLoc?.storageLocation?.name || defaultLocationName;
        const locId = stockLoc?.storageLocationId || undefined;
        const pInfo = productBySku.get(skuKey);
        const prdId = prdIdBySku.get(skuKey) || pInfo?.productId || prdIdBySku.get(balance.productName?.toLowerCase().trim() || "") || undefined;

        const resolvedUnitCost = (pInfo && pInfo.costPrice > 0 ? pInfo.costPrice : 0)
          || costPriceBySku.get(skuKey)
          || billLineCostBySku.get(skuKey)
          || (stockLoc?.sku ? costPriceBySku.get(stockLoc.sku.toLowerCase().trim()) : 0)
          || (stockLoc?.sku ? billLineCostBySku.get(stockLoc.sku.toLowerCase().trim()) : 0)
          || 0;

        consumableMap.set(skuKey, {
          id: balance.id,
          productId: prdId,
          sku: balance.sku,
          name: pInfo?.name || balance.productName || balance.sku,
          category: pInfo?.category || "Packaging Supplies",
          unit: "pcs",
          available: balance.available,
          reserved: balance.reserved,
          used: totalUsed,
          incoming: balance.incoming,
          damaged: balance.damaged || 0,
          reorderPoint: 25,
          unitCost: resolvedUnitCost,
          status: balance.available > 25 ? "In Stock" : "Low Stock",
          locationId: locId,
          storageLocationName: locName,
        });
      }
    } catch {}

    // No fabricated or unreceived purchase-only items are returned.

    let result = Array.from(consumableMap.values());


    // Filter by search
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      result = result.filter(
        (c) => c.sku.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
      );
    }

    // Filter by status
    if (options?.status && options.status !== "all") {
      result = result.filter((c) => c.status.toLowerCase() === options.status?.toLowerCase());
    }

    return result.sort((a, b) => a.sku.localeCompare(b.sku));
  }
}
