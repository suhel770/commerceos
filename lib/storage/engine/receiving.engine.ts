/**
 * CommerceOS V5 — Storage Receiving Engine
 * Handles real receiving execution, item location routing, inventory updates, audit & activity records.
 */

import { DEFAULT_BUYER_STATE_CODE } from "@/lib/purchase";
import type { PurchaseBill, PurchaseBillLine } from "@/lib/purchase/types";
import type { SecurityContext } from "../domain/types";
import { eventBus } from "@/lib/core/event-bus";

import { storageEquipmentRepository } from "./storage-equipment.engine";

export interface ReceivingItemAllocation {
  lineId: string;
  sku: string;
  description: string;
  orderedQty: number;
  alreadyReceivedQty: number;
  receivingQty: number;
  damagedQty?: number;
  destinationLocationId: string;
  destinationLocationName?: string;
  subLocationId?: string;
  targetBin?: string;
  intent: "sellable" | "consumable" | "asset";
  isPhysicalAsset?: boolean;
  assetTag?: string;
}

export interface ReceivingExecutionInput {
  billId: string;
  allocations: ReceivingItemAllocation[];
  securityContext: SecurityContext;
}

export interface ReceivingExecutionResult {
  success: boolean;
  billId: string;
  billNumber: string;
  status: "completed" | "partially_received";
  totalReceivedItems: number;
  activityId: string;
  timestamp: string;
}

// In-memory persistent store for location-allocated inventory balances
export interface LocationStockRecord {
  id: string;
  storageLocationId: string;
  productId: string;
  sku: string;
  productName: string;
  intent: "sellable" | "consumable";
  availableQty: number;
  receivedFromBillId: string;
  updatedAt: string;
}

export interface ConsumptionRecord {
  id: string;
  sku: string;
  productName: string;
  quantity: number;
  reason: "Order Packaging" | "Internal Operations" | "Production" | "Sample" | "Damaged/Write-off" | "Manual Consumption" | "Other" | string;
  customReason?: string;
  reference?: string; // e.g. "Order #ORD-10234"
  storageLocationId?: string;
  storageLocationName?: string;
  actorName?: string;
  timestamp: string;
}

const LOCAL_STORAGE_STOCK_KEY = "commerceos_location_stock_v5";
const LOCAL_STORAGE_CONSUMPTION_KEY = "commerceos_consumption_history_v1";

export class LocationStockRepository {
  private records: LocationStockRecord[] = [];
  private consumptionHistory: ConsumptionRecord[] = [];
  private isLoaded = false;

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_STOCK_KEY);
      if (saved && (saved.includes("StrideKids") || saved.includes("BILL-10") || saved.includes("SK-"))) {
        localStorage.removeItem(LOCAL_STORAGE_STOCK_KEY);
        this.records = [];
      } else if (saved) {
        this.records = JSON.parse(saved);
      }

      const savedCons = localStorage.getItem(LOCAL_STORAGE_CONSUMPTION_KEY);
      if (savedCons) {
        this.consumptionHistory = JSON.parse(savedCons);
      }
    } catch {
      // Ignore quota errors
    }
    this.isLoaded = true;
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LOCAL_STORAGE_STOCK_KEY, JSON.stringify(this.records));
      localStorage.setItem(LOCAL_STORAGE_CONSUMPTION_KEY, JSON.stringify(this.consumptionHistory));
      window.dispatchEvent(new CustomEvent("commerceos_stock_updated"));
    } catch {
      // Ignore quota errors
    }
  }

  addStock(record: Omit<LocationStockRecord, "id" | "updatedAt">): LocationStockRecord {
    if (!this.isLoaded) this.loadFromStorage();
    const existing = this.records.find(
      (r) =>
        (r.storageLocationId === record.storageLocationId ||
          r.storageLocationId?.toLowerCase() === record.storageLocationId?.toLowerCase()) &&
        r.sku === record.sku
    );

    const now = new Date().toISOString();

    let res: LocationStockRecord;
    if (existing) {
      existing.availableQty += record.availableQty;
      existing.updatedAt = now;
      res = { ...existing };
    } else {
      const newRecord: LocationStockRecord = {
        ...record,
        id: `lstock-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        updatedAt: now,
      };

      this.records.push(newRecord);
      res = { ...newRecord };
    }
    this.saveToStorage();
    return res;
  }

  /**
   * Consume / Deduct accepted physical stock with full audit tracking ("Where was it used?")
   */
  consumeStock(input: {
    sku: string;
    quantity: number;
    storageLocationId?: string;
    storageLocationName?: string;
    reason: string;
    customReason?: string;
    reference?: string;
    actorName?: string;
  }): { success: boolean; error?: string; remainingAvailable: number; record?: ConsumptionRecord } {
    if (!this.isLoaded) this.loadFromStorage();

    if (input.quantity <= 0) {
      return { success: false, error: "Consumption quantity must be greater than zero.", remainingAvailable: 0 };
    }

    const skuLower = input.sku.toLowerCase().trim();
    const matches = this.records.filter((r) => r.sku.toLowerCase().trim() === skuLower && r.availableQty > 0);
    const totalAvailable = matches.reduce((sum, r) => sum + r.availableQty, 0);

    if (totalAvailable < input.quantity) {
      return {
        success: false,
        error: `Insufficient stock. Only ${totalAvailable} units available for SKU ${input.sku}. Cannot consume ${input.quantity} units.`,
        remainingAvailable: totalAvailable,
      };
    }

    // Deduct quantity from matched storage locations (specific location or FIFO)
    let qtyToDeduct = input.quantity;
    let targetProductName = input.sku;

    for (const record of matches) {
      if (input.storageLocationId && record.storageLocationId !== input.storageLocationId) {
        continue;
      }
      targetProductName = record.productName || targetProductName;
      const deduct = Math.min(record.availableQty, qtyToDeduct);
      record.availableQty -= deduct;
      record.updatedAt = new Date().toISOString();
      qtyToDeduct -= deduct;
      if (qtyToDeduct <= 0) break;
    }

    // If still remaining because location was specified but had insufficient units, take from other locations
    if (qtyToDeduct > 0) {
      for (const record of matches) {
        if (record.availableQty > 0) {
          const deduct = Math.min(record.availableQty, qtyToDeduct);
          record.availableQty -= deduct;
          record.updatedAt = new Date().toISOString();
          qtyToDeduct -= deduct;
          if (qtyToDeduct <= 0) break;
        }
      }
    }

    const consumptionEntry: ConsumptionRecord = {
      id: `cons-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sku: input.sku,
      productName: targetProductName,
      quantity: input.quantity,
      reason: input.reason,
      customReason: input.customReason,
      reference: input.reference || "Internal Usage",
      storageLocationId: input.storageLocationId,
      storageLocationName: input.storageLocationName || "Main Facility",
      actorName: input.actorName || "Warehouse Staff",
      timestamp: new Date().toISOString(),
    };

    this.consumptionHistory.unshift(consumptionEntry);
    this.saveToStorage();

    const newRemaining = this.records
      .filter((r) => r.sku.toLowerCase().trim() === skuLower)
      .reduce((sum, r) => sum + r.availableQty, 0);

    return {
      success: true,
      remainingAvailable: newRemaining,
      record: consumptionEntry,
    };
  }

  /**
   * Reverse / Deduct physical stock on receiving correction (syncs with database reversal)
   */
  reverseStock(input: {
    sku: string;
    quantity: number;
    storageLocationId?: string;
  }): { success: boolean; error?: string; remainingAvailable: number } {
    if (!this.isLoaded) this.loadFromStorage();

    if (input.quantity <= 0) {
      return { success: false, error: "Reversal quantity must be greater than zero.", remainingAvailable: 0 };
    }

    const skuLower = input.sku.toLowerCase().trim();
    const matches = this.records.filter((r) => r.sku.toLowerCase().trim() === skuLower && r.availableQty > 0);
    const totalAvailable = matches.reduce((sum, r) => sum + r.availableQty, 0);

    if (totalAvailable < input.quantity) {
      return {
        success: false,
        error: `Insufficient stock to reverse. Only ${totalAvailable} units available for SKU ${input.sku}.`,
        remainingAvailable: totalAvailable,
      };
    }

    let qtyToDeduct = input.quantity;
    for (const record of matches) {
      if (input.storageLocationId && record.storageLocationId !== input.storageLocationId) {
        continue;
      }
      const deduct = Math.min(record.availableQty, qtyToDeduct);
      record.availableQty -= deduct;
      record.updatedAt = new Date().toISOString();
      qtyToDeduct -= deduct;
      if (qtyToDeduct <= 0) break;
    }

    if (qtyToDeduct > 0) {
      for (const record of matches) {
        if (record.availableQty > 0) {
          const deduct = Math.min(record.availableQty, qtyToDeduct);
          record.availableQty -= deduct;
          record.updatedAt = new Date().toISOString();
          qtyToDeduct -= deduct;
          if (qtyToDeduct <= 0) break;
        }
      }
    }

    this.saveToStorage();

    const newRemaining = this.records
      .filter((r) => r.sku.toLowerCase().trim() === skuLower)
      .reduce((sum, r) => sum + r.availableQty, 0);

    return {
      success: true,
      remainingAvailable: newRemaining,
    };
  }

  getConsumptionHistory(sku?: string): ConsumptionRecord[] {
    if (!this.isLoaded) this.loadFromStorage();
    if (!sku) return [...this.consumptionHistory];
    const skuLower = sku.toLowerCase().trim();
    return this.consumptionHistory.filter((c) => c.sku.toLowerCase().trim() === skuLower);
  }

  getTotalConsumed(sku: string): number {
    if (!this.isLoaded) this.loadFromStorage();
    const skuLower = sku.toLowerCase().trim();
    return this.consumptionHistory
      .filter((c) => c.sku.toLowerCase().trim() === skuLower)
      .reduce((sum, c) => sum + c.quantity, 0);
  }

  getBalancesForLocation(storageLocationId: string): LocationStockRecord[] {
    if (!this.isLoaded) this.loadFromStorage();
    return this.records.filter(
      (r) =>
        r.storageLocationId === storageLocationId ||
        r.storageLocationId?.toLowerCase() === storageLocationId?.toLowerCase()
    );
  }

  getAllBalances(): LocationStockRecord[] {
    if (!this.isLoaded) this.loadFromStorage();
    return [...this.records];
  }

  clearForTesting(): void {
    this.records = [];
    this.consumptionHistory = [];
  }

  getTotalUnitsForLocation(storageLocationId: string): number {
    if (!this.isLoaded) this.loadFromStorage();
    return this.records
      .filter(
        (r) =>
          r.storageLocationId === storageLocationId ||
          r.storageLocationId?.toLowerCase() === storageLocationId?.toLowerCase()
      )
      .reduce((sum, r) => sum + r.availableQty, 0);
  }

  getDistinctProductCountForLocation(storageLocationId: string): number {
    if (!this.isLoaded) this.loadFromStorage();
    const skus = new Set(
      this.records
        .filter(
          (r) =>
            (r.storageLocationId === storageLocationId ||
              r.storageLocationId?.toLowerCase() === storageLocationId?.toLowerCase()) &&
            r.availableQty > 0
        )
        .map((r) => r.sku)
    );
    return skus.size;
  }
}

export const locationStockRepository = new LocationStockRepository();

export class ReceivingEngine {
  /**
   * Filter purchase bill line items to include sellable inventory, consumables,
   * and physical fixed assets flagged for warehouse storage receiving.
   */
  filterReceivableLines(bill: PurchaseBill): PurchaseBillLine[] {
    const lines = bill.lines ?? [];
    if (lines.length === 0) return [];

    // If purchase type is inventory_product or packaging_material, all item lines are physical stock lines
    if (bill.purchaseType === "inventory_product" || bill.purchaseType === "packaging_material") {
      return lines;
    }

    // Otherwise, filter lines marked as sellable, consumable, or physical storage fixed assets
    return lines.filter((line) => {
      const intent = line.intent;
      return (
        intent === "sellable" ||
        intent === "consumable" ||
        (intent === "asset" && line.physicalStorageReceivingRequired === true)
      );
    });
  }

  /**
   * Check if a purchase bill is eligible for receiving in Storage.
   * STRICT RULE: Only bills containing Inventory Products or Consumables/Packaging are eligible.
   * Non-stock bills (Rent, Utilities, Assets, Services, Expenses) are excluded.
   */
  isBillEligibleForStorageReceiving(bill: PurchaseBill): boolean {
    if (bill.isDeleted) return false;
    if (bill.status === "void") {
      return false;
    }

    const receivableLines = this.filterReceivableLines(bill);
    if (receivableLines.length === 0) {
      return false;
    }

    // STRICT ARCHITECTURE RULE: Payment status (paid / unpaid / partial) MUST NEVER block or exclude a bill from Storage Receiving!
    // As long as the bill has unreceived physical stock (qcRecord.receivedQty < quantity), it MUST be eligible in Storage Receiving.
    return receivableLines.some((line) => {
      const received = line.qcRecord?.receivedQty ?? 0;
      return line.quantity > received;
    });
  }

  /**
   * Validate receiving input quantities
   */
  validateReceiving(input: ReceivingExecutionInput): { isValid: boolean; error?: string } {
    if (!input.allocations || input.allocations.length === 0) {
      return { isValid: false, error: "At least one item allocation is required to receive goods." };
    }

    let hasPositiveQuantity = false;

    for (const alloc of input.allocations) {
      if (alloc.receivingQty < 0) {
        return { isValid: false, error: `Receiving quantity for SKU ${alloc.sku} cannot be negative.` };
      }

      if (alloc.receivingQty > 0) {
        hasPositiveQuantity = true;
      }

      const pending = alloc.orderedQty - alloc.alreadyReceivedQty;
      if (alloc.receivingQty > pending) {
        return {
          isValid: false,
          error: `Receiving quantity (${alloc.receivingQty}) exceeds remaining pending quantity (${pending}) for ${alloc.sku}.`,
        };
      }

      if (alloc.receivingQty > 0 && !alloc.destinationLocationId) {
        return {
          isValid: false,
          error: `Please select a destination Storage Location for ${alloc.sku}.`,
        };
      }
    }

    if (!hasPositiveQuantity) {
      return { isValid: false, error: "Please enter a receiving quantity greater than 0 for at least one item." };
    }

    return { isValid: true };
  }

  /**
   * Execute full or partial receiving process
   */
  async executeReceiving(input: ReceivingExecutionInput): Promise<ReceivingExecutionResult> {
    const validation = this.validateReceiving(input);
    if (!validation.isValid) {
      throw new Error(validation.error || "Receiving validation failed.");
    }

    if (typeof window !== "undefined") {
      const lines = input.allocations
        .filter((alloc) => alloc.receivingQty > 0)
        .map((alloc) => ({
          sku: alloc.sku,
          description: alloc.description,
          expectedQty: alloc.orderedQty,
          receivedQty: alloc.receivingQty,
          damagedQty: alloc.damagedQty || 0,
          putawayLocationId: alloc.destinationLocationId,
        }));

      const payload = {
        purchaseBillId: input.billId,
        storageLocationId: input.allocations[0]?.destinationLocationId,
        receiptNumber: `GRN-${Date.now().toString(36).toUpperCase()}`,
        notes: `Goods received from Bill ${input.billId}`,
        lines,
      };

      const res = await fetch("/api/v1/storage/receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const payloadRes = await res.json();
      if (!res.ok) {
        throw new Error(payloadRes?.error || "Failed to create storage receipt.");
      }

      // Maintain client-side assets tracking locally in storageEquipmentRepository
      for (const alloc of input.allocations) {
        if (alloc.receivingQty <= 0) continue;
        const damagedQty = Math.max(0, Math.min(alloc.receivingQty, alloc.damagedQty || 0));
        const sellableQty = Math.max(0, alloc.receivingQty - damagedQty);

        if (alloc.intent === "asset" || alloc.isPhysicalAsset) {
          storageEquipmentRepository.addEquipment({
            organizationId: input.securityContext.organizationId,
            workspaceId: input.securityContext.workspaceId,
            storageLocationId: alloc.destinationLocationId,
            storageLocationName: alloc.destinationLocationName,
            subLocationId: alloc.subLocationId,
            subLocationPath: alloc.targetBin,
            purchaseBillId: input.billId,
            purchaseBillLineId: alloc.lineId,
            sku: alloc.sku,
            name: alloc.description,
            assetTag: alloc.assetTag,
            quantity: alloc.receivingQty,
            acceptedQty: sellableQty,
            damagedQty,
            status: damagedQty > 0 && sellableQty === 0 ? "damaged" : "active",
            receivedAt: new Date().toISOString(),
            receivedBy: input.securityContext.actorName || "Warehouse Staff",
          });
        }
      }

      return {
        success: true,
        billId: input.billId,
        billNumber: `BILL-${input.billId.replace(/^bill-/i, "").toUpperCase()}`,
        status: "completed",
        totalReceivedItems: input.allocations.reduce((sum, a) => sum + a.receivingQty, 0),
        activityId: `act-${Date.now().toString(36)}`,
        timestamp: new Date().toISOString(),
      };
    }

    let bill: PurchaseBill | null = null;
    if (typeof window === "undefined") {
      try {
        const { purchaseRepository } = await import("@/lib/purchase/repository");
        bill = await purchaseRepository.getBill(
          input.securityContext.organizationId,
          input.securityContext.workspaceId,
          input.billId
        );
      } catch {}
    }


    if (!bill) {
      // Fail-safe auto-recovery: Build valid PurchaseBill object from input allocations & billId
      const cleanNum = input.billId.replace(/^bill-/i, "");
      const billNumber = input.billId.toUpperCase().startsWith("BILL-")
        ? input.billId.toUpperCase()
        : `BILL-${cleanNum}`;

      bill = {
        id: input.billId,
        billNumber,
        organizationId: input.securityContext.organizationId,
        workspaceId: input.securityContext.workspaceId,
        vendorId: "vnd-default",
        vendorName: "Supplier",
        purchaseType: "inventory_product",
        category: "inventory_product",
        billDate: new Date().toISOString().slice(0, 10),
        lines: input.allocations.map((alloc) => ({
          id: alloc.lineId,
          description: alloc.description,
          quantity: alloc.orderedQty,
          unitPrice: 100,
          amount: alloc.orderedQty * 100,
          qtyDamaged: alloc.damagedQty || 0,
          uom: "pcs",
          sku: alloc.sku,
          intent: alloc.intent,
          gstRate: 18,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          taxAmount: 0,
        })),
        subtotal: 0,
        discountAmount: 0,
        taxPercent: 0,
        taxAmount: 0,
        cgstAmount: 0,
        sgstAmount: 0,
        igstAmount: 0,
        freightAmount: 0,
        otherCharges: 0,
        roundOff: 0,
        totalAmount: 0,
        status: "ordered",
        paymentStatus: "unpaid",
        paymentMethod: "credit",
        interstate: false,
        buyerStateCode: DEFAULT_BUYER_STATE_CODE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: input.securityContext.actorId || "operator",
      };
    }

    let totalReceivedInThisBatch = 0;
    const updatedLines = [...bill.lines];

    for (const alloc of input.allocations) {
      if (alloc.receivingQty <= 0) continue;

      totalReceivedInThisBatch += alloc.receivingQty;
      const damagedQty = Math.max(0, Math.min(alloc.receivingQty, alloc.damagedQty || 0));
      const sellableQty = Math.max(0, alloc.receivingQty - damagedQty);

      // Update line QC record / received quantity
      const lineIdx = updatedLines.findIndex((l) => l.id === alloc.lineId);
      if (lineIdx >= 0) {
        const existingLine = updatedLines[lineIdx]!;
        const currentReceived = existingLine.qcRecord?.receivedQty ?? 0;
        const currentDamaged = existingLine.qtyDamaged ?? 0;
        const newReceivedTotal = currentReceived + alloc.receivingQty;
        const newDamagedTotal = currentDamaged + damagedQty;

        updatedLines[lineIdx] = {
          ...existingLine,
          qtyDamaged: newDamagedTotal,
          qcStatus: newDamagedTotal > 0 ? "partially_failed" : newReceivedTotal >= existingLine.quantity ? "passed" : "pending",
          qcRecord: {
            receivedQty: newReceivedTotal,
            acceptedQty: Math.max(0, newReceivedTotal - newDamagedTotal),
            rejectedQty: newDamagedTotal,
          },
        };
      }

      // Route received physical goods based on intent
      if (alloc.intent === "asset" || alloc.isPhysicalAsset) {
        // STRICT INVENTORY ISOLATION:
        // Physical storage equipment is logged in StorageEquipmentRepository ONLY.
        // It NEVER enters LocationStockRepository, StorageStock, or Sellable ATS!
        storageEquipmentRepository.addEquipment({
          organizationId: input.securityContext.organizationId,
          workspaceId: input.securityContext.workspaceId,
          storageLocationId: alloc.destinationLocationId,
          storageLocationName: alloc.destinationLocationName,
          subLocationId: alloc.subLocationId,
          subLocationPath: alloc.targetBin,
          purchaseBillId: bill.id,
          purchaseBillLineId: alloc.lineId,
          sku: alloc.sku,
          name: alloc.description,
          assetTag: alloc.assetTag,
          quantity: alloc.receivingQty,
          acceptedQty: sellableQty,
          damagedQty,
          status: damagedQty > 0 && sellableQty === 0 ? "damaged" : "active",
          receivedAt: new Date().toISOString(),
          receivedBy: input.securityContext.actorName || "Warehouse Staff",
        });
      } else if (sellableQty > 0) {
        // Add ONLY sellable/consumable undamaged quantity to Location Stock Repository
        locationStockRepository.addStock({
          storageLocationId: alloc.destinationLocationId,
          productId: alloc.lineId,
          sku: alloc.sku,
          productName: alloc.description,
          intent: alloc.intent,
          availableQty: sellableQty,
          receivedFromBillId: bill.id,
        });
      }
    }

    // Check if ALL receivable lines in the bill are fully received
    const receivableLines = this.filterReceivableLines({ ...bill, lines: updatedLines });
    const isFullyReceived = receivableLines.every((line) => {
      const rec = line.qcRecord?.receivedQty ?? 0;
      return rec >= line.quantity;
    });

    const nextStatus = isFullyReceived ? "completed" : "partially_received";

    // Persist updated bill and GRN receipt in database
    if (typeof window !== "undefined") {
      try {
        const primaryDestLocId = input.allocations.find((a) => a.destinationLocationId)?.destinationLocationId;
        await fetch("/api/v1/storage/receipts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            purchaseBillId: input.billId,
            storageLocationId: primaryDestLocId,
            receiptNumber: `GRN-${Date.now().toString(36).toUpperCase()}`,
            lines: input.allocations.map((a) => ({
              sku: a.sku,
              description: a.description,
              expectedQty: a.orderedQty,
              receivedQty: a.receivingQty,
              damagedQty: a.damagedQty || 0,
              putawayLocationId: a.destinationLocationId,
            })),
          }),
        });
      } catch (err) {
        console.error("Failed to persist receipt in database via API:", err);
      }
    } else {
      try {
        const { purchaseRepository } = await import("@/lib/purchase/repository");
        await purchaseRepository.updateBill(
          input.securityContext.organizationId,
          input.securityContext.workspaceId,
          bill.id,
          {
            lines: updatedLines,
            status: nextStatus as any,
          }
        );
      } catch {}
    }

    // Emit domain event for decoupling
    eventBus.publish({
      type: "warehouse.receiving.completed",
      payload: {
        billId: bill.id,
        poNumber: bill.billNumber,
        isPartial: !isFullyReceived,
        totalItemsReceived: totalReceivedInThisBatch,
        actorId: input.securityContext.actorId,
      },
    });

    const activityId = `act-rec-${Date.now()}`;

    return {
      success: true,
      billId: bill.id,
      billNumber: bill.billNumber,
      status: nextStatus,
      totalReceivedItems: totalReceivedInThisBatch,
      activityId,
      timestamp: new Date().toISOString(),
    };
  }
}

export const receivingEngine = new ReceivingEngine();
