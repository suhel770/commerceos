export const DEFAULT_WAREHOUSE_ID = "wh-default";
export const SECONDARY_WAREHOUSE_ID = "wh-mumbai";

export type ConceptualStockState =
  | "ON_HAND"
  | "AVAILABLE"
  | "RESERVED"
  | "ALLOCATED"
  | "IN_TRANSFER"
  | "QC_HOLD"
  | "DAMAGED"
  | "EXCHANGE_PENDING"
  | "RETURN_PENDING"
  | "SCRAPPED"
  | "CONSUMED"
  | "COMMITTED";

export type StockBucket =
  | "available"
  | "reserved"
  | "allocated"
  | "incoming"
  | "damaged"
  | "inTransit"
  | "consumed"
  | "scrapped"
  | "safetyStock";

export type StockMovementType =
  | "Inbound"
  | "Outbound"
  | "Adjustment"
  | "Transfer"
  | "Return"
  | "Damage"
  | "Reservation"
  | "ReservationRelease"
  | "Allocation"
  | "Deallocation"
  | "Consumption"
  | "Scrap"
  | "Quarantine"
  | "Unquarantine";

export type ReservationStatus =
  | "open"
  | "released"
  | "expired"
  | "allocated"
  | "fulfilled";

export interface StockBuckets {
  available: number;
  reserved: number;
  allocated?: number;
  incoming: number;
  damaged: number;
  inTransit: number;
  consumed?: number;
  scrapped?: number;
  safetyStock?: number;
}

export interface StockBalance extends StockBuckets {
  id: string;
  organizationId: string;
  workspaceId: string;
  productId: string;
  sku: string;
  productName: string;
  warehouseId: string; // Storage location or warehouse identifier
  storageLocationId?: string;
  receivedFromBillId?: string;
  billNumber?: string;
  intent?: string; // "sellable" | "consumable" | "asset"
  costPrice?: number;
  sellingPrice?: number;
  updatedAt?: string;
}

export interface AvailableToSellDetails {
  sku: string;
  productId: string;
  onHand: number;
  reserved: number;
  allocated: number;
  safetyStock: number;
  ats: number; // Max(0, onHand - reserved - allocated - safetyStock)
  damaged: number;
  inTransit: number;
  incoming: number;
}

export interface StockMovement {
  id: string;
  organizationId: string;
  workspaceId: string;
  productId: string;
  sku?: string;
  warehouseId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  reference?: string; // Order #, Bill #, Transfer #, etc.
  fromWarehouseId?: string;
  toWarehouseId?: string;
  bucketsBefore: StockBuckets;
  bucketsAfter: StockBuckets;
  actorId?: string;
  actorName?: string;
  metadata?: Record<string, unknown>;
  intent?: string;
  createdAt: string;
}

export interface Reservation {
  id: string;
  organizationId: string;
  workspaceId: string;
  productId: string;
  sku?: string;
  warehouseId: string;
  quantity: number;
  status: ReservationStatus;
  channel?: string;
  orderId?: string;
  reference?: string;
  expiresAt?: string;
  createdAt: string;
  releasedAt?: string;
  allocatedAt?: string;
  fulfilledAt?: string;
}

export type SellerComplexityMode = "small" | "growing" | "enterprise";

export interface ChannelAllocationRule {
  channel: "AMAZON" | "FLIPKART" | "SHOPIFY" | "MEESHO" | "MYNTRA" | "DIRECT_WEB" | string;
  percentage?: number; // 0 - 100
  fixedCap?: number;
  priority?: number;
  safetyBuffer?: number;
  active: boolean;
}

export interface ChannelAllocationResult {
  sku: string;
  totalAts: number;
  allocations: {
    channel: string;
    allocatedQty: number;
    syncStatus: "SYNCED" | "NOT_SYNCED" | "PENDING_SYNC" | "FAILED" | "NOT_CONNECTED";
    lastSyncedAt?: string;
    error?: string;
  }[];
  unallocatedQty: number;
  mode: SellerComplexityMode;
}

export interface ReconciliationIssue {
  id: string;
  type:
    | "NEGATIVE_STOCK"
    | "STORAGE_MISMATCH"
    | "LEDGER_MISMATCH"
    | "OVER_RESERVATION"
    | "OVER_ALLOCATION"
    | "IN_TRANSIT_UNMATCHED"
    | "ORPHANED_RESERVATION"
    | "UNAUTHORIZED_WRITE_OFF"
    | "INVALID_CLASSIFICATION";
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  sku: string;
  productId?: string;
  warehouseId?: string;
  description: string;
  storageQty?: number;
  inventoryQty?: number;
  delta?: number;
  suggestedAction: string;
  detectedAt: string;
}

export interface ReconciliationReport {
  timestamp: string;
  totalSkusAudited: number;
  healthyCount: number;
  issueCount: number;
  issues: ReconciliationIssue[];
  status: "CLEAN" | "DISCREPANCIES_DETECTED";
  sellableSkusCount?: number;
  consumableSkusCount?: number;
  assetSkusCount?: number;
}

export function emptyBuckets(): StockBuckets {
  return {
    available: 0,
    reserved: 0,
    allocated: 0,
    incoming: 0,
    damaged: 0,
    inTransit: 0,
    consumed: 0,
    scrapped: 0,
    safetyStock: 0,
  };
}

export function pickBuckets(balance: StockBuckets): StockBuckets {
  return {
    available: balance.available ?? 0,
    reserved: balance.reserved ?? 0,
    allocated: balance.allocated ?? 0,
    incoming: balance.incoming ?? 0,
    damaged: balance.damaged ?? 0,
    inTransit: balance.inTransit ?? 0,
    consumed: balance.consumed ?? 0,
    scrapped: balance.scrapped ?? 0,
    safetyStock: balance.safetyStock ?? 0,
  };
}
