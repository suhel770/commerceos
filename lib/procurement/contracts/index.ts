/**
 * CommerceOS Procurement Engine v3.5 - Future Module Contracts
 * Standardized interfaces for downstream engines (Inventory, Warehouse, Finance, GST, Assets, Reporting).
 * These interfaces ensure future modules plug directly into Procurement without breaking changes.
 */

import type { BusinessIntent, PurchaseBill, PurchaseBillLine } from "../../purchase/types";

/** Contract for Downstream Inventory Engine */
export interface InventoryEngineContract {
  receivePurchaseStock(event: {
    billId: string;
    lineId: string;
    sku: string;
    quantity: number;
    intent: BusinessIntent;
  }): Promise<{ success: boolean; updatedAvailableStock: number }>;
}

/** Contract for Downstream Warehouse Engine */
export interface WarehouseEngineContract {
  allocatePutawayBin(event: {
    sku: string;
    quantity: number;
    warehouseId: string;
    binId?: string;
  }): Promise<{ success: boolean; binLocation: string }>;
}

/** Contract for Downstream Finance Engine */
export interface FinanceEngineContract {
  postPurchaseVoucher(event: {
    billId: string;
    vendorId: string;
    taxableAmount: number;
    gstAmount: number;
    grandTotal: number;
    intent: BusinessIntent;
  }): Promise<{ success: boolean; journalVoucherId: string }>;
}

/** Contract for Downstream GST Engine */
export interface GstEngineContract {
  recordInputTaxCredit(event: {
    billId: string;
    vendorGstin?: string;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    isClaimable: boolean;
  }): Promise<{ success: boolean; gstr2bMatchStatus: "matched" | "pending" | "ineligible" }>;
}

/** Contract for Downstream Fixed Asset Engine */
export interface AssetEngineContract {
  registerFixedAsset(event: {
    billId: string;
    assetName: string;
    purchaseCost: number;
    purchaseDate: string;
  }): Promise<{ success: boolean; assetTag: string }>;
}

/** Contract for Reporting Engine */
export interface ReportingContract {
  generateProcurementBrief(bills: PurchaseBill[]): {
    totalSpend: number;
    activeVendorsCount: number;
    topCategory: string;
  };
}
