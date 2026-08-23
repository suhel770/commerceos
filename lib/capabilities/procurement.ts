/**
 * CommerceOS Procurement Capability Engine V4
 * Defines capability-driven feature flags for Procurement Engine v4.
 * Supports Solo, Growth, Enterprise, and Manufacturing sellers dynamically.
 */

export type ProcurementCapability =
  | "procurement.basic"
  | "procurement.receiving"
  | "procurement.grn"
  | "procurement.qc"
  | "procurement.putaway"
  | "procurement.approvals"
  | "procurement.vendorContracts"
  | "procurement.multiWarehouse"
  | "procurement.multiCurrency"
  | "procurement.purchaseReturns"
  | "procurement.ai"
  | "procurement.imports"
  | "procurement.rfq"
  | "procurement.purchaseOrders"
  | "procurement.audit"
  | "procurement.departments"
  | "procurement.costCenters";

export type SellerTier = "solo" | "growth" | "enterprise";

const TIER_CAPABILITIES: Record<SellerTier, Set<ProcurementCapability>> = {
  solo: new Set<ProcurementCapability>([
    "procurement.basic",
  ]),
  growth: new Set<ProcurementCapability>([
    "procurement.basic",
    "procurement.receiving",
    "procurement.purchaseReturns",
    "procurement.assetManagement" as ProcurementCapability,
    "procurement.ai",
  ]),
  enterprise: new Set<ProcurementCapability>([
    "procurement.basic",
    "procurement.receiving",
    "procurement.grn",
    "procurement.qc",
    "procurement.putaway",
    "procurement.approvals",
    "procurement.vendorContracts",
    "procurement.multiWarehouse",
    "procurement.multiCurrency",
    "procurement.purchaseReturns",
    "procurement.ai",
    "procurement.imports",
    "procurement.rfq",
    "procurement.purchaseOrders",
    "procurement.audit",
    "procurement.departments",
    "procurement.costCenters",
  ]),
};

/**
 * Check if a specific procurement capability is enabled.
 */
export function hasProcurementCapability(
  capability: ProcurementCapability,
  customCapabilities?: Set<ProcurementCapability> | ProcurementCapability[],
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

/**
 * Get active capability set for a seller tier preset.
 */
export function getProcurementCapabilities(
  tier: SellerTier = "growth",
): Set<ProcurementCapability> {
  return TIER_CAPABILITIES[tier] ?? TIER_CAPABILITIES.growth;
}
