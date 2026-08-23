/**
 * CommerceOS Core Platform Foundation (CPF) V1
 * Capability Platform (CapabilityPlatform)
 * Evaluates feature access strictly via capability flags across Solo, Growing, and Enterprise.
 */

export type CapabilityFlag =
  | "grn_generation"
  | "qc_workflow"
  | "directed_putaway"
  | "stock_movements"
  | "cycle_counts"
  | "digital_twin_canvas"
  | "multi_warehouse"
  | "barcode_system"
  | "scanner_integration"
  | "ai_advisor";

export type SellerTier = "solo" | "growing" | "enterprise";

const TIER_CAPABILITIES: Record<SellerTier, CapabilityFlag[]> = {
  solo: ["barcode_system", "scanner_integration"],
  growing: [
    "barcode_system",
    "scanner_integration",
    "grn_generation",
    "qc_workflow",
    "directed_putaway",
    "stock_movements",
    "cycle_counts",
  ],
  enterprise: [
    "barcode_system",
    "scanner_integration",
    "grn_generation",
    "qc_workflow",
    "directed_putaway",
    "stock_movements",
    "cycle_counts",
    "digital_twin_canvas",
    "multi_warehouse",
    "ai_advisor",
  ],
};

class CapabilityPlatformEngine {
  public hasCapability(tier: SellerTier, flag: CapabilityFlag): boolean {
    return TIER_CAPABILITIES[tier]?.includes(flag) ?? false;
  }

  public getActiveCapabilities(tier: SellerTier): CapabilityFlag[] {
    return TIER_CAPABILITIES[tier] ?? [];
  }
}

export const capabilityPlatform = new CapabilityPlatformEngine();
