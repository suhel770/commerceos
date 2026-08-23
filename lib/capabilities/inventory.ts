/**
 * CommerceOS Inventory Capability Engine V1
 * Defines capability-driven feature flags for Inventory Engine v1.
 * Supports Solo, Growth, Enterprise, and Multi-Warehouse sellers dynamically.
 */

export type InventoryCapability =
  | "inventory.basic"
  | "inventory.reservations"
  | "inventory.consumables"
  | "inventory.replenishment"
  | "inventory.multiWarehouse"
  | "inventory.batches"
  | "inventory.serials"
  | "inventory.expiry"
  | "inventory.cycleCount";

export type SellerTier = "solo" | "growth" | "enterprise";

const TIER_CAPABILITIES: Record<SellerTier, Set<InventoryCapability>> = {
  solo: new Set<InventoryCapability>([
    "inventory.basic",
    "inventory.reservations",
  ]),
  growth: new Set<InventoryCapability>([
    "inventory.basic",
    "inventory.reservations",
    "inventory.consumables",
    "inventory.replenishment",
  ]),
  enterprise: new Set<InventoryCapability>([
    "inventory.basic",
    "inventory.reservations",
    "inventory.consumables",
    "inventory.replenishment",
    "inventory.multiWarehouse",
    "inventory.batches",
    "inventory.serials",
    "inventory.expiry",
    "inventory.cycleCount",
  ]),
};

export function hasInventoryCapability(
  capability: InventoryCapability,
  customCapabilities?: Set<InventoryCapability> | InventoryCapability[],
  tier: SellerTier = "growth",
): boolean {
  if (customCapabilities) {
    const set =
      customCapabilities instanceof Set
        ? customCapabilities
        : new Set(customCapabilities);
    return set.has(capability);
  }
  return TIER_CAPABILITIES[tier]?.has(capability) ?? false;
}

export function getInventoryCapabilities(
  tier: SellerTier = "growth",
): Set<InventoryCapability> {
  return TIER_CAPABILITIES[tier] ?? TIER_CAPABILITIES.growth;
}
