/**
 * CommerceOS V4 — Storage Domain Types & Value Objects
 * Phase 2 Universal Storage Location Engine Layer
 */

export type StorageLocationType =
  | "home_storage"
  | "warehouse"
  | "amazon_fba"
  | "flipkart_fulfillment"
  | "3pl"
  | "factory"
  | "retail_store"
  | "transit"
  | "returns_area"
  | "temporary_storage"
  | "custom";

export type StorageLocationScope = "internal" | "external_fulfillment";

/**
 * Predicate to check if a location type is internally controlled physical storage.
 * Eligible for purchase receiving, putaway, move bin, cycle count, manual adjust, and consumption.
 */
export function isInternalLocationType(type: StorageLocationType): boolean {
  return (
    type === "home_storage" ||
    type === "warehouse" ||
    type === "factory" ||
    type === "retail_store" ||
    type === "returns_area" ||
    type === "temporary_storage" ||
    type === "custom"
  );
}

/**
 * Predicate to check if a location type is externally managed fulfillment (Amazon FBA, Flipkart FBF, 3PL).
 * Quantities are isolated and not eligible for ordinary internal warehouse purchase receiving.
 */
export function isExternalFulfillmentType(type: StorageLocationType): boolean {
  return (
    type === "amazon_fba" ||
    type === "flipkart_fulfillment" ||
    type === "3pl" ||
    type === "transit"
  );
}

export function getStorageLocationScope(type: StorageLocationType): StorageLocationScope {
  return isExternalFulfillmentType(type) ? "external_fulfillment" : "internal";
}

export type StorageLifecycleState =
  | "draft"
  | "configured"
  | "active"
  | "maintenance"
  | "inactive"
  | "archived";

export interface StorageAddress {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

export type MarketplaceProvider =
  | "amazon"
  | "flipkart"
  | "meesho"
  | "shopify"
  | "custom_3pl"
  | "none";

export interface StorageMarketplaceConnection {
  provider: MarketplaceProvider;
  sellerId?: string;
  region?: string;
  fcReferenceCode?: string; // e.g., DEL4, BOM1, BLR2
  connectionStatus: "connected" | "disconnected" | "syncing" | "error" | "not_configured";
  lastSyncedAt?: string;
}

export interface SecurityContext {
  tenantId: string;
  organizationId: string;
  workspaceId: string;
  actorId?: string;
  actorName?: string;
}

export interface StorageAuditEntry {
  id: string;
  locationId: string;
  action: string;
  actorId: string;
  actorName: string;
  fieldChanged: string;
  oldValue: unknown;
  newValue: unknown;
  reason?: string;
  timestamp: string;
}

export type StorageComplexityMode = "simple" | "medium" | "advanced";

export type SubLocationLevel = "zone" | "aisle" | "rack" | "shelf" | "bin";

export interface SubLocationNode {
  id: string;
  code: string;
  name: string;
  level: SubLocationLevel;
  parentId?: string;
  barcode?: string;
  capacityMaxUnits?: number;
  currentUnitsCount?: number;
  children?: SubLocationNode[];
}

export interface StorageLocationProperties {
  id: string;
  name: string;
  code: string;
  type: StorageLocationType;
  lifecycleState: StorageLifecycleState;
  storageComplexityMode?: StorageComplexityMode;
  subLocations?: SubLocationNode[];
  parentLocationId?: string;
  address?: StorageAddress;
  marketplace?: StorageMarketplaceConnection;
  isDefault: boolean;
  isArchived: boolean;
  locationScope?: StorageLocationScope;
  tags?: string[];
  metadata: Record<string, unknown>;
  securityContext: SecurityContext;
  createdAt: string;
  updatedAt: string;
}

export interface StorageHierarchyNode {
  location: StorageLocationProperties;
  children: StorageHierarchyNode[];
  ancestorPath: string[];
  depth: number;
}

export interface StorageSearchQuery {
  query?: string; // Full text on name/code
  name?: string;
  code?: string;
  type?: StorageLocationType;
  lifecycleState?: StorageLifecycleState;
  marketplaceProvider?: MarketplaceProvider;
  city?: string;
  state?: string;
  country?: string;
  tags?: string[];
  isDefault?: boolean;
  isArchived?: boolean;
}
