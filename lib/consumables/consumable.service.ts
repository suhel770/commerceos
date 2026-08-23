import { db } from "@/lib/db";
import { inventoryRepository } from "@/lib/inventory/repository";
import { isConsumableCatalogItem } from "@/lib/catalog/item-classification";

export interface ConsumableItem {
  id: string;
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

        consumableMap.set(skuKey, {
          id: balance.id,
          sku: balance.sku,
          name: balance.productName || balance.sku,
          category: "Packaging Supplies",
          unit: "pcs",
          available: balance.available,
          reserved: balance.reserved,
          used: totalUsed,
          incoming: balance.incoming,
          damaged: balance.damaged || 0,
          reorderPoint: 25,
          unitCost: 15,
          status: balance.available > 25 ? "In Stock" : "Low Stock",
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
