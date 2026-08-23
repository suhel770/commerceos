/**
 * CommerceOS V4 — Storage Capability System
 * Dynamic Capability System for Storage Locations
 */

import type { StorageLocationType } from "./types";

export type StorageCapability =
  | "receive_stock"
  | "transfer_stock"
  | "adjust_stock"
  | "cycle_count"
  | "barcode"
  | "qc"
  | "returns"
  | "marketplace_sync"
  | "pick_pack"
  | "shipping";

export const ALL_STORAGE_CAPABILITIES: readonly StorageCapability[] = [
  "receive_stock",
  "transfer_stock",
  "adjust_stock",
  "cycle_count",
  "barcode",
  "qc",
  "returns",
  "marketplace_sync",
  "pick_pack",
  "shipping",
] as const;

export const DEFAULT_CAPABILITIES_BY_TYPE: Record<StorageLocationType, readonly StorageCapability[]> = {
  home_storage: [
    "transfer_stock",
    "adjust_stock",
    "cycle_count",
    "barcode",
    "pick_pack",
    "shipping",
  ],
  warehouse: [
    "receive_stock",
    "transfer_stock",
    "adjust_stock",
    "cycle_count",
    "barcode",
    "qc",
    "returns",
    "marketplace_sync",
    "pick_pack",
    "shipping",
  ],
  amazon_fba: [
    "transfer_stock",
    "marketplace_sync",
    "shipping",
  ],
  flipkart_fulfillment: [
    "transfer_stock",
    "marketplace_sync",
    "shipping",
  ],
  "3pl": [
    "receive_stock",
    "transfer_stock",
    "adjust_stock",
    "cycle_count",
    "marketplace_sync",
    "pick_pack",
    "shipping",
  ],
  factory: [
    "receive_stock",
    "transfer_stock",
    "adjust_stock",
    "barcode",
    "qc",
    "shipping",
  ],
  retail_store: [
    "transfer_stock",
    "adjust_stock",
    "cycle_count",
    "barcode",
    "returns",
  ],
  transit: [
    "transfer_stock",
  ],
  returns_area: [
    "receive_stock",
    "adjust_stock",
    "qc",
    "returns",
  ],
  temporary_storage: [
    "receive_stock",
    "transfer_stock",
    "adjust_stock",
  ],
  custom: [
    "receive_stock",
    "transfer_stock",
    "adjust_stock",
    "cycle_count",
    "barcode",
  ],
};
