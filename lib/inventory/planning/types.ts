export type InventoryHealthStatus =
  | "ok"
  | "low_stock"
  | "oos_risk"
  | "overstock"
  | "slow_moving";

export type InventoryAlertKind =
  | "low_stock"
  | "reorder"
  | "oos_risk"
  | "overstock"
  | "slow_moving"
  | "unbalanced";

export interface PlanningInputs {
  productId: string;
  sku: string;
  productName: string;
  costPrice: number;
  ordersToday: number;
  orders30Days: number;
  channelAvailable: number;
  available: number;
  reserved: number;
  incoming: number;
  damaged: number;
  inTransit: number;
  safetyStock: number;
  leadTimeDays: number;
  minimumOrderQuantity: number;
  reorderQuantity: number;
  supplierName: string;
  warehouseBalances: Array<{
    warehouseId: string;
    available: number;
    reserved: number;
    incoming: number;
  }>;
}

export interface InventoryPlanRow {
  productId: string;
  sku: string;
  productName: string;
  forecastDemand: number;
  safetyStock: number;
  available: number;
  incoming: number;
  reserved: number;
  plannedQty: number;
  reorderPoint: number;
  daysOfCover: number | null;
  leadTimeDays: number;
  orderByDate: string;
  supplierName: string;
  minimumOrderQuantity: number;
  suggestedOrderQty: number;
  unitCost: number;
  expectedDeliveryDate: string;
  health: InventoryHealthStatus;
}

export interface PurchaseSuggestion {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  supplierName: string;
  quantity: number;
  unitCost: number;
  leadTimeDays: number;
  expectedDeliveryDate: string;
  status: "draft" | "saved";
  createdAt: string;
}

export interface AllocationHint {
  productId: string;
  sku: string;
  productName: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
  reason: string;
}

export interface InventoryAlert {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  kind: InventoryAlertKind;
  severity: "info" | "warning" | "critical";
  message: string;
}

export interface InventoryHealthRow {
  productId: string;
  sku: string;
  productName: string;
  status: InventoryHealthStatus;
  available: number;
  reserved: number;
  daysOfCover: number | null;
  reorderPoint: number;
}

export interface InventoryInsights {
  skuCount: number;
  stockOutRiskCount: number;
  lowStockCount: number;
  overstockCount: number;
  fillRateProxy: number;
  excessUnits: number;
  excessValue: number;
  movementCount: number;
  topRisks: InventoryAlert[];
}
