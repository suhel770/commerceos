import type { SecurityContext } from "../domain/types";
import type {
  CreateVendorExchangeInput,
  DamagedStockItemView,
  ReceiveExchangeReplacementInput,
  ScrapDamagedStockInput,
  ScrapWriteOffRecord,
  VendorExchangeRecord,
} from "./exchange.types";
import { locationStockRepository } from "./receiving.engine";

const LOCAL_STORAGE_EXCHANGE_KEY = "commerceos_vendor_exchanges_v1";
const LOCAL_STORAGE_SCRAP_KEY = "commerceos_damaged_scraps_v1";

export class VendorExchangeEngine {
  private exchanges: VendorExchangeRecord[] = [];
  private scrapRecords: ScrapWriteOffRecord[] = [];
  private isLoaded = false;

  private loadFromStorage() {
    if (typeof window === "undefined") return;
    try {
      const savedEx = localStorage.getItem(LOCAL_STORAGE_EXCHANGE_KEY);
      if (savedEx) {
        this.exchanges = JSON.parse(savedEx);
      }
      const savedSc = localStorage.getItem(LOCAL_STORAGE_SCRAP_KEY);
      if (savedSc) {
        this.scrapRecords = JSON.parse(savedSc);
      }
    } catch {
      // Ignore quota errors
    }
    this.isLoaded = true;
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(LOCAL_STORAGE_EXCHANGE_KEY, JSON.stringify(this.exchanges));
      localStorage.setItem(LOCAL_STORAGE_SCRAP_KEY, JSON.stringify(this.scrapRecords));
      window.dispatchEvent(new CustomEvent("commerceos_stock_updated"));
      window.dispatchEvent(new CustomEvent("commerceos_exchange_updated"));
      window.dispatchEvent(new CustomEvent("commerceos_scrap_updated"));
    } catch {
      // Ignore quota errors
    }
  }

  /**
   * List all vendor exchange records with optional filters
   */
  listExchanges(filter?: { billId?: string; sku?: string; status?: string }): VendorExchangeRecord[] {
    if (!this.isLoaded) this.loadFromStorage();
    let result = [...this.exchanges];
    if (filter?.billId) {
      result = result.filter((e) => e.billId === filter.billId);
    }
    if (filter?.sku) {
      result = result.filter((e) => e.sku.toLowerCase() === filter.sku?.toLowerCase());
    }
    if (filter?.status) {
      result = result.filter((e) => e.status === filter.status);
    }
    return result;
  }

  /**
   * List all scrap/destroy write-off records
   */
  listScraps(filter?: { billId?: string; sku?: string }): ScrapWriteOffRecord[] {
    if (!this.isLoaded) this.loadFromStorage();
    let result = [...this.scrapRecords];
    if (filter?.billId) {
      result = result.filter((s) => s.billId === filter.billId);
    }
    if (filter?.sku) {
      result = result.filter((s) => s.sku.toLowerCase() === filter.sku?.toLowerCase());
    }
    return result;
  }

  /**
   * Get single exchange by ID
   */
  getExchange(id: string): VendorExchangeRecord | undefined {
    if (!this.isLoaded) this.loadFromStorage();
    return this.exchanges.find((e) => e.id === id);
  }

  /**
   * Calculate total active claimed units for a specific bill line (Exchanges + Scraps)
   */
  getUnresolvedDamagedQuantity(lineId: string, originalDamagedQty: number): {
    totalDamaged: number;
    activeExchangeQty: number;
    scrappedQty: number;
    unresolvedRemaining: number;
  } {
    if (!this.isLoaded) this.loadFromStorage();
    const activeExchanges = this.exchanges.filter(
      (e) => e.lineId === lineId && e.status !== "resolved" && e.status !== "written_off" && e.status !== "scrapped"
    );
    const resolvedExchanges = this.exchanges.filter(
      (e) => e.lineId === lineId && (e.status === "resolved" || e.status === "written_off" || e.status === "scrapped")
    );
    const activeExchangeQty = activeExchanges.reduce((sum, e) => sum + e.unresolvedQty, 0);
    const resolvedExchangeQty = resolvedExchanges.reduce((sum, e) => sum + e.replacementAcceptedQty, 0);

    const scraps = this.scrapRecords.filter((s) => s.lineId === lineId);
    const scrappedQty = scraps.reduce((sum, s) => sum + s.scrappedQty, 0);

    const claimed = activeExchangeQty + resolvedExchangeQty + scrappedQty;
    const unresolvedRemaining = Math.max(0, originalDamagedQty - claimed);

    return {
      totalDamaged: originalDamagedQty,
      activeExchangeQty,
      scrappedQty,
      unresolvedRemaining,
    };
  }

  /**
   * Initiate a new Vendor Exchange request for damaged units
   */
  createExchange(input: CreateVendorExchangeInput): {
    success: boolean;
    error?: string;
    exchange?: VendorExchangeRecord;
  } {
    if (!this.isLoaded) this.loadFromStorage();

    if (input.exchangeQty <= 0) {
      return { success: false, error: "Exchange quantity must be greater than zero." };
    }

    // Policy check: NON_RETURNABLE vendor blocks exchange unless authorized override
    if (input.vendorPolicy === "NON_RETURNABLE" && !input.isAuthorizedOverride) {
      return {
        success: false,
        error: `Vendor is configured as Non-Returnable (${input.vendorName || "Vendor Policy"}). Return/Exchange is blocked. Please select Scrap / Destroy or apply Owner Authorization override.`,
      };
    }

    if (input.exchangeQty > input.originalDamagedQty) {
      return {
        success: false,
        error: `Exchange quantity (${input.exchangeQty}) cannot exceed total damaged units (${input.originalDamagedQty}).`,
      };
    }

    // Check outstanding disposition claims on the same bill line to prevent duplicate claims
    const existingExchanges = this.exchanges.filter(
      (e) => e.lineId === input.lineId && e.status !== "resolved" && e.status !== "written_off" && e.status !== "scrapped"
    );
    const alreadyExchangeClaimed = existingExchanges.reduce((sum, e) => sum + e.unresolvedQty, 0);
    const alreadyScrapped = this.scrapRecords
      .filter((s) => s.lineId === input.lineId)
      .reduce((sum, s) => sum + s.scrappedQty, 0);

    const totalClaimed = alreadyExchangeClaimed + alreadyScrapped;

    if (totalClaimed + input.exchangeQty > input.originalDamagedQty) {
      const remainingUnclaimed = Math.max(0, input.originalDamagedQty - totalClaimed);
      return {
        success: false,
        error: `Cannot claim ${input.exchangeQty} units. Only ${remainingUnclaimed} damaged units remaining available for disposition.`,
      };
    }

    const now = new Date().toISOString();
    const newExchange: VendorExchangeRecord = {
      id: `exc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      organizationId: input.securityContext.organizationId,
      workspaceId: input.securityContext.workspaceId,
      billId: input.billId,
      billNumber: input.billNumber,
      lineId: input.lineId,
      sku: input.sku,
      productName: input.productName,
      vendorId: input.vendorId || "v-default",
      vendorName: input.vendorName || "Primary Vendor",
      vendorPolicy: input.vendorPolicy,
      storageLocationId: input.storageLocationId || "LOC-0846",
      storageLocationName: input.storageLocationName || "Home Storage",
      originalReceivedQty: input.originalReceivedQty,
      originalDamagedQty: input.originalDamagedQty,
      exchangeQty: input.exchangeQty,
      replacementReceivedQty: 0,
      replacementAcceptedQty: 0,
      replacementDamagedQty: 0,
      unresolvedQty: input.exchangeQty,
      status: "awaiting_replacement",
      disposition: "vendor_exchange",
      reason: input.reason,
      notes: input.notes,
      vendorRefNumber: input.vendorRefNumber,
      expectedReplacementDate: input.expectedReplacementDate,
      createdAt: now,
      exchangeInitiatedAt: now,
      createdBy: input.securityContext.actorId || "user",
      createdByName: input.securityContext.actorName || "Admin User",
    };

    this.exchanges.unshift(newExchange);
    this.saveToStorage();

    return {
      success: true,
      exchange: newExchange,
    };
  }

  /**
   * Scrap / Destroy damaged stock with permanent inventory write-off and Finance event
   */
  scrapDamagedStock(input: ScrapDamagedStockInput): {
    success: boolean;
    error?: string;
    record?: ScrapWriteOffRecord;
  } {
    if (!this.isLoaded) this.loadFromStorage();

    if (input.scrapQty <= 0) {
      return { success: false, error: "Scrap quantity must be greater than zero." };
    }

    if (input.scrapQty > input.originalDamagedQty) {
      return {
        success: false,
        error: `Scrap quantity (${input.scrapQty}) cannot exceed total damaged units (${input.originalDamagedQty}).`,
      };
    }

    const existingExchanges = this.exchanges.filter(
      (e) => e.lineId === input.lineId && e.status !== "resolved" && e.status !== "written_off" && e.status !== "scrapped"
    );
    const alreadyExchangeClaimed = existingExchanges.reduce((sum, e) => sum + e.unresolvedQty, 0);
    const alreadyScrapped = this.scrapRecords
      .filter((s) => s.lineId === input.lineId)
      .reduce((sum, s) => sum + s.scrappedQty, 0);

    const totalClaimed = alreadyExchangeClaimed + alreadyScrapped;

    if (totalClaimed + input.scrapQty > input.originalDamagedQty) {
      const remainingUnclaimed = Math.max(0, input.originalDamagedQty - totalClaimed);
      return {
        success: false,
        error: `Cannot scrap ${input.scrapQty} units. Only ${remainingUnclaimed} damaged units remaining available for disposition.`,
      };
    }

    const now = new Date().toISOString();
    const unitCost = input.unitCost || 850;
    const totalWriteOffAmount = unitCost * input.scrapQty;
    const financeEventId = `fin-wo-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const scrapRecord: ScrapWriteOffRecord = {
      id: `scrap-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      organizationId: input.securityContext.organizationId,
      workspaceId: input.securityContext.workspaceId,
      billId: input.billId,
      billNumber: input.billNumber,
      lineId: input.lineId,
      sku: input.sku,
      productName: input.productName,
      vendorId: input.vendorId || "v-default",
      vendorName: input.vendorName || "Primary Vendor",
      storageLocationId: input.storageLocationId || "LOC-0846",
      storageLocationName: input.storageLocationName || "Home Storage",
      scrappedQty: input.scrapQty,
      unitCost,
      totalWriteOffAmount,
      damageReason: input.damageReason,
      disposalReason: input.disposalReason,
      disposalMethod: input.disposalMethod || "Hazardous / Scrap Disposal",
      notes: input.notes,
      financeEventId,
      financeStatus: "posted_write_off",
      createdAt: now,
      createdBy: input.securityContext.actorId || "user",
      createdByName: input.securityContext.actorName || "Admin User",
    };

    this.scrapRecords.unshift(scrapRecord);
    this.saveToStorage();

    return {
      success: true,
      record: scrapRecord,
    };
  }

  /**
   * Receive replacement goods from vendor, execute replacement QC, and update inventory atomically
   */
  receiveReplacement(input: ReceiveExchangeReplacementInput): {
    success: boolean;
    error?: string;
    exchange?: VendorExchangeRecord;
    acceptedAddedToAvailable: number;
    remainingUnresolvedDamaged: number;
  } {
    if (!this.isLoaded) this.loadFromStorage();

    const exchange = this.exchanges.find((e) => e.id === input.exchangeId);
    if (!exchange) {
      return {
        success: false,
        error: `Exchange record ${input.exchangeId} not found.`,
        acceptedAddedToAvailable: 0,
        remainingUnresolvedDamaged: 0,
      };
    }

    if (exchange.status === "resolved" || exchange.unresolvedQty <= 0) {
      return {
        success: false,
        error: "This exchange is already fully resolved. Cannot receive duplicate replacements.",
        acceptedAddedToAvailable: 0,
        remainingUnresolvedDamaged: 0,
      };
    }

    const totalProcessed = input.acceptedQty + input.damagedQty;
    if (totalProcessed <= 0) {
      return {
        success: false,
        error: "Replacement inspection total (Accepted + Damaged) must be greater than zero.",
        acceptedAddedToAvailable: 0,
        remainingUnresolvedDamaged: exchange.unresolvedQty,
      };
    }

    if (totalProcessed > exchange.unresolvedQty) {
      return {
        success: false,
        error: `Total received (${totalProcessed}) exceeds outstanding exchange balance (${exchange.unresolvedQty}).`,
        acceptedAddedToAvailable: 0,
        remainingUnresolvedDamaged: exchange.unresolvedQty,
      };
    }

    const now = new Date().toISOString();

    // 1. Credit ONLY Accepted (QC Passed) units into Available Storage Stock
    if (input.acceptedQty > 0) {
      locationStockRepository.addStock({
        storageLocationId: input.storageLocationId || exchange.storageLocationId,
        productId: exchange.lineId,
        sku: exchange.sku,
        productName: exchange.productName,
        intent: "sellable",
        availableQty: input.acceptedQty,
        receivedFromBillId: exchange.billId,
      });
    }

    // 2. Update Exchange Record Quantities
    exchange.replacementReceivedQty += totalProcessed;
    exchange.replacementAcceptedQty += input.acceptedQty;
    exchange.replacementDamagedQty += input.damagedQty;
    exchange.unresolvedQty = Math.max(0, exchange.exchangeQty - exchange.replacementAcceptedQty);

    if (exchange.unresolvedQty === 0) {
      exchange.status = "resolved";
      exchange.resolvedAt = now;
      exchange.resolvedBy = input.securityContext.actorId;
      exchange.resolvedByName = input.securityContext.actorName;
    } else {
      exchange.status = "awaiting_replacement";
    }

    exchange.replacementReceivedAt = now;
    if (input.notes) {
      exchange.notes = exchange.notes
        ? `${exchange.notes}\n[Replacement Note]: ${input.notes}`
        : `[Replacement Note]: ${input.notes}`;
    }

    this.saveToStorage();

    return {
      success: true,
      exchange,
      acceptedAddedToAvailable: input.acceptedQty,
      remainingUnresolvedDamaged: exchange.unresolvedQty,
    };
  }

  /**
   * Scraps / Writes off unexchangeable damaged units with audit reason
   */
  writeOffDamaged(input: {
    exchangeId?: string;
    billId: string;
    lineId: string;
    sku: string;
    productName: string;
    writeOffQty: number;
    reason: string;
    securityContext: SecurityContext;
  }): { success: boolean; error?: string } {
    if (!this.isLoaded) this.loadFromStorage();

    if (input.exchangeId) {
      const exchange = this.exchanges.find((e) => e.id === input.exchangeId);
      if (exchange) {
        exchange.status = "written_off";
        exchange.resolvedAt = new Date().toISOString();
        exchange.resolvedBy = input.securityContext.actorId;
        exchange.resolvedByName = input.securityContext.actorName;
        exchange.notes = exchange.notes
          ? `${exchange.notes}\n[Write-off]: ${input.reason}`
          : `[Write-off]: ${input.reason}`;
        this.saveToStorage();
      }
    }

    return { success: true };
  }
}

export const vendorExchangeEngine = new VendorExchangeEngine();

