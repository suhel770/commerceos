/**
 * CommerceOS Inventory Engine v1 - Availability Engine
 * Computes Available To Sell (ATS) dynamically instead of exposing raw database numbers.
 * Formula: ATS = Available - Reserved - SafetyBuffer + VirtualBuffer
 */

export interface SkuStockInput {
  sku: string;
  warehouseId?: string;
  availableQuantity: number;
  reservedQuantity?: number;
  safetyBufferQuantity?: number;
  virtualQuantity?: number;
}

export interface AtsResult {
  sku: string;
  warehouseId?: string;
  rawAvailable: number;
  reserved: number;
  safetyBuffer: number;
  virtualBuffer: number;
  ats: number;
  isLowStock: boolean;
  canFulfillImmediate: boolean;
}

export function calculateAvailableToSell(
  input: SkuStockInput,
  reorderPoint: number = 10,
): AtsResult {
  const rawAvailable = Math.max(0, input.availableQuantity || 0);
  const reserved = Math.max(0, input.reservedQuantity || 0);
  const safetyBuffer = Math.max(0, input.safetyBufferQuantity || 0);
  const virtualBuffer = Math.max(0, input.virtualQuantity || 0);

  const ats = Math.max(0, rawAvailable - reserved - safetyBuffer + virtualBuffer);

  return {
    sku: input.sku,
    warehouseId: input.warehouseId,
    rawAvailable,
    reserved,
    safetyBuffer,
    virtualBuffer,
    ats,
    isLowStock: ats <= reorderPoint,
    canFulfillImmediate: rawAvailable - reserved > 0,
  };
}
