/**
 * CommerceOS V4 — Goods Received Note (GRN) Domain Engine
 * Single Source of Truth for Purchase-to-Storage Inwarding & Category Routing
 */

import { type PurchaseType } from "@/lib/purchase/types";

export type GrnStatus =
  | "draft"
  | "partially_received"
  | "completed"
  | "bypassed"
  | "cancelled";

export type GrnRoutingTarget = "STORAGE_INWARD" | "ACCOUNTING_EXPENSE_LEDGER";

export interface GrnLineItem {
  id: string;
  purchaseBillId: string;
  purchaseBillLineId: string;
  sku: string;
  description: string;
  purchaseType: PurchaseType;
  quantityOrdered: number;
  quantityAccepted: number;
  quantityDamaged: number;
  quantityPending: number;
  targetBinId?: string;
  targetBinCode?: string;
  routingTarget: GrnRoutingTarget;
  notes?: string;
}

export interface CreateGrnProps {
  id: string;
  grnNumber: string; // e.g., GRN-2026-0001
  purchaseBillId: string;
  purchaseBillNumber: string;
  vendorId: string;
  vendorName: string;
  locationId: string;
  locationName: string;
  lines: Omit<GrnLineItem, "quantityPending" | "routingTarget">[];
  receivedByActorId: string;
  receivedByActorName: string;
  createdAt?: string;
}

export class GoodsReceivedNoteEntity {
  public readonly id: string;
  public readonly grnNumber: string;
  public readonly purchaseBillId: string;
  public readonly purchaseBillNumber: string;
  public readonly vendorId: string;
  public readonly vendorName: string;
  public locationId: string;
  public locationName: string;
  public status: GrnStatus;
  public lines: GrnLineItem[];
  public readonly receivedByActorId: string;
  public readonly receivedByActorName: string;
  public readonly createdAt: string;
  public updatedAt: string;

  constructor(props: CreateGrnProps & { status?: GrnStatus; updatedAt?: string }) {
    this.id = props.id;
    this.grnNumber = props.grnNumber;
    this.purchaseBillId = props.purchaseBillId;
    this.purchaseBillNumber = props.purchaseBillNumber;
    this.vendorId = props.vendorId;
    this.vendorName = props.vendorName;
    this.locationId = props.locationId;
    this.locationName = props.locationName;
    this.receivedByActorId = props.receivedByActorId;
    this.receivedByActorName = props.receivedByActorName;
    this.createdAt = props.createdAt ?? new Date().toISOString();
    this.updatedAt = props.updatedAt ?? new Date().toISOString();

    // Route each line item according to CommerceOS Category Rules
    this.lines = props.lines.map((line) => {
      const routingTarget = GoodsReceivedNoteEntity.determineRoutingTarget(line.purchaseType);
      const pending = line.quantityOrdered - (line.quantityAccepted + line.quantityDamaged);

      return {
        ...line,
        routingTarget,
        quantityPending: Math.max(0, pending),
      };
    });

    this.status = props.status ?? this.calculateStatus();
    this.validateInvariants();
  }

  /**
   * Category Routing Engine Decision
   * SELLABLE_GOODS & CONSUMABLES -> STORAGE_INWARD
   * FIXED_ASSET & SERVICE -> ACCOUNTING_EXPENSE_LEDGER (Bypass Storage)
   */
  public static determineRoutingTarget(type: PurchaseType): GrnRoutingTarget {
    switch (type) {
      case "inventory_product": // Sellable goods
      case "packaging_material": // Consumable packaging
      case "office_expense": // Consumable office supplies
        return "STORAGE_INWARD";

      case "asset": // Fixed asset (Route to asset register/accounting)
      case "marketing":
      case "software":
      case "courier":
      case "rent":
      case "utilities":
      case "service":
      case "travel":
      case "professional_fees":
      case "other":
      default:
        return "ACCOUNTING_EXPENSE_LEDGER";
    }
  }

  private validateInvariants(): void {
    if (!this.id || !this.grnNumber) {
      throw new Error("[GoodsReceivedNoteEntity] GRN ID and Number are required.");
    }
    if (!this.purchaseBillId) {
      throw new Error("[GoodsReceivedNoteEntity] Purchase Bill ID reference is required.");
    }
  }

  /**
   * Record inward receiving for line items with QC Pass/Fail split
   */
  public recordInwardReceipt(
    lineId: string,
    qtyAccepted: number,
    qtyDamaged: number,
    targetBinId?: string,
    targetBinCode?: string
  ): void {
    const lineIndex = this.lines.findIndex((l) => l.id === lineId);
    if (lineIndex === -1) {
      throw new Error(`[GoodsReceivedNoteEntity] Line item '${lineId}' not found in GRN.`);
    }

    const line = this.lines[lineIndex];

    if (line.routingTarget === "ACCOUNTING_EXPENSE_LEDGER") {
      throw new Error(
        `[GoodsReceivedNoteEntity] Line item '${line.sku}' is a non-storage item (${line.purchaseType}) and bypasses physical inwarding.`
      );
    }

    const newAccepted = line.quantityAccepted + Math.max(0, qtyAccepted);
    const newDamaged = line.quantityDamaged + Math.max(0, qtyDamaged);
    const totalProcessed = newAccepted + newDamaged;

    if (totalProcessed > line.quantityOrdered) {
      throw new Error(
        `[GoodsReceivedNoteEntity] Cannot receive ${totalProcessed} units. Ordered quantity is ${line.quantityOrdered}.`
      );
    }

    this.lines[lineIndex] = {
      ...line,
      quantityAccepted: newAccepted,
      quantityDamaged: newDamaged,
      quantityPending: line.quantityOrdered - totalProcessed,
      targetBinId: targetBinId ?? line.targetBinId,
      targetBinCode: targetBinCode ?? line.targetBinCode,
    };

    this.updatedAt = new Date().toISOString();
    this.status = this.calculateStatus();
  }

  /**
   * Auto-calculates GRN lifecycle status
   */
  public calculateStatus(): GrnStatus {
    const storageLines = this.lines.filter((l) => l.routingTarget === "STORAGE_INWARD");

    // If all line items are non-storage items, mark as bypassed
    if (storageLines.length === 0) {
      return "bypassed";
    }

    const allCompleted = storageLines.every((l) => l.quantityPending === 0);
    const anyReceived = storageLines.some((l) => l.quantityAccepted > 0 || l.quantityDamaged > 0);

    if (allCompleted) return "completed";
    if (anyReceived) return "partially_received";
    return "draft";
  }

  public toJSON() {
    return {
      id: this.id,
      grnNumber: this.grnNumber,
      purchaseBillId: this.purchaseBillId,
      purchaseBillNumber: this.purchaseBillNumber,
      vendorId: this.vendorId,
      vendorName: this.vendorName,
      locationId: this.locationId,
      locationName: this.locationName,
      status: this.status,
      lines: [...this.lines],
      receivedByActorId: this.receivedByActorId,
      receivedByActorName: this.receivedByActorName,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
