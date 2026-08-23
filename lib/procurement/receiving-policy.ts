/**
 * CommerceOS Procurement Engine v3.5 - Receiving Policy Engine
 * Evaluates receiving, QC, and warehouse policies dynamically for purchase line items.
 */

import type { BusinessIntent } from "../purchase/types";
import { getBusinessIntentMetadata } from "./intent-registry";

export interface ReceivingPolicyResult {
  requiresReceiving: boolean;
  requiresQC: boolean;
  autoReceiveEligible: boolean;
  receivingMode: "auto" | "manual" | "none";
  policyMessage: string;
}

export function evaluateReceivingPolicy(
  intent: BusinessIntent,
  options?: {
    hasReceivingCapability?: boolean;
    hasQCCapability?: boolean;
    autoReceiveEnabled?: boolean;
  },
): ReceivingPolicyResult {
  const metadata = getBusinessIntentMetadata(intent);
  const hasReceivingCap = options?.hasReceivingCapability ?? true;
  const hasQCCap = options?.hasQCCapability ?? false;
  const isAutoReceive = options?.autoReceiveEnabled ?? false;

  if (!metadata.inventoryCoupled || !hasReceivingCap) {
    return {
      requiresReceiving: false,
      requiresQC: false,
      autoReceiveEligible: true,
      receivingMode: "none",
      policyMessage: "Direct finance/ledger posting — no warehouse receiving required.",
    };
  }

  if (isAutoReceive) {
    return {
      requiresReceiving: false,
      requiresQC: false,
      autoReceiveEligible: true,
      receivingMode: "auto",
      policyMessage: "Auto-receive enabled — stock updated immediately upon purchase.",
    };
  }

  return {
    requiresReceiving: metadata.requiresReceiving,
    requiresQC: metadata.requiresQC && hasQCCap,
    autoReceiveEligible: false,
    receivingMode: "manual",
    policyMessage: metadata.requiresQC && hasQCCap
      ? "Manual Goods Receiving & QC Inspection required prior to put away."
      : "Manual Goods Receiving required prior to stock availability.",
  };
}
