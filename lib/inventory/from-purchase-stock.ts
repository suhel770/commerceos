import { aggregatePurchaseStockBySku } from "@/lib/purchase/stock-data";
import type { PurchaseBill } from "@/lib/purchase/types";

import {
  DEFAULT_WAREHOUSE_ID,
  type StockBalance,
} from "./types";

const DEFAULT_ORG = "org-commerceos";
const DEFAULT_WS = "ws-default";

/**
 * Read projection: Inventory table shows Purchase Stocks sellable
 * SKUs only (sellableQty > 0 and itemKind === 'inventory'). Does not mutate purchase bills and does
 * not write back from Inventory → Purchase.
 */
export function buildSellableBalancesFromPurchaseBills(
  bills: PurchaseBill[],
  options?: {
    organizationId?: string;
    workspaceId?: string;
    now?: string;
  },
): StockBalance[] {
  const organizationId = options?.organizationId ?? DEFAULT_ORG;
  const workspaceId = options?.workspaceId ?? DEFAULT_WS;
  const now = options?.now ?? new Date().toISOString();

  return aggregatePurchaseStockBySku(bills)
    .filter((row) => row.sellableQty > 0 && row.itemKind !== "packaging")
    .map((row) => {
      const productId = row.productId?.trim() || `purchase-sku:${row.key}`;
      const sku = row.sku?.trim() || row.key;
      return {
        id: `${productId}:${DEFAULT_WAREHOUSE_ID}`,
        organizationId,
        workspaceId,
        productId,
        sku,
        productName: row.description,
        warehouseId: DEFAULT_WAREHOUSE_ID,
        available: row.sellableQty,
        reserved: 0,
        incoming: 0,
        damaged: row.damagedQty,
        inTransit: 0,
        updatedAt: now,
      } satisfies StockBalance;
    });
}

export function loadSellableBalancesFromPurchase(
  billsOrOptions?: PurchaseBill[] | { organizationId?: string; workspaceId?: string },
  maybeOptions?: { organizationId?: string; workspaceId?: string },
): StockBalance[] {
  const bills: PurchaseBill[] = Array.isArray(billsOrOptions) ? billsOrOptions : [];
  const options = Array.isArray(billsOrOptions) ? maybeOptions : billsOrOptions;
  const organizationId = options?.organizationId ?? DEFAULT_ORG;
  const workspaceId = options?.workspaceId ?? DEFAULT_WS;

  return buildSellableBalancesFromPurchaseBills(bills, {
    organizationId,
    workspaceId,
  });
}


