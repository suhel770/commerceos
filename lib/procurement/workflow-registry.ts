/**
 * CommerceOS Procurement Engine v3.5 - Workflow Registry
 * Maps Business Intents to step-by-step downstream execution pipelines.
 */

import type { BusinessIntent } from "../purchase/types";
import { BUSINESS_INTENT_REGISTRY } from "./intent-registry";

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  targetEngine: "Receiving" | "QC" | "Inventory" | "Warehouse" | "Finance" | "Asset" | "GST" | "Marketplace";
  isAutomatic: boolean;
}

export interface DownstreamWorkflow {
  intent: BusinessIntent;
  workflowName: string;
  steps: WorkflowStep[];
}

export const WORKFLOW_REGISTRY: Record<BusinessIntent, DownstreamWorkflow> = {
  sellable: {
    intent: "sellable",
    workflowName: "Sellable Goods Stock Pipeline",
    steps: [
      {
        id: "step-receive",
        name: "Receiving Queue",
        description: "Physical goods arrive at warehouse loading bay.",
        targetEngine: "Receiving",
        isAutomatic: false,
      },
      {
        id: "step-qc",
        name: "QC Inspection",
        description: "Quality inspection for damaged or defective items.",
        targetEngine: "QC",
        isAutomatic: false,
      },
      {
        id: "step-putaway",
        name: "Put Away & Bin Location",
        description: "Items assigned to warehouse bin and shelf location.",
        targetEngine: "Warehouse",
        isAutomatic: false,
      },
      {
        id: "step-inventory",
        name: "Available Inventory",
        description: "Stock added to live available balance.",
        targetEngine: "Inventory",
        isAutomatic: true,
      },
      {
        id: "step-marketplace",
        name: "Marketplace Listing Sync",
        description: "Channel stock levels synced to Shopify, Amazon, Flipkart.",
        targetEngine: "Marketplace",
        isAutomatic: true,
      },
    ],
  },
  consumable: {
    intent: "consumable",
    workflowName: "Packaging Supplies Pipeline",
    steps: [
      {
        id: "step-receive-consumable",
        name: "Packaging Receiving",
        description: "Packing materials delivered to fulfillment area.",
        targetEngine: "Receiving",
        isAutomatic: false,
      },
      {
        id: "step-consumable-inv",
        name: "Consumables Inventory",
        description: "Packaging supplies tracked in packing inventory balance.",
        targetEngine: "Inventory",
        isAutomatic: true,
      },
      {
        id: "step-packing-consume",
        name: "Order Packing Consumption",
        description: "Consumables deducted as orders are packed and shipped.",
        targetEngine: "Warehouse",
        isAutomatic: true,
      },
    ],
  },
  asset: {
    intent: "asset",
    workflowName: "Capital Asset Registration Pipeline",
    steps: [
      {
        id: "step-asset-register",
        name: "Asset Register Entry",
        description: "Capital item registered in fixed asset schedule.",
        targetEngine: "Asset",
        isAutomatic: true,
      },
      {
        id: "step-asset-finance",
        name: "Balance Sheet Capitalization",
        description: "Asset cost posted to Balance Sheet fixed assets.",
        targetEngine: "Finance",
        isAutomatic: true,
      },
    ],
  },
  expense: {
    intent: "expense",
    workflowName: "Operational Expense Voucher Pipeline",
    steps: [
      {
        id: "step-expense-ledger",
        name: "Expense Ledger Entry",
        description: "Amount debited to Profit & Loss expense account.",
        targetEngine: "Finance",
        isAutomatic: true,
      },
    ],
  },
  service: {
    intent: "service",
    workflowName: "Professional Service Voucher Pipeline",
    steps: [
      {
        id: "step-service-ledger",
        name: "Service Expense Voucher",
        description: "Professional fee debited to P&L account.",
        targetEngine: "Finance",
        isAutomatic: true,
      },
    ],
  },
  marketing: {
    intent: "marketing",
    workflowName: "Marketing Spend Voucher Pipeline",
    steps: [
      {
        id: "step-marketing-ledger",
        name: "Marketing Spend Ledger",
        description: "Ad spend / marketing cost recorded for CAC analytics.",
        targetEngine: "Finance",
        isAutomatic: true,
      },
    ],
  },
  freight: {
    intent: "freight",
    workflowName: "Freight & Transport Allocation Pipeline",
    steps: [
      {
        id: "step-freight-route",
        name: "Landed Cost Allocation",
        description: "Inward freight allocated into sellable SKU cost price or transport expense.",
        targetEngine: "Finance",
        isAutomatic: true,
      },
    ],
  },
  other: {
    intent: "other",
    workflowName: "General Purchase Ledger Pipeline",
    steps: [
      {
        id: "step-other-ledger",
        name: "General Ledger Posting",
        description: "Purchase recorded to general ledger.",
        targetEngine: "Finance",
        isAutomatic: true,
      },
    ],
  },
};

export function getDownstreamWorkflow(intent: BusinessIntent): DownstreamWorkflow {
  return WORKFLOW_REGISTRY[intent] ?? WORKFLOW_REGISTRY.other;
}
