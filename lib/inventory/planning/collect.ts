import { products } from "@/lib/mocks/products";
import { inventoryRepository } from "@/lib/inventory/repository";
import { emptyBuckets } from "@/lib/inventory/types";
import { masterListingRepository } from "@/lib/repositories/masterListing.repository";

import type { PlanningInputs } from "./types";

const DEFAULT_LEAD_TIME = 7;
const DEFAULT_MOQ = 1;
const DEFAULT_SAFETY = 25;
const DEFAULT_REORDER = 50;

export async function collectPlanningInputs(filter?: {
  organizationId?: string;
  workspaceId?: string;
  productId?: string;
}): Promise<PlanningInputs[]> {
  const balances = await inventoryRepository.listBalances({
    organizationId: filter?.organizationId,
    workspaceId: filter?.workspaceId,
    productId: filter?.productId,
  });

  const byProduct = new Map<string, typeof balances>();
  for (const balance of balances) {
    const rows = byProduct.get(balance.productId) ?? [];
    rows.push(balance);
    byProduct.set(balance.productId, rows);
  }

  const productIds = filter?.productId
    ? [filter.productId]
    : Array.from(byProduct.keys());

  const rows: PlanningInputs[] = [];

  for (const productId of productIds) {
    const product = products.find((row) => row.id === productId);
    if (!product) continue;

    const warehouseRows = byProduct.get(productId) ?? [];
    const totals = warehouseRows.reduce(
      (acc, row) => {
        acc.available += row.available;
        acc.reserved += row.reserved;
        acc.incoming += row.incoming;
        acc.damaged += row.damaged;
        acc.inTransit += row.inTransit;
        return acc;
      },
      emptyBuckets(),
    );

    // Fall back to product.inventory when balances missing for a product.
    if (warehouseRows.length === 0) {
      totals.available = product.inventory.available;
      totals.reserved = product.inventory.reserved;
      totals.incoming = product.inventory.incoming;
      totals.damaged = product.inventory.damaged ?? 0;
      totals.inTransit = product.inventory.inTransit ?? 0;
    }

    const listing = await masterListingRepository.getById(productId);
    const orders30Days = product.listings.reduce(
      (sum, channel) => sum + channel.orders30Days,
      0,
    );
    const channelAvailable = product.listings.reduce(
      (sum, channel) => sum + channel.availableStock,
      0,
    );

    rows.push({
      productId: product.id,
      sku: product.sku,
      productName: product.name,
      costPrice: product.pricing.costPrice,
      ordersToday: product.performance.ordersToday,
      orders30Days,
      channelAvailable,
      available: totals.available,
      reserved: totals.reserved,
      incoming: totals.incoming,
      damaged: totals.damaged,
      inTransit: totals.inTransit,
      safetyStock: listing?.inventory.safetyStock ?? DEFAULT_SAFETY,
      leadTimeDays: listing?.supply?.leadTimeDays ?? DEFAULT_LEAD_TIME,
      minimumOrderQuantity:
        listing?.supply?.minimumOrderQuantity ?? DEFAULT_MOQ,
      reorderQuantity: listing?.supply?.reorderQuantity ?? DEFAULT_REORDER,
      supplierName:
        listing?.supply?.primarySupplier ??
        product.manufacturer ??
        "Primary supplier",
      warehouseBalances: warehouseRows.map((row) => ({
        warehouseId: row.warehouseId,
        available: row.available,
        reserved: row.reserved,
        incoming: row.incoming,
      })),
    });
  }

  return rows;
}
