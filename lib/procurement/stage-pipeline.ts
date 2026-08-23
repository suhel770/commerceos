/**
 * CommerceOS Procurement Engine v4 - Stage Pipeline Evaluator
 * Evaluates active procurement workflow stages dynamically based on capabilities.
 */

import type { ProcurementCapability, SellerTier } from "../capabilities/procurement";
import { hasProcurementCapability } from "../capabilities/procurement";

export type ProcurementStageId =
  | "vendor_selection"
  | "rfq"
  | "purchase_order"
  | "approval"
  | "vendor_confirmation"
  | "purchase_bill"
  | "receiving"
  | "grn"
  | "qc"
  | "quarantine"
  | "putaway"
  | "inventory_available"
  | "finance_posting"
  | "gst_posting"
  | "asset_register"
  | "reporting";

export interface PipelineStage {
  id: ProcurementStageId;
  name: string;
  description: string;
  requiredCapability?: ProcurementCapability;
  isActive: boolean;
}

export function evaluateProcurementPipeline(
  activeCapabilities?: Set<ProcurementCapability> | ProcurementCapability[],
  tier: SellerTier = "growth",
): PipelineStage[] {
  const check = (cap?: ProcurementCapability) =>
    cap ? hasProcurementCapability(cap, activeCapabilities, tier) : true;

  const stages: Array<{ id: ProcurementStageId; name: string; description: string; cap?: ProcurementCapability }> = [
    { id: "vendor_selection", name: "Vendor Selection", description: "Select or manage supplier directory." },
    { id: "rfq", name: "RFQ / Quotation", description: "Request vendor quotes & price bids.", cap: "procurement.rfq" },
    { id: "purchase_order", name: "Purchase Order", description: "Issue formal PO to vendor.", cap: "procurement.purchaseOrders" },
    { id: "approval", name: "Manager Approval", description: "Multi-tier approval workflow.", cap: "procurement.approvals" },
    { id: "vendor_confirmation", name: "Vendor Confirmation", description: "Vendor accepts PO terms.", cap: "procurement.purchaseOrders" },
    { id: "purchase_bill", name: "Universal Purchase Bill", description: "Record invoice bill & intent line items." },
    { id: "receiving", name: "Goods Receiving", description: "Warehouse loading bay arrival.", cap: "procurement.receiving" },
    { id: "grn", name: "GRN Generation", description: "Goods Receipt Note reconciliation.", cap: "procurement.grn" },
    { id: "qc", name: "QC Inspection", description: "Inspect items for defects & damage.", cap: "procurement.qc" },
    { id: "quarantine", name: "Quarantine Hold", description: "Quarantine defective stock.", cap: "procurement.qc" },
    { id: "putaway", name: "Bin Put Away", description: "Assign stock to warehouse bin location.", cap: "procurement.putaway" },
    { id: "inventory_available", name: "Inventory Available", description: "Stock added to live balance." },
    { id: "finance_posting", name: "Finance Posting", description: "Journal voucher posted to ledger." },
    { id: "gst_posting", name: "GST ITC Record", description: "Input tax credit recorded for GSTR-2B." },
    { id: "reporting", name: "Analytics Reporting", description: "Procurement brief updated." },
  ];

  return stages.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    requiredCapability: s.cap,
    isActive: check(s.cap),
  }));
}
