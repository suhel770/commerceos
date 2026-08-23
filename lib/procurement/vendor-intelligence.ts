/**
 * CommerceOS Procurement Engine v3.5 - Vendor Intelligence Foundation
 * Data model & metrics resolver for Vendor Performance & Reliability Analytics.
 */

import type { Vendor } from "../purchase/types";

export interface VendorIntelligenceMetrics {
  vendorId: string;
  vendorName: string;
  reliabilityScore: number; // 0 - 100
  qualityScore: number; // 0 - 100
  onTimeDeliveryRate: number; // percentage (0 - 100)
  defectRate: number; // percentage (0 - 100)
  averageLeadTimeDays: number;
  purchaseFrequencyMonthly: number;
  outstandingBalance: number;
  totalSpendLifetime: number;
  healthGrade: "A+" | "A" | "B" | "C" | "D";
}

export function computeVendorIntelligence(
  vendor: Vendor,
  metricsOverride?: Partial<VendorIntelligenceMetrics>,
): VendorIntelligenceMetrics {
  const baseReliability = vendor.status === "active" ? 92 : 65;
  const leadTime = vendor.leadTimeDays ?? 7;

  const metrics: VendorIntelligenceMetrics = {
    vendorId: vendor.id,
    vendorName: vendor.name,
    reliabilityScore: baseReliability,
    qualityScore: 95,
    onTimeDeliveryRate: 94,
    defectRate: 1.2,
    averageLeadTimeDays: leadTime,
    purchaseFrequencyMonthly: 3,
    outstandingBalance: 0,
    totalSpendLifetime: 150000,
    healthGrade: baseReliability >= 90 ? "A+" : baseReliability >= 80 ? "A" : "B",
    ...metricsOverride,
  };

  return metrics;
}
