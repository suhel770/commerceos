/**
 * CommerceOS V5 — Damaged Stock & Vendor Exchange Engine Types
 * Handles damaged stock lifecycle, vendor exchanges, replacement receiving, and replacement QC.
 */

import type { SecurityContext } from "../domain/types";

export type DamagedStockStatus =
  | "qc_holding"            // Marked damaged during receiving QC, awaiting disposition
  | "exchange_requested"   // Return/Exchange initiated with vendor
  | "awaiting_replacement" // Dispatched / Acknowledged, waiting for replacement shipment
  | "replacement_received" // Replacement package arrived at facility
  | "replacement_qc"       // Under replacement QC inspection
  | "scrapped"             // Permanently disposed / written off in Finance
  | "resolved"             // Fully replaced, credited, or written off
  | "written_off";         // Legacy alias for scrapped

export type StockDispositionType =
  | "vendor_exchange"
  | "scrap_destroy"
  | "credit_note";

export type VendorDamagePolicy =
  | "EXCHANGE_RETURN_SUPPORTED"
  | "NON_RETURNABLE"
  | "CREDIT_NOTE_REFUND"
  | "CASE_BY_CASE";

export type VendorExchangeResolutionType =
  | "replacement_accepted"
  | "replacement_partially_accepted"
  | "credit_note_issued"
  | "scrapped_write_off";

export interface ScrapWriteOffRecord {
  id: string;
  organizationId: string;
  workspaceId: string;
  billId: string;
  billNumber: string;
  lineId: string;
  sku: string;
  productName: string;
  vendorId: string;
  vendorName: string;
  storageLocationId: string;
  storageLocationName?: string;
  scrappedQty: number;
  unitCost?: number;
  totalWriteOffAmount?: number;
  damageReason: string;
  disposalReason: string;
  disposalMethod?: string;
  notes?: string;
  financeEventId: string;
  financeStatus: "pending_review" | "posted_write_off";
  createdAt: string;
  createdBy: string;
  createdByName?: string;
}

export interface VendorExchangeRecord {
  id: string;
  organizationId: string;
  workspaceId: string;
  billId: string;
  billNumber: string;
  lineId: string;
  sku: string;
  productName: string;
  vendorId: string;
  vendorName: string;
  vendorPolicy?: VendorDamagePolicy;
  storageLocationId: string;
  storageLocationName?: string;
  
  // Quantities
  originalReceivedQty: number;
  originalDamagedQty: number;
  exchangeQty: number;              // Total units sent for exchange in this request
  replacementReceivedQty: number;   // Total units physically arrived from vendor
  replacementAcceptedQty: number;   // Good units that passed QC and entered Available stock
  replacementDamagedQty: number;    // Units arrived damaged during replacement QC
  unresolvedQty: number;            // exchangeQty - replacementAcceptedQty
  
  // Status & Audit
  status: DamagedStockStatus;
  disposition: StockDispositionType;
  reason: string;
  notes?: string;
  vendorRefNumber?: string;         // e.g. RMA #, Vendor Ticket ID
  expectedReplacementDate?: string;
  
  // Lifecycle Timestamps
  createdAt: string;
  exchangeInitiatedAt?: string;
  replacementReceivedAt?: string;
  resolvedAt?: string;
  
  // Actor Audit
  createdBy: string;
  createdByName?: string;
  resolvedBy?: string;
  resolvedByName?: string;
}

export interface CreateVendorExchangeInput {
  billId: string;
  billNumber: string;
  lineId: string;
  sku: string;
  productName: string;
  vendorId?: string;
  vendorName?: string;
  vendorPolicy?: VendorDamagePolicy;
  isAuthorizedOverride?: boolean;
  storageLocationId?: string;
  storageLocationName?: string;
  originalReceivedQty: number;
  originalDamagedQty: number;
  exchangeQty: number;
  reason: string;
  notes?: string;
  vendorRefNumber?: string;
  expectedReplacementDate?: string;
  securityContext: SecurityContext;
}

export interface ScrapDamagedStockInput {
  billId: string;
  billNumber: string;
  lineId: string;
  sku: string;
  productName: string;
  vendorId?: string;
  vendorName?: string;
  storageLocationId?: string;
  storageLocationName?: string;
  originalDamagedQty: number;
  scrapQty: number;
  unitCost?: number;
  damageReason: string;
  disposalReason: string;
  disposalMethod?: string;
  notes?: string;
  securityContext: SecurityContext;
}

export interface ReceiveExchangeReplacementInput {
  exchangeId: string;
  receivedQty: number;
  acceptedQty: number;
  damagedQty: number;
  storageLocationId: string;
  storageLocationName?: string;
  targetBin?: string;
  notes?: string;
  securityContext: SecurityContext;
}

export interface DamagedStockItemView {
  id: string;
  billId: string;
  billNumber: string;
  lineId: string;
  sku: string;
  productName: string;
  vendorId: string;
  vendorName: string;
  vendorPolicy?: VendorDamagePolicy;
  storageLocationId: string;
  storageLocationName: string;
  totalDamagedQty: number;
  activeExchangeQty: number;
  scrappedQty: number;
  unresolvedDamagedQty: number;
  status: DamagedStockStatus;
  activeExchangeId?: string;
  vendorRefNumber?: string;
  updatedAt: string;
}
