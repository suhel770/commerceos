import { isStockPathType } from "./routing";
import type { PurchaseBill, PurchaseBillLine } from "./types";

export type PurchaseStockLineOutcome = {
  purchasedQty: number;
  damagedQty: number;
  sellableQty: number;
  damageValue: number;
};

export type PurchaseStockItemKind = "inventory" | "packaging";

export type PurchaseStockSkuRow = {
  key: string;
  productId?: string;
  sku?: string;
  description: string;
  /** Dominant stock-path type for this SKU */
  itemKind: PurchaseStockItemKind;
  purchasedQty: number;
  damagedQty: number;
  sellableQty: number;
  /** Weighted average unit cost across contributing lines */
  unitCost: number;
  damageValue: number;
  purchaseSpend: number;
  lastVendorName: string;
  lastBillDate: string;
  lastBillId: string;
  lastBillNumber: string;
  lastLineId: string;
  sourceBillCount: number;
};

export type PurchaseStockSummary = {
  purchasedQty: number;
  damagedQty: number;
  sellableQty: number;
  /** Sellable qty × unit cost — ready-to-sell inventory value */
  availableStockValue: number;
  damageValue: number;
  purchaseSpend: number;
  skuCount: number;
};

export function stockLineKey(line: PurchaseBillLine): string {
  return (
    line.productId?.trim() ||
    line.sku?.trim() ||
    line.description.trim().toLowerCase()
  );
}

export function lineDamagedQty(line: PurchaseBillLine): number {
  return Math.max(0, Number(line.qtyDamaged) || 0);
}

export function lineSellableQty(line: PurchaseBillLine): number {
  return Math.max(0, line.quantity - lineDamagedQty(line));
}

export function lineDamageValue(line: PurchaseBillLine): number {
  return Number((lineDamagedQty(line) * line.unitPrice).toFixed(2));
}

export function lineStockOutcome(line: PurchaseBillLine): PurchaseStockLineOutcome {
  const damagedQty = lineDamagedQty(line);
  return {
    purchasedQty: line.quantity,
    damagedQty,
    sellableQty: Math.max(0, line.quantity - damagedQty),
    damageValue: Number((damagedQty * line.unitPrice).toFixed(2)),
  };
}

function isStockBill(bill: PurchaseBill): boolean {
  return bill.status !== "void" && isStockPathType(bill.purchaseType);
}

export function summarizePurchaseStock(bills: PurchaseBill[]): PurchaseStockSummary {
  const rows = aggregatePurchaseStockBySku(bills);
  return {
    purchasedQty: rows.reduce((sum, row) => sum + row.purchasedQty, 0),
    damagedQty: rows.reduce((sum, row) => sum + row.damagedQty, 0),
    sellableQty: rows.reduce((sum, row) => sum + row.sellableQty, 0),
    availableStockValue: Number(
      rows
        .reduce((sum, row) => sum + row.sellableQty * row.unitCost, 0)
        .toFixed(2),
    ),
    damageValue: Number(
      rows.reduce((sum, row) => sum + row.damageValue, 0).toFixed(2),
    ),
    purchaseSpend: Number(
      rows.reduce((sum, row) => sum + row.purchaseSpend, 0).toFixed(2),
    ),
    skuCount: rows.length,
  };
}

/** Aggregate stock-path bill lines by productId / SKU / description. */
export function aggregatePurchaseStockBySku(
  bills: PurchaseBill[],
): PurchaseStockSkuRow[] {
  type Acc = {
    key: string;
    productId?: string;
    sku?: string;
    description: string;
    purchasedQty: number;
    damagedQty: number;
    spend: number;
    inventoryBills: number;
    packagingBills: number;
    lastVendorName: string;
    lastBillDate: string;
    lastBillId: string;
    lastBillNumber: string;
    lastLineId: string;
    sourceBillIds: Set<string>;
  };

  const map = new Map<string, Acc>();

  const sorted = [...bills]
    .filter(isStockBill)
    .sort((a, b) => a.billDate.localeCompare(b.billDate));

  for (const bill of sorted) {
    const isPackaging = bill.purchaseType === "packaging_material";
    for (const line of bill.lines) {
      const key = stockLineKey(line);
      if (!key) continue;

      const damaged = lineDamagedQty(line);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          productId: line.productId,
          sku: line.sku,
          description: line.description,
          purchasedQty: line.quantity,
          damagedQty: damaged,
          spend: line.amount,
          inventoryBills: isPackaging ? 0 : 1,
          packagingBills: isPackaging ? 1 : 0,
          lastVendorName: bill.vendorName,
          lastBillDate: bill.billDate,
          lastBillId: bill.id,
          lastBillNumber: bill.billNumber,
          lastLineId: line.id,
          sourceBillIds: new Set([bill.id]),
        });
        continue;
      }

      existing.purchasedQty += line.quantity;
      existing.damagedQty += damaged;
      existing.spend += line.amount;
      existing.description = line.description;
      if (line.productId) existing.productId = line.productId;
      if (line.sku) existing.sku = line.sku;
      if (isPackaging) existing.packagingBills += 1;
      else existing.inventoryBills += 1;
      existing.lastVendorName = bill.vendorName;
      existing.lastBillDate = bill.billDate;
      existing.lastBillId = bill.id;
      existing.lastBillNumber = bill.billNumber;
      existing.lastLineId = line.id;
      existing.sourceBillIds.add(bill.id);
    }
  }

  return Array.from(map.values())
    .map((row) => {
      const sellableQty = Math.max(0, row.purchasedQty - row.damagedQty);
      const unitCost =
        row.purchasedQty > 0
          ? Number((row.spend / row.purchasedQty).toFixed(2))
          : 0;
      const damageValue = Number((row.damagedQty * unitCost).toFixed(2));
      const itemKind: PurchaseStockItemKind =
        row.packagingBills > row.inventoryBills ? "packaging" : "inventory";
      return {
        key: row.key,
        productId: row.productId,
        sku: row.sku,
        description: row.description,
        itemKind,
        purchasedQty: row.purchasedQty,
        damagedQty: row.damagedQty,
        sellableQty,
        unitCost,
        damageValue,
        purchaseSpend: Number(row.spend.toFixed(2)),
        lastVendorName: row.lastVendorName,
        lastBillDate: row.lastBillDate,
        lastBillId: row.lastBillId,
        lastBillNumber: row.lastBillNumber,
        lastLineId: row.lastLineId,
        sourceBillCount: row.sourceBillIds.size,
      };
    })
    .sort((a, b) => b.purchaseSpend - a.purchaseSpend);
}
