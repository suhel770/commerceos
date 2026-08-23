/**
 * CommerceOS Inventory Engine v1 - Downstream Contracts
 * Pluggable interfaces for Warehouse, Orders, Returns, Marketplace Sync, Reporting, and AI.
 */

import type { AtsResult } from "../availability-engine";
import type { StockReservation } from "../reservation-engine";

export interface WarehousePlugContract {
  assignBinLocation(sku: string, warehouseId: string, binId: string): Promise<boolean>;
}

export interface OrdersPlugContract {
  reserveOrderStock(orderId: string, sku: string, qty: number): Promise<{ success: boolean; reservation: StockReservation }>;
}

export interface ReturnsPlugContract {
  processCustomerReturn(returnId: string, sku: string, qty: number, isDamaged: boolean): Promise<{ success: boolean; targetPool: string }>;
}

export interface MarketplaceSyncPlugContract {
  syncAtsToChannel(channelName: string, sku: string, newAts: number): Promise<{ success: boolean; syncedAt: string }>;
}

export interface ReportingPlugContract {
  generateInventoryValuationBrief(): {
    totalSkus: number;
    totalValuation: number;
    lowStockCount: number;
  };
}

export interface AiPlugContract {
  predictDemand(sku: string, historicalSalesDays: number): Promise<{ recommendedSafetyStock: number; predictedDemandNext30Days: number }>;
}
