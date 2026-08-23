/**
 * CommerceOS Inventory Engine v1 - Replenishment Engine
 * Calculates deterministic Reorder Points (ROP) & Safety Stock.
 * Formula: Reorder Point = (Daily Sales Velocity * Lead Time Days) + Safety Stock
 */

export interface ReplenishmentInput {
  sku: string;
  currentAts: number;
  dailySalesVelocity: number;
  leadTimeDays: number;
  safetyStockDays?: number;
  moq?: number; // Minimum Order Quantity
}

export interface ReplenishmentRecommendation {
  sku: string;
  currentAts: number;
  dailySalesVelocity: number;
  leadTimeDays: number;
  safetyStockUnits: number;
  reorderPoint: number;
  needsReorder: boolean;
  recommendedOrderQuantity: number;
  daysOfCoverRemaining: number;
}

export function evaluateReplenishment(input: ReplenishmentInput): ReplenishmentRecommendation {
  const velocity = Math.max(0, input.dailySalesVelocity || 0);
  const leadTime = Math.max(1, input.leadTimeDays || 7);
  const safetyDays = Math.max(0, input.safetyStockDays || 5);
  const moq = Math.max(1, input.moq || 1);

  const safetyStockUnits = Math.ceil(velocity * safetyDays);
  const reorderPoint = Math.ceil(velocity * leadTime + safetyStockUnits);

  const needsReorder = input.currentAts <= reorderPoint;
  const daysOfCoverRemaining = velocity > 0 ? Math.floor(input.currentAts / velocity) : 999;

  const rawDeficit = reorderPoint * 2 - input.currentAts;
  const recommendedOrderQuantity = needsReorder ? Math.max(moq, Math.ceil(rawDeficit / moq) * moq) : 0;

  return {
    sku: input.sku,
    currentAts: input.currentAts,
    dailySalesVelocity: velocity,
    leadTimeDays: leadTime,
    safetyStockUnits,
    reorderPoint,
    needsReorder,
    recommendedOrderQuantity,
    daysOfCoverRemaining,
  };
}
