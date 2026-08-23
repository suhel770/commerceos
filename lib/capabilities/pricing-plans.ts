/**
 * CommerceOS SaaS Pricing Engine Foundation
 * Maps subscription pricing plans (Starter, Growth, Enterprise) to Global Capabilities.
 * Ensures zero UI redesign when transitioning from dev simulator to commercial billing.
 */

import {
  getCapabilitiesForLevel,
  type CommerceCapabilities,
  type ExperienceLevel,
} from "./capability-engine";

export type PricingPlanId = "starter" | "growth" | "enterprise";

export interface SaaSPlanDefinition {
  id: PricingPlanId;
  name: string;
  level: ExperienceLevel;
  priceMonthly: number;
  badge: string;
  description: string;
}

export const SAAS_PLANS: Record<PricingPlanId, SaaSPlanDefinition> = {
  starter: {
    id: "starter",
    name: "Starter Plan",
    level: "solo",
    priceMonthly: 29,
    badge: "🟢 Starter",
    description: "Streamlined single-user retail execution. Purchase → Inventory → Sell.",
  },
  growth: {
    id: "growth",
    name: "Growth Plan",
    level: "growing",
    priceMonthly: 149,
    badge: "🟡 Growth",
    description: "Expanding multi-location operations with warehouse receiving & basic QC.",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise Plan",
    level: "enterprise",
    priceMonthly: 499,
    badge: "🔴 Enterprise",
    description: "Full commerce platform with Digital Twin, Docks, Cost Centers & Executive AI.",
  },
};

export function getCapabilitiesForPlan(planId: PricingPlanId): CommerceCapabilities {
  const plan = SAAS_PLANS[planId];
  return getCapabilitiesForLevel(plan ? plan.level : "growing");
}
