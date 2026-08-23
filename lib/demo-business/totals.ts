import {
  DEFAULT_BUYER_STATE_CODE,
  isInterstateSupply,
  splitGst,
} from "@/lib/purchase/gst";
import type {
  BusinessIntent,
  PaymentMethod,
  PaymentStatus,
  PurchaseAttachment,
  PurchaseBill,
  PurchaseBillLine,
  PurchaseStatus,
  PurchaseType,
  Vendor,
} from "@/lib/purchase/types";

import { DEMO_BUSINESS } from "./business";
import { DEMO_ORG_ID, DEMO_WS_ID } from "./ids";
import { resolveIntentFromPurchaseType } from "@/lib/purchase/routing";

export type DraftLine = {
  description: string;
  quantity: number;
  unitPrice: number;
  gstRate: number;
  uom?: "pcs" | "kg" | "g" | "ltr" | "mtr" | "box" | "pair";
  sku?: string;
  hsn?: string;
  productId?: string;
  /** Optional purchase-linked damage for demo realism */
  qtyDamaged?: number;
  /** Override the business intent inferred from purchaseType */
  intent?: BusinessIntent;
};

export type BuildBillInput = {
  id: string;
  billNumber: string;
  vendorInvoiceNumber?: string;
  vendor: Vendor;
  purchaseType: PurchaseType;
  billDate: string;
  dueDate?: string;
  lines: DraftLine[];
  discountAmount?: number;
  freightAmount?: number;
  otherCharges?: number;
  status?: PurchaseStatus;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  billUploadName?: string;
  createdAt?: string;
};

export function buildBill(input: BuildBillInput): PurchaseBill {
  const buyerStateCode = DEMO_BUSINESS.buyerStateCode || DEFAULT_BUYER_STATE_CODE;
  const interstate = isInterstateSupply(input.vendor.gstin, buyerStateCode);
  const discountAmount = input.discountAmount ?? 0;
  const freightAmount = input.freightAmount ?? 0;
  const otherCharges = input.otherCharges ?? 0;

  const gross = input.lines.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0,
  );
  const discountRatio = gross > 0 ? Math.min(1, discountAmount / gross) : 0;

  let subtotal = 0;
  let taxAmount = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;
  let weightedRate = 0;

  const lines: PurchaseBillLine[] = input.lines.map((line, index) => {
    const amount = Number((line.quantity * line.unitPrice).toFixed(2));
    const taxable = Number((amount * (1 - discountRatio)).toFixed(2));
    const split = splitGst({
      taxable,
      gstRate: line.gstRate,
      interstate,
    });
    subtotal += amount;
    taxAmount += split.taxAmount;
    cgstAmount += split.cgstAmount;
    sgstAmount += split.sgstAmount;
    igstAmount += split.igstAmount;
    weightedRate += split.gstRate * taxable;
    const qtyDamaged = Math.min(
      Math.max(0, line.qtyDamaged ?? 0),
      line.quantity,
    );

    return {
      id: `${input.id}-ln-${index + 1}`,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      amount,
      qtyDamaged,
      uom: line.uom ?? "pcs",
      sku: line.sku,
      hsn: line.hsn,
      productId: line.productId,
      gstRate: split.gstRate,
      cgstAmount: split.cgstAmount,
      sgstAmount: split.sgstAmount,
      igstAmount: split.igstAmount,
      taxAmount: split.taxAmount,
      intent: line.intent ?? resolveIntentFromPurchaseType(input.purchaseType),
    };
  });

  const taxableBase = Number((subtotal - discountAmount).toFixed(2));
  const taxPercent =
    taxableBase > 0 ? Number((weightedRate / taxableBase).toFixed(2)) : 0;
  const beforeRound =
    taxableBase + taxAmount + freightAmount + otherCharges;
  const totalAmount = Math.round(beforeRound);
  const roundOff = Number((totalAmount - beforeRound).toFixed(2));

  const status = input.status ?? "completed";
  const paymentStatus = input.paymentStatus ?? "paid";
  const paymentMethod = input.paymentMethod ?? "neft_rtgs";
  const createdAt =
    input.createdAt ?? `${input.billDate}T10:00:00.000Z`;

  const attachments: PurchaseAttachment[] = input.billUploadName
    ? [
        {
          id: `${input.id}-att-1`,
          name: input.billUploadName,
          kind: "tax_invoice",
        },
      ]
    : [];

  return {
    id: input.id,
    organizationId: DEMO_ORG_ID,
    workspaceId: DEMO_WS_ID,
    billNumber: input.billNumber,
    vendorInvoiceNumber: input.vendorInvoiceNumber,
    vendorId: input.vendor.id,
    vendorName: input.vendor.name,
    purchaseType: input.purchaseType,
    category: input.purchaseType,
    status,
    paymentStatus,
    paymentMethod,
    billDate: input.billDate,
    dueDate: input.dueDate,
    lines,
    subtotal: Number(subtotal.toFixed(2)),
    discountAmount,
    taxPercent,
    taxAmount: Number(taxAmount.toFixed(2)),
    cgstAmount: Number(cgstAmount.toFixed(2)),
    sgstAmount: Number(sgstAmount.toFixed(2)),
    igstAmount: Number(igstAmount.toFixed(2)),
    freightAmount,
    otherCharges,
    roundOff,
    totalAmount,
    interstate,
    buyerStateCode,
    notes: input.notes,
    billUploadName: input.billUploadName,
    attachments,
    createdAt,
    updatedAt: createdAt,
    createdBy: "user-owner",
  };
}

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function monthStart(year: number, monthIndex0: number): string {
  const m = String(monthIndex0 + 1).padStart(2, "0");
  return `${year}-${m}-01`;
}
