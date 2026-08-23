/**
 * CommerceOS Inventory Engine v1 - Stock Pool Registry
 * Central single source of truth for all 12 CommerceOS stock pools.
 */

export type StockPoolType =
  | "available"
  | "incoming"
  | "reserved"
  | "allocated"
  | "consumable"
  | "quarantine"
  | "damaged"
  | "returned"
  | "blocked"
  | "in_transit"
  | "virtual"
  | "consigned";

export interface StockPoolMetadata {
  pool: StockPoolType;
  name: string;
  description: string;
  isPhysical: boolean;
  isSellable: boolean;
  countsTowardAts: boolean;
  canReserve: boolean;
  canAllocate: boolean;
  requiresWarehouse: boolean;
  badgeTone: "emerald" | "blue" | "amber" | "purple" | "rose" | "slate" | "indigo";
}

export const STOCK_POOL_REGISTRY: Record<StockPoolType, StockPoolMetadata> = {
  available: {
    pool: "available",
    name: "Available Inventory",
    description: "Unreserved stock ready to sell and fulfill customer orders.",
    isPhysical: true,
    isSellable: true,
    countsTowardAts: true,
    canReserve: true,
    canAllocate: true,
    requiresWarehouse: false,
    badgeTone: "emerald",
  },
  incoming: {
    pool: "incoming",
    name: "Incoming Stock (PO / Bill)",
    description: "Stock ordered on Purchase Bills or POs arriving at warehouse.",
    isPhysical: false,
    isSellable: false,
    countsTowardAts: false,
    canReserve: false,
    canAllocate: false,
    requiresWarehouse: false,
    badgeTone: "blue",
  },
  reserved: {
    pool: "reserved",
    name: "Reserved Inventory",
    description: "Stock locked for pending customer orders awaiting packing.",
    isPhysical: true,
    isSellable: false,
    countsTowardAts: false,
    canReserve: false,
    canAllocate: true,
    requiresWarehouse: false,
    badgeTone: "amber",
  },
  allocated: {
    pool: "allocated",
    name: "Staged / Allocated Stock",
    description: "Stock picked and staged at packing stations for shipment.",
    isPhysical: true,
    isSellable: false,
    countsTowardAts: false,
    canReserve: false,
    canAllocate: false,
    requiresWarehouse: true,
    badgeTone: "indigo",
  },
  consumable: {
    pool: "consumable",
    name: "Consumable Packaging",
    description: "Packaging boxes, tape, polybags, labels used during packing.",
    isPhysical: true,
    isSellable: false,
    countsTowardAts: false,
    canReserve: false,
    canAllocate: false,
    requiresWarehouse: false,
    badgeTone: "blue",
  },
  quarantine: {
    pool: "quarantine",
    name: "Quarantine / QC Hold",
    description: "Stock held for Quality Control inspection or defect check.",
    isPhysical: true,
    isSellable: false,
    countsTowardAts: false,
    canReserve: false,
    canAllocate: false,
    requiresWarehouse: true,
    badgeTone: "purple",
  },
  damaged: {
    pool: "damaged",
    name: "Damaged / Defective",
    description: "Unsellable broken or defective stock awaiting disposal.",
    isPhysical: true,
    isSellable: false,
    countsTowardAts: false,
    canReserve: false,
    canAllocate: false,
    requiresWarehouse: false,
    badgeTone: "rose",
  },
  returned: {
    pool: "returned",
    name: "Customer Return Bay",
    description: "Returned items undergoing inspection before restocking.",
    isPhysical: true,
    isSellable: false,
    countsTowardAts: false,
    canReserve: false,
    canAllocate: false,
    requiresWarehouse: false,
    badgeTone: "amber",
  },
  blocked: {
    pool: "blocked",
    name: "Blocked / Compliance Hold",
    description: "Stock held for legal, fraud, or compliance investigation.",
    isPhysical: true,
    isSellable: false,
    countsTowardAts: false,
    canReserve: false,
    canAllocate: false,
    requiresWarehouse: false,
    badgeTone: "rose",
  },
  in_transit: {
    pool: "in_transit",
    name: "In Transit (Warehouse Transfer)",
    description: "Stock moving between internal warehouses or 3PL facilities.",
    isPhysical: false,
    isSellable: false,
    countsTowardAts: false,
    canReserve: false,
    canAllocate: false,
    requiresWarehouse: true,
    badgeTone: "blue",
  },
  virtual: {
    pool: "virtual",
    name: "Virtual / Backorder Buffer",
    description: "Virtual stock buffer allowing pre-orders or back-orders.",
    isPhysical: false,
    isSellable: true,
    countsTowardAts: true,
    canReserve: true,
    canAllocate: false,
    requiresWarehouse: false,
    badgeTone: "slate",
  },
  consigned: {
    pool: "consigned",
    name: "Consigned / FBA Inventory",
    description: "Stock physically stored at Amazon FBA or third-party hub.",
    isPhysical: true,
    isSellable: true,
    countsTowardAts: false,
    canReserve: false,
    canAllocate: false,
    requiresWarehouse: false,
    badgeTone: "indigo",
  },
};

export function getStockPoolMetadata(pool: StockPoolType): StockPoolMetadata {
  return STOCK_POOL_REGISTRY[pool] ?? STOCK_POOL_REGISTRY.available;
}
