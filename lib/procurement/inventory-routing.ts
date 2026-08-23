/**
 * CommerceOS Procurement Engine v3.5 - Inventory Routing Engine
 * Decoupled event routing layer mapping purchase items to target inventory pools.
 * Purchase NEVER updates inventory directly — it routes events.
 */

import type { BusinessIntent } from "../purchase/types";

export type InventoryPoolType =
  | "sellable_inventory"
  | "consumable_inventory"
  | "quarantine_inventory"
  | "returned_inventory"
  | "damaged_inventory"
  | "asset_register"
  | "finance_expense"
  | "landed_cost_allocation";

export interface InventoryRoutingResult {
  intent: BusinessIntent;
  targetPool: InventoryPoolType;
  poolLabel: string;
  isStockBearing: boolean;
  description: string;
}

export function routePurchaseItemToInventoryPool(
  intent: BusinessIntent,
  freightMode?: "expense" | "landed_cost",
): InventoryRoutingResult {
  switch (intent) {
    case "sellable":
      return {
        intent,
        targetPool: "sellable_inventory",
        poolLabel: "Sellable Inventory Pool",
        isStockBearing: true,
        description: "Routes to live available inventory for customer order fulfillment.",
      };
    case "consumable":
      return {
        intent,
        targetPool: "consumable_inventory",
        poolLabel: "Consumables Inventory Pool",
        isStockBearing: true,
        description: "Routes to packaging & supplies inventory for order packing.",
      };
    case "asset":
      return {
        intent,
        targetPool: "asset_register",
        poolLabel: "Fixed Asset Register",
        isStockBearing: false,
        description: "Routes to capital asset register — does not affect sellable stock.",
      };
    case "freight":
      if (freightMode === "landed_cost") {
        return {
          intent,
          targetPool: "landed_cost_allocation",
          poolLabel: "Landed Cost Allocation",
          isStockBearing: false,
          description: "Allocates shipping cost into sellable product unit costs.",
        };
      }
      return {
        intent,
        targetPool: "finance_expense",
        poolLabel: "Finance Expense Ledger",
        isStockBearing: false,
        description: "Routes directly to transport expense account.",
      };
    case "expense":
    case "service":
    case "marketing":
    case "other":
    default:
      return {
        intent,
        targetPool: "finance_expense",
        poolLabel: "Finance Expense Ledger",
        isStockBearing: false,
        description: "Routes directly to operational expense ledger.",
      };
  }
}
