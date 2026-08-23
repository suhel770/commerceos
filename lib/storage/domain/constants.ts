/**
 * CommerceOS V4 — Storage Domain Constants & Rules
 */

import type { StorageLocationType, StorageLifecycleState } from "./types";

export const RESERVED_LOCATION_CODES: readonly string[] = [
  "SYS",
  "SYSTEM",
  "ADMIN",
  "ROOT",
  "NULL",
  "GLOBAL",
  "DEFAULT",
  "UNDEFINED",
  "ALL",
  "NONE",
] as const;

export const AUTO_LABEL_PREFIXES_BY_TYPE: Record<StorageLocationType, string> = {
  home_storage: "HOME",
  warehouse: "WH",
  amazon_fba: "AMZ",
  flipkart_fulfillment: "FK",
  "3pl": "3PL",
  factory: "FAC",
  retail_store: "RET",
  transit: "TRN",
  returns_area: "RET-BAY",
  temporary_storage: "TMP",
  custom: "LOC",
};

export const VALID_LIFECYCLE_TRANSITIONS: Record<StorageLifecycleState, readonly StorageLifecycleState[]> = {
  draft: ["configured", "archived"],
  configured: ["active", "draft", "archived"],
  active: ["maintenance", "inactive", "archived"],
  maintenance: ["active", "inactive", "archived"],
  inactive: ["active", "maintenance", "archived"],
  archived: [], // Terminal state
};
