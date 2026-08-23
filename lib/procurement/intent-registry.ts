/**
 * CommerceOS Procurement Engine v3.5 - Business Intent Registry
 * Central, single source of truth for all Business Intent metadata.
 * Consumed by Purchase, Inventory, Warehouse, Finance, and Asset engines.
 */

import type { BusinessIntent } from "../purchase/types";

export interface BusinessIntentMetadata {
  intent: BusinessIntent;
  name: string;
  description: string;
  iconName: string;
  badgeTone: "emerald" | "blue" | "purple" | "amber" | "indigo" | "rose" | "orange" | "slate";
  inventoryCoupled: boolean;
  financeCoupled: boolean;
  assetCoupled: boolean;
  requiresReceiving: boolean;
  requiresQC: boolean;
  defaultInventoryType: "sellable" | "consumable" | "asset" | "quarantine" | "none";
  defaultDownstreamWorkflow: string;
}

export const BUSINESS_INTENT_REGISTRY: Record<BusinessIntent, BusinessIntentMetadata> = {
  sellable: {
    intent: "sellable",
    name: "Sellable Goods",
    description: "Physical products purchased for resale to customers.",
    iconName: "Box",
    badgeTone: "emerald",
    inventoryCoupled: true,
    financeCoupled: true,
    assetCoupled: false,
    requiresReceiving: true,
    requiresQC: true,
    defaultInventoryType: "sellable",
    defaultDownstreamWorkflow: "Receiving -> QC -> Put Away -> Available Stock -> Marketplace Ready",
  },
  consumable: {
    intent: "consumable",
    name: "Consumable Packaging",
    description: "Boxes, tape, polybags, labels used during order fulfillment.",
    iconName: "Package",
    badgeTone: "blue",
    inventoryCoupled: true,
    financeCoupled: true,
    assetCoupled: false,
    requiresReceiving: true,
    requiresQC: false,
    defaultInventoryType: "consumable",
    defaultDownstreamWorkflow: "Receiving -> Consumable Inventory -> Packing Consumption",
  },
  asset: {
    intent: "asset",
    name: "Capital Asset",
    description: "Laptops, machinery, furniture owned for long-term operations.",
    iconName: "Laptop",
    badgeTone: "purple",
    inventoryCoupled: false,
    financeCoupled: true,
    assetCoupled: true,
    requiresReceiving: false,
    requiresQC: false,
    defaultInventoryType: "asset",
    defaultDownstreamWorkflow: "Asset Register -> Depreciation Schedule -> Finance Ledger",
  },
  expense: {
    intent: "expense",
    name: "Operational Expense",
    description: "Office supplies, maintenance, utility bills, snacks.",
    iconName: "FileText",
    badgeTone: "amber",
    inventoryCoupled: false,
    financeCoupled: true,
    assetCoupled: false,
    requiresReceiving: false,
    requiresQC: false,
    defaultInventoryType: "none",
    defaultDownstreamWorkflow: "Finance Expense Ledger",
  },
  service: {
    intent: "service",
    name: "Service / Professional",
    description: "Consulting, legal fees, CA audit, agency services.",
    iconName: "FileText",
    badgeTone: "indigo",
    inventoryCoupled: false,
    financeCoupled: true,
    assetCoupled: false,
    requiresReceiving: false,
    requiresQC: false,
    defaultInventoryType: "none",
    defaultDownstreamWorkflow: "Finance Expense Ledger -> Service Invoice Matching",
  },
  marketing: {
    intent: "marketing",
    name: "Marketing Spend",
    description: "Ad campaigns, influencer fees, sponsorships, print media.",
    iconName: "Megaphone",
    badgeTone: "rose",
    inventoryCoupled: false,
    financeCoupled: true,
    assetCoupled: false,
    requiresReceiving: false,
    requiresQC: false,
    defaultInventoryType: "none",
    defaultDownstreamWorkflow: "Marketing Expense Ledger -> CAC Analysis",
  },
  freight: {
    intent: "freight",
    name: "Freight / Transport",
    description: "Inward shipping & courier costs for goods transportation.",
    iconName: "Truck",
    badgeTone: "orange",
    inventoryCoupled: false,
    financeCoupled: true,
    assetCoupled: false,
    requiresReceiving: false,
    requiresQC: false,
    defaultInventoryType: "none",
    defaultDownstreamWorkflow: "Expense Ledger OR Landed Cost Allocation to SKU unit cost",
  },
  other: {
    intent: "other",
    name: "Other Charges",
    description: "Miscellaneous business purchases.",
    iconName: "FileText",
    badgeTone: "slate",
    inventoryCoupled: false,
    financeCoupled: true,
    assetCoupled: false,
    requiresReceiving: false,
    requiresQC: false,
    defaultInventoryType: "none",
    defaultDownstreamWorkflow: "General Expense Ledger",
  },
};

export function getBusinessIntentMetadata(intent: BusinessIntent): BusinessIntentMetadata {
  return BUSINESS_INTENT_REGISTRY[intent] ?? BUSINESS_INTENT_REGISTRY.other;
}
