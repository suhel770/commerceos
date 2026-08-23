/**
 * CommerceOS Inventory Engine v1 - Inventory Policy Engine
 * Evaluates pool permissions dynamically for selling, reserving, transferring, and counting.
 */

import type { StockPoolType } from "./pool-registry";
import { getStockPoolMetadata } from "./pool-registry";

export interface PoolPolicyPermissions {
  canSell: boolean;
  canReserve: boolean;
  canPick: boolean;
  canTransfer: boolean;
  canReturn: boolean;
  canCount: boolean;
  canAdjust: boolean;
  canShip: boolean;
}

export function evaluatePoolPolicy(pool: StockPoolType): PoolPolicyPermissions {
  const metadata = getStockPoolMetadata(pool);

  return {
    canSell: metadata.isSellable,
    canReserve: metadata.canReserve,
    canPick: metadata.canAllocate,
    canTransfer: metadata.isPhysical && pool !== "consigned",
    canReturn: pool === "available" || pool === "returned" || pool === "damaged",
    canCount: metadata.isPhysical,
    canAdjust: metadata.isPhysical && pool !== "allocated",
    canShip: pool === "allocated" || pool === "reserved",
  };
}
