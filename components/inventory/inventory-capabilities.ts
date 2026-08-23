export type InventoryCapabilities = {
  /**
   * @deprecated Forecast lives only inside Inventory Advisor (AI).
   * Kept for compatibility; core dashboard never mounts forecast widgets.
   */
  inventory_forecast: boolean;
  /** Operational transfer suggestions across warehouses */
  multi_warehouse: boolean;
  /** Marketplace allocation visualization (non-AI) */
  marketplace_inventory: boolean;
  /** Optional CommerceOS Inventory Advisor (AI) */
  ai_inventory: boolean;
  /** Cycle count / audit stubs */
  inventory_audit: boolean;
};

/** Level-1 friendly defaults — core inventory never depends on AI. */
export const DEFAULT_INVENTORY_CAPABILITIES: InventoryCapabilities = {
  inventory_forecast: false,
  multi_warehouse: true,
  marketplace_inventory: true,
  ai_inventory: true,
  inventory_audit: false,
};
