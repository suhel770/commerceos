import type { InventoryHealthRow, InventoryPlanRow } from "@/lib/inventory/planning/types";
import type { StockBalance, StockMovement } from "@/lib/inventory/types";
import { products } from "@/lib/mocks/products";

export type InventoryStockStatus =
  | "in_stock"
  | "low_stock"
  | "out_of_stock";

export type InventoryKpiKey =
  | "total_skus"
  | "total_stock"
  | "sellable"
  | "reserved"
  | "in_transit"
  | "damaged"
  | "out_of_stock"
  | "low_stock"
  | "warehouses"
  | "inventory_value";

/** Active table filter mirrors KPI cards — each key is a distinct view. */
export type InventoryTab = InventoryKpiKey;

export const INVENTORY_TABS: Array<[InventoryTab, string]> = [
  ["total_skus", "Total SKUs"],
  ["total_stock", "Total Stock"],
  ["sellable", "Sellable"],
  ["in_transit", "In Transit"],
  ["damaged", "Damaged"],
  ["out_of_stock", "Out of Stock"],
  ["low_stock", "Low Stock"],
  ["warehouses", "Warehouses"],
];

export const WAREHOUSE_LABELS: Record<string, string> = {
  "wh-default": "BLR-01 Bangalore",
  "wh-mumbai": "BOM-01 Mumbai",
};

export function warehouseLabel(id?: string) {
  if (!id) return "—";
  return WAREHOUSE_LABELS[id] ?? id;
}

export function formatQty(n: number) {
  return n.toLocaleString("en-IN");
}

export function formatMoney(amount: number) {
  return `₹${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatDateTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function productImageSrc(productId: string) {
  const product = products.find((row) => row.id === productId);
  const image = product?.image?.trim();
  return image || "/products/lw-dino.png";
}

export function unitPrice(productId: string) {
  const product = products.find((row) => row.id === productId);
  return (
    product?.listings?.[0]?.sellingPrice ??
    product?.pricing?.sellingPrice ??
    product?.pricing?.mrp ??
    0
  );
}

export function rowTotal(row: StockBalance) {
  return (
    row.available +
    row.reserved +
    row.incoming +
    row.damaged +
    row.inTransit
  );
}

/** Aggregate sellable/reserved across all WH rows for a product. */
export function productTotals(balances: StockBalance[], productId: string) {
  return balances
    .filter((row) => row.productId === productId)
    .reduce(
      (acc, row) => {
        acc.available += row.available;
        acc.reserved += row.reserved;
        acc.incoming += row.incoming;
        acc.damaged += row.damaged;
        acc.inTransit += row.inTransit;
        return acc;
      },
      { available: 0, reserved: 0, incoming: 0, damaged: 0, inTransit: 0 },
    );
}

export function stockStatusForRow(
  row: StockBalance,
  healthByProduct: Map<string, InventoryHealthRow | InventoryPlanRow>,
): InventoryStockStatus {
  return stockStatusForProduct(row.productId, row.available, healthByProduct);
}

/** Product-level status using aggregated available qty. */
export function stockStatusForProduct(
  productId: string,
  available: number,
  healthByProduct: Map<string, InventoryHealthRow | InventoryPlanRow>,
): InventoryStockStatus {
  const health = healthByProduct.get(productId);
  const healthStatus =
    health && "status" in health
      ? health.status
      : health && "health" in health
        ? health.health
        : undefined;

  if (available <= 0) return "out_of_stock";
  if (
    healthStatus === "low_stock" ||
    healthStatus === "oos_risk" ||
    (health &&
      "daysOfCover" in health &&
      health.daysOfCover != null &&
      health.daysOfCover < 7)
  ) {
    return "low_stock";
  }
  if (available > 0 && available < 20) return "low_stock";
  return "in_stock";
}

export function productAvailableMap(balances: StockBalance[]) {
  const map = new Map<string, number>();
  for (const row of balances) {
    map.set(row.productId, (map.get(row.productId) ?? 0) + row.available);
  }
  return map;
}

export function stockStatusChip(status: InventoryStockStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "out_of_stock":
      return { label: "Out of Stock", className: "bg-rose-100 text-rose-800" };
    case "low_stock":
      return { label: "Low Stock", className: "bg-amber-100 text-amber-900" };
    default:
      return { label: "In Stock", className: "bg-emerald-100 text-emerald-800" };
  }
}

export function buildHealthMap(
  healthRows: InventoryHealthRow[],
  plans: InventoryPlanRow[],
) {
  const map = new Map<string, InventoryHealthRow | InventoryPlanRow>();
  for (const plan of plans) map.set(plan.productId, plan);
  for (const row of healthRows) map.set(row.productId, row);
  return map;
}

export function matchesSearch(row: StockBalance, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    row.sku.toLowerCase().includes(q) ||
    row.productName.toLowerCase().includes(q) ||
    row.productId.toLowerCase().includes(q) ||
    row.warehouseId.toLowerCase().includes(q) ||
    warehouseLabel(row.warehouseId).toLowerCase().includes(q)
  );
}

export function matchesTab(
  row: StockBalance,
  tab: InventoryTab,
  healthByProduct: Map<string, InventoryHealthRow | InventoryPlanRow>,
  availableByProduct?: Map<string, number>,
) {
  if (tab === "total_skus" || tab === "warehouses") return true;

  if (tab === "total_stock") return rowTotal(row) > 0;
  if (tab === "sellable" || tab === "inventory_value") return row.available > 0;
  if (tab === "reserved") return row.reserved > 0;
  if (tab === "in_transit") return row.inTransit > 0;
  if (tab === "damaged") return row.damaged > 0;

  const available =
    availableByProduct?.get(row.productId) ?? row.available;
  const status = stockStatusForProduct(
    row.productId,
    available,
    healthByProduct,
  );
  if (tab === "low_stock") return status === "low_stock";
  if (tab === "out_of_stock") return status === "out_of_stock";
  return true;
}

export function computeInventoryKpis(
  balances: StockBalance[],
  healthByProduct: Map<string, InventoryHealthRow | InventoryPlanRow>,
): Record<InventoryKpiKey, number> {
  const productIds = new Set(balances.map((row) => row.productId));
  const warehouses = new Set(balances.map((row) => row.warehouseId));

  let totalStock = 0;
  let sellable = 0;
  let reserved = 0;
  let inTransit = 0;
  let damaged = 0;
  let inventoryValue = 0;
  let outOfStock = 0;
  let lowStock = 0;

  const productAgg = new Map<
    string,
    { available: number; reserved: number; inTransit: number; damaged: number; total: number }
  >();

  for (const row of balances) {
    totalStock += rowTotal(row);
    sellable += row.available;
    reserved += row.reserved;
    inTransit += row.inTransit;
    damaged += row.damaged;
    inventoryValue += row.available * unitPrice(row.productId);

    const current = productAgg.get(row.productId) ?? {
      available: 0,
      reserved: 0,
      inTransit: 0,
      damaged: 0,
      total: 0,
    };
    current.available += row.available;
    current.reserved += row.reserved;
    current.inTransit += row.inTransit;
    current.damaged += row.damaged;
    current.total += rowTotal(row);
    productAgg.set(row.productId, current);
  }

  for (const [productId, agg] of productAgg) {
    const status = stockStatusForProduct(
      productId,
      agg.available,
      healthByProduct,
    );
    if (status === "out_of_stock") outOfStock += 1;
    else if (status === "low_stock") lowStock += 1;
  }

  return {
    total_skus: productIds.size,
    total_stock: totalStock,
    sellable,
    reserved,
    in_transit: inTransit,
    damaged,
    out_of_stock: outOfStock,
    low_stock: lowStock,
    warehouses: warehouses.size,
    inventory_value: inventoryValue,
  };
}

/** Menu header badges mirror KPI card values. */
export function computeTabCounts(
  balances: StockBalance[],
  healthByProduct: Map<string, InventoryHealthRow | InventoryPlanRow>,
): Record<InventoryTab, number> {
  return computeInventoryKpis(balances, healthByProduct);
}

export function topLowStock(
  balances: StockBalance[],
  healthByProduct: Map<string, InventoryHealthRow | InventoryPlanRow>,
  limit = 5,
) {
  return balances
    .filter((row) => stockStatusForRow(row, healthByProduct) === "low_stock")
    .sort((a, b) => a.available - b.available)
    .slice(0, limit);
}

export function stockOverviewPercents(balances: StockBalance[], healthByProduct: Map<string, InventoryHealthRow | InventoryPlanRow>) {
  const counts = { in_stock: 0, low_stock: 0, out_of_stock: 0, in_transit: 0 };
  let inTransitUnits = 0;
  for (const row of balances) {
    const status = stockStatusForRow(row, healthByProduct);
    counts[status] += 1;
    inTransitUnits += row.inTransit;
  }
  const total = Math.max(balances.length, 1);
  const transitShare = Math.min(
    100,
    Math.round((inTransitUnits / Math.max(totalStockUnits(balances), 1)) * 100),
  );
  return {
    in_stock: Math.round((counts.in_stock / total) * 100),
    low_stock: Math.round((counts.low_stock / total) * 100),
    out_of_stock: Math.round((counts.out_of_stock / total) * 100),
    in_transit: transitShare,
    counts: {
      in_stock: counts.in_stock,
      low_stock: counts.low_stock,
      out_of_stock: counts.out_of_stock,
      in_transit: counts.in_transit,
    },
    totalSkus: balances.length,
  };
}

function totalStockUnits(balances: StockBalance[]) {
  return balances.reduce((sum, row) => sum + rowTotal(row), 0);
}

export function movementLabel(movement: StockMovement) {
  if (movement.type === "Transfer") {
    return `Transfer ${movement.fromWarehouseId ? warehouseLabel(movement.fromWarehouseId) : ""} → ${movement.toWarehouseId ? warehouseLabel(movement.toWarehouseId) : ""}`.trim();
  }
  return movement.type;
}
