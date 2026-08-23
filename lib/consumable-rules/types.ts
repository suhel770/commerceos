/**
 * CommerceOS — Consumable Usage Rules Domain Types
 * ================================================
 * Defines product-level packaging and consumable usage specifications (BOM rules).
 * 
 * Invariant: Product defines the expected usage rule; Inventory owns stock and execution.
 */

export type ConsumptionMode =
  | "PER_UNIT"
  | "PER_ORDER"
  | "PER_SHIPMENT"
  | "FIXED_PER_PACK";

export interface ConsumableUsageRule {
  id: string;
  organizationId: string;
  workspaceId: string;
  productId: string;
  productSku: string;
  variantSku?: string; // Optional: variant-specific override
  consumableSku: string;
  consumableName: string;
  quantity: number; // Always positive decimal/number (e.g. 1.0, 0.15)
  unit: string; // e.g. "pcs", "boxes", "rolls", "units", "meters"
  consumptionMode: ConsumptionMode;
  notes?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateConsumableRuleInput {
  organizationId?: string;
  workspaceId?: string;
  productId: string;
  productSku: string;
  variantSku?: string;
  consumableSku: string;
  consumableName?: string;
  quantity: number;
  unit?: string;
  consumptionMode?: ConsumptionMode;
  notes?: string;
  active?: boolean;
}

export interface UpdateConsumableRuleInput {
  organizationId?: string;
  workspaceId?: string;
  quantity?: number;
  unit?: string;
  consumptionMode?: ConsumptionMode;
  notes?: string;
  active?: boolean;
}

export interface ExpectedConsumableProposal {
  ruleId: string;
  consumableSku: string;
  consumableName: string;
  unit: string;
  consumptionMode: ConsumptionMode;
  ruleQuantity: number;
  orderQuantity: number;
  calculatedQuantity: number;
  variantOverride: boolean;
  notes?: string;
}

export interface ConsumableOption {
  sku: string;
  productName: string;
  unit: string;
  availableStock?: number;
}
