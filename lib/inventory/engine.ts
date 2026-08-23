import type {
  AvailableToSellDetails,
  StockBalance,
  StockBuckets,
} from "./types";
import { pickBuckets } from "./types";

export class InventoryEngineError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "InventoryEngineError";
    this.code = code;
  }
}

function assertNonNegative(buckets: StockBuckets) {
  for (const [key, value] of Object.entries(buckets)) {
    if (typeof value === "number" && value < 0) {
      throw new InventoryEngineError(
        "NEGATIVE_STOCK",
        `Stock bucket "${key}" cannot be negative (${value}).`,
      );
    }
  }
}

function cloneBalance(balance: StockBalance): StockBalance {
  return structuredClone(balance);
}

/**
 * Authoritative Available-to-Sell (ATS / ATP) Calculation
 * In CommerceOS bucket model:
 * - available = unreserved, sellable on-hand stock
 * - reserved = stock held for pending orders
 * - allocated = stock committed to picking/packing
 * - safetyStock = safety reserve buffer
 * 
 * ATS = Max(0, Available - Allocated - Safety Stock)
 * On Hand Physical = Available + Reserved + Allocated
 */
export function calculateATS(
  balance: StockBalance,
  safetyStockOverride?: number,
): AvailableToSellDetails {
  if (balance.intent && balance.intent !== "sellable") {
    return {
      sku: balance.sku,
      productId: balance.productId,
      onHand: 0,
      reserved: 0,
      allocated: 0,
      safetyStock: 0,
      ats: 0,
      damaged: balance.damaged ?? 0,
      inTransit: balance.inTransit ?? 0,
      incoming: balance.incoming ?? 0,
    };
  }

  const available = balance.available ?? 0;
  const reserved = balance.reserved ?? 0;
  const allocated = balance.allocated ?? 0;
  const safetyStock = safetyStockOverride ?? balance.safetyStock ?? 0;
  const damaged = balance.damaged ?? 0;
  const inTransit = balance.inTransit ?? 0;
  const incoming = balance.incoming ?? 0;

  const onHand = available + reserved + allocated;
  const ats = Math.max(0, available - allocated - safetyStock);

  return {
    sku: balance.sku,
    productId: balance.productId,
    onHand,
    reserved,
    allocated,
    safetyStock,
    ats,
    damaged,
    inTransit,
    incoming,
  };
}

export function applyInbound(
  balance: StockBalance,
  quantity: number,
): { balance: StockBalance; bucketsBefore: StockBuckets; bucketsAfter: StockBuckets } {
  if (quantity <= 0) {
    throw new InventoryEngineError(
      "INVALID_QUANTITY",
      "Inbound quantity must be positive.",
    );
  }

  const bucketsBefore = pickBuckets(balance);
  const next = cloneBalance(balance);
  next.available = (next.available ?? 0) + quantity;
  next.incoming = Math.max(0, (next.incoming ?? 0) - quantity);
  next.updatedAt = new Date().toISOString();
  assertNonNegative(next);

  return {
    balance: next,
    bucketsBefore,
    bucketsAfter: pickBuckets(next),
  };
}

export function applyOutbound(
  balance: StockBalance,
  quantity: number,
): { balance: StockBalance; bucketsBefore: StockBuckets; bucketsAfter: StockBuckets } {
  if (quantity <= 0) {
    throw new InventoryEngineError(
      "INVALID_QUANTITY",
      "Outbound quantity must be positive.",
    );
  }

  if ((balance.available ?? 0) < quantity) {
    throw new InventoryEngineError(
      "INSUFFICIENT_AVAILABLE",
      `Only ${balance.available ?? 0} available to ship.`,
    );
  }

  const bucketsBefore = pickBuckets(balance);
  const next = cloneBalance(balance);
  next.available = (next.available ?? 0) - quantity;
  next.updatedAt = new Date().toISOString();
  assertNonNegative(next);

  return {
    balance: next,
    bucketsBefore,
    bucketsAfter: pickBuckets(next),
  };
}

export function applyAdjustment(
  balance: StockBalance,
  delta: number,
  bucket: keyof StockBuckets = "available",
): { balance: StockBalance; bucketsBefore: StockBuckets; bucketsAfter: StockBuckets } {
  if (delta === 0) {
    throw new InventoryEngineError(
      "INVALID_QUANTITY",
      "Adjustment delta cannot be zero.",
    );
  }

  const bucketsBefore = pickBuckets(balance);
  const next = cloneBalance(balance);
  next[bucket] = (next[bucket] ?? 0) + delta;
  next.updatedAt = new Date().toISOString();
  assertNonNegative(next);

  return {
    balance: next,
    bucketsBefore,
    bucketsAfter: pickBuckets(next),
  };
}

export function applyDamage(
  balance: StockBalance,
  quantity: number,
): { balance: StockBalance; bucketsBefore: StockBuckets; bucketsAfter: StockBuckets } {
  if (quantity <= 0) {
    throw new InventoryEngineError(
      "INVALID_QUANTITY",
      "Damage quantity must be positive.",
    );
  }

  if ((balance.available ?? 0) < quantity) {
    throw new InventoryEngineError(
      "INSUFFICIENT_AVAILABLE",
      `Only ${balance.available ?? 0} available to mark damaged.`,
    );
  }

  const bucketsBefore = pickBuckets(balance);
  const next = cloneBalance(balance);
  next.available = (next.available ?? 0) - quantity;
  next.damaged = (next.damaged ?? 0) + quantity;
  next.updatedAt = new Date().toISOString();
  assertNonNegative(next);

  return {
    balance: next,
    bucketsBefore,
    bucketsAfter: pickBuckets(next),
  };
}

/**
 * Reservation: Holds stock prior to order confirmation or allocation.
 * Shifts stock from Available -> Reserved.
 */
export function applyReserve(
  balance: StockBalance,
  quantity: number,
): { balance: StockBalance; bucketsBefore: StockBuckets; bucketsAfter: StockBuckets } {
  if (quantity <= 0) {
    throw new InventoryEngineError(
      "INVALID_QUANTITY",
      "Reserve quantity must be positive.",
    );
  }

  if ((balance.available ?? 0) < quantity) {
    throw new InventoryEngineError(
      "INSUFFICIENT_AVAILABLE",
      `Cannot reserve ${quantity} units. Only ${balance.available ?? 0} available in stock.`,
    );
  }

  const bucketsBefore = pickBuckets(balance);
  const next = cloneBalance(balance);
  next.available = (next.available ?? 0) - quantity;
  next.reserved = (next.reserved ?? 0) + quantity;
  next.updatedAt = new Date().toISOString();
  assertNonNegative(next);

  return {
    balance: next,
    bucketsBefore,
    bucketsAfter: pickBuckets(next),
  };
}

/**
 * Release: Returns previously reserved stock back to available pool.
 * Shifts stock from Reserved -> Available.
 */
export function applyRelease(
  balance: StockBalance,
  quantity: number,
): { balance: StockBalance; bucketsBefore: StockBuckets; bucketsAfter: StockBuckets } {
  if (quantity <= 0) {
    throw new InventoryEngineError(
      "INVALID_QUANTITY",
      "Release quantity must be positive.",
    );
  }

  if ((balance.reserved ?? 0) < quantity) {
    throw new InventoryEngineError(
      "INSUFFICIENT_RESERVED",
      `Only ${balance.reserved ?? 0} reserved units available to release.`,
    );
  }

  const bucketsBefore = pickBuckets(balance);
  const next = cloneBalance(balance);
  next.reserved = (next.reserved ?? 0) - quantity;
  next.available = (next.available ?? 0) + quantity;
  next.updatedAt = new Date().toISOString();
  assertNonNegative(next);

  return {
    balance: next,
    bucketsBefore,
    bucketsAfter: pickBuckets(next),
  };
}

/**
 * Allocation: Commits reserved stock to a specific order/fulfillment line before picking/packing.
 */
export function applyAllocate(
  balance: StockBalance,
  quantity: number,
  fromReserved = true,
): { balance: StockBalance; bucketsBefore: StockBuckets; bucketsAfter: StockBuckets } {
  if (quantity <= 0) {
    throw new InventoryEngineError(
      "INVALID_QUANTITY",
      "Allocation quantity must be positive.",
    );
  }

  const bucketsBefore = pickBuckets(balance);
  const next = cloneBalance(balance);

  if (fromReserved) {
    if ((next.reserved ?? 0) < quantity) {
      throw new InventoryEngineError(
        "INSUFFICIENT_RESERVED",
        `Only ${next.reserved ?? 0} reserved units available to allocate.`,
      );
    }
    next.reserved = (next.reserved ?? 0) - quantity;
  } else {
    if ((next.available ?? 0) < quantity) {
      throw new InventoryEngineError(
        "INSUFFICIENT_AVAILABLE",
        `Only ${next.available ?? 0} available for direct allocation.`,
      );
    }
    next.available = (next.available ?? 0) - quantity;
  }

  next.allocated = (next.allocated ?? 0) + quantity;
  next.updatedAt = new Date().toISOString();
  assertNonNegative(next);

  return {
    balance: next,
    bucketsBefore,
    bucketsAfter: pickBuckets(next),
  };
}

/**
 * Deallocate: Moves allocated stock back to available pool or reserved hold.
 */
export function applyDeallocate(
  balance: StockBalance,
  quantity: number,
  toReserved = false,
): { balance: StockBalance; bucketsBefore: StockBuckets; bucketsAfter: StockBuckets } {
  if (quantity <= 0) {
    throw new InventoryEngineError(
      "INVALID_QUANTITY",
      "Deallocation quantity must be positive.",
    );
  }

  if ((balance.allocated ?? 0) < quantity) {
    throw new InventoryEngineError(
      "INSUFFICIENT_ALLOCATED",
      `Only ${balance.allocated ?? 0} allocated units available to deallocate.`,
    );
  }

  const bucketsBefore = pickBuckets(balance);
  const next = cloneBalance(balance);
  next.allocated = (next.allocated ?? 0) - quantity;
  if (toReserved) {
    next.reserved = (next.reserved ?? 0) + quantity;
  } else {
    next.available = (next.available ?? 0) + quantity;
  }
  next.updatedAt = new Date().toISOString();
  assertNonNegative(next);

  return {
    balance: next,
    bucketsBefore,
    bucketsAfter: pickBuckets(next),
  };
}

/**
 * Fulfill Allocation / Final Stock Deduction:
 * Permanently decreases physical allocated stock on Order Shipped/Fulfilled.
 */
export function applyFulfillAllocation(
  balance: StockBalance,
  quantity: number,
): { balance: StockBalance; bucketsBefore: StockBuckets; bucketsAfter: StockBuckets } {
  if (quantity <= 0) {
    throw new InventoryEngineError(
      "INVALID_QUANTITY",
      "Fulfillment quantity must be positive.",
    );
  }

  if ((balance.allocated ?? 0) < quantity && (balance.available ?? 0) < quantity) {
    throw new InventoryEngineError(
      "INSUFFICIENT_STOCK",
      `Cannot fulfill ${quantity} units: Insufficient allocated (${balance.allocated ?? 0}) and available (${balance.available ?? 0}) stock.`,
    );
  }

  const bucketsBefore = pickBuckets(balance);
  const next = cloneBalance(balance);

  const deductAlloc = Math.min(next.allocated ?? 0, quantity);
  next.allocated = (next.allocated ?? 0) - deductAlloc;
  const remainingDeduct = quantity - deductAlloc;
  if (remainingDeduct > 0) {
    next.available = Math.max(0, (next.available ?? 0) - remainingDeduct);
  }
  next.updatedAt = new Date().toISOString();
  assertNonNegative(next);

  return {
    balance: next,
    bucketsBefore,
    bucketsAfter: pickBuckets(next),
  };
}

/**
 * Inter-Warehouse Transfer: Source Leg (Available -> In-Transit)
 */
export function applyTransferOut(
  balance: StockBalance,
  quantity: number,
): { balance: StockBalance; bucketsBefore: StockBuckets; bucketsAfter: StockBuckets } {
  if (quantity <= 0) {
    throw new InventoryEngineError(
      "INVALID_QUANTITY",
      "Transfer quantity must be positive.",
    );
  }

  if ((balance.available ?? 0) < quantity) {
    throw new InventoryEngineError(
      "INSUFFICIENT_AVAILABLE",
      `Cannot transfer ${quantity} units. Only ${balance.available ?? 0} available at source warehouse.`,
    );
  }

  const bucketsBefore = pickBuckets(balance);
  const next = cloneBalance(balance);
  next.available = (next.available ?? 0) - quantity;
  next.inTransit = (next.inTransit ?? 0) + quantity;
  next.updatedAt = new Date().toISOString();
  assertNonNegative(next);

  return {
    balance: next,
    bucketsBefore,
    bucketsAfter: pickBuckets(next),
  };
}

/**
 * Inter-Warehouse Transfer: Destination Leg (In-Transit -> Available)
 */
export function applyTransferIn(
  balance: StockBalance,
  quantity: number,
): { balance: StockBalance; bucketsBefore: StockBuckets; bucketsAfter: StockBuckets } {
  if (quantity <= 0) {
    throw new InventoryEngineError(
      "INVALID_QUANTITY",
      "Transfer quantity must be positive.",
    );
  }

  const bucketsBefore = pickBuckets(balance);
  const next = cloneBalance(balance);
  next.available = (next.available ?? 0) + quantity;
  next.updatedAt = new Date().toISOString();
  assertNonNegative(next);

  return {
    balance: next,
    bucketsBefore,
    bucketsAfter: pickBuckets(next),
  };
}

export function applyQuarantine(
  balance: StockBalance,
  quantity: number,
): { balance: StockBalance; bucketsBefore: StockBuckets; bucketsAfter: StockBuckets } {
  if (quantity <= 0) {
    throw new InventoryEngineError(
      "INVALID_QUANTITY",
      "Quarantine quantity must be positive.",
    );
  }

  if ((balance.available ?? 0) < quantity) {
    throw new InventoryEngineError(
      "INSUFFICIENT_AVAILABLE",
      `Only ${balance.available ?? 0} available to quarantine.`,
    );
  }

  const bucketsBefore = pickBuckets(balance);
  const next = cloneBalance(balance);
  next.available = (next.available ?? 0) - quantity;
  next.damaged = (next.damaged ?? 0) + quantity;
  next.updatedAt = new Date().toISOString();
  assertNonNegative(next);

  return {
    balance: next,
    bucketsBefore,
    bucketsAfter: pickBuckets(next),
  };
}

export function applyUnquarantine(
  balance: StockBalance,
  quantity: number,
): { balance: StockBalance; bucketsBefore: StockBuckets; bucketsAfter: StockBuckets } {
  if (quantity <= 0) {
    throw new InventoryEngineError(
      "INVALID_QUANTITY",
      "Release quarantine quantity must be positive.",
    );
  }

  if ((balance.damaged ?? 0) < quantity) {
    throw new InventoryEngineError(
      "INSUFFICIENT_QUARANTINED",
      `Only ${balance.damaged ?? 0} quarantined/damaged to release.`,
    );
  }

  const bucketsBefore = pickBuckets(balance);
  const next = cloneBalance(balance);
  next.damaged = (next.damaged ?? 0) - quantity;
  next.available = (next.available ?? 0) + quantity;
  next.updatedAt = new Date().toISOString();
  assertNonNegative(next);

  return {
    balance: next,
    bucketsBefore,
    bucketsAfter: pickBuckets(next),
  };
}

/**
 * Consumable Stock Deduction: Records item usage with auditability.
 */
export function applyConsume(
  balance: StockBalance,
  quantity: number,
): { balance: StockBalance; bucketsBefore: StockBuckets; bucketsAfter: StockBuckets } {
  if (quantity <= 0) {
    throw new InventoryEngineError(
      "INVALID_QUANTITY",
      "Consumption quantity must be positive.",
    );
  }

  if ((balance.available ?? 0) < quantity) {
    throw new InventoryEngineError(
      "INSUFFICIENT_CONSUMABLE",
      `Cannot consume ${quantity} units. Only ${balance.available ?? 0} consumable units available.`,
    );
  }

  const bucketsBefore = pickBuckets(balance);
  const next = cloneBalance(balance);
  next.available = (next.available ?? 0) - quantity;
  next.consumed = (next.consumed ?? 0) + quantity;
  next.updatedAt = new Date().toISOString();
  assertNonNegative(next);

  return {
    balance: next,
    bucketsBefore,
    bucketsAfter: pickBuckets(next),
  };
}

/**
 * Scrap / Disposal: Permanently destroys damaged items.
 */
export function applyScrap(
  balance: StockBalance,
  quantity: number,
): { balance: StockBalance; bucketsBefore: StockBuckets; bucketsAfter: StockBuckets } {
  if (quantity <= 0) {
    throw new InventoryEngineError(
      "INVALID_QUANTITY",
      "Scrap quantity must be positive.",
    );
  }

  if ((balance.damaged ?? 0) < quantity) {
    throw new InventoryEngineError(
      "INSUFFICIENT_DAMAGED",
      `Cannot scrap ${quantity} units. Only ${balance.damaged ?? 0} damaged units available to scrap.`,
    );
  }

  const bucketsBefore = pickBuckets(balance);
  const next = cloneBalance(balance);
  next.damaged = (next.damaged ?? 0) - quantity;
  next.scrapped = (next.scrapped ?? 0) + quantity;
  next.updatedAt = new Date().toISOString();
  assertNonNegative(next);

  return {
    balance: next,
    bucketsBefore,
    bucketsAfter: pickBuckets(next),
  };
}
