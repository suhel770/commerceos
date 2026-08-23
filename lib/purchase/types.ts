export type PurchaseType =
  | "inventory_product"
  | "packaging_material"
  | "office_expense"
  | "asset"
  | "marketing"
  | "software"
  | "courier"
  | "rent"
  | "utilities"
  | "service"
  | "travel"
  | "professional_fees"
  | "other";

/** @deprecated Use PurchaseType */
export type PurchaseCategory = PurchaseType;

export type VendorStatus = "active" | "blocked" | "inactive";

export type VendorRegistrationType =
  | "regular"
  | "composition"
  | "tax_deductor_collector"
  | "unregistered"
  | "unknown";

export type PurchaseStatus =
  | "draft"
  | "ordered"
  | "received"
  | "partially_received"
  | "qc"
  | "completed"
  | "void";

/** @deprecated Use PurchaseStatus */
export type PurchaseBillStatus = PurchaseStatus;

export type PaymentStatus = "unpaid" | "partial" | "paid";

export type PaymentMethod =
  | "unpaid"
  | "cash"
  | "upi"
  | "cheque"
  | "neft_rtgs"
  | "card"
  | "wallet"
  | "credit";

export type PurchaseAttachmentKind =
  | "bill"
  | "tax_invoice"
  | "po"
  | "grn"
  | "payment_proof"
  | "other";

export type PurchaseAttachment = {
  id: string;
  name: string;
  kind: PurchaseAttachmentKind;
};

export type PurchaseRoutePlane =
  | "warehouse_inventory"
  | "finance_expense"
  | "asset_register";

export type VendorBusinessCategory =
  | "product_manufacturer"
  | "wholesaler"
  | "packaging"
  | "labels"
  | "courier"
  | "office_supplies"
  | "marketing"
  | "software"
  | "professional_service"
  | "utilities"
  | "assets"
  | "other";

export type Vendor = {
  id: string;
  /** Server-generated stable Vendor Code e.g. VEN-00000125 */
  code?: string;
  organizationId: string;
  workspaceId: string;
  name: string;
  registrationType: VendorRegistrationType;
  gstin?: string;
  pan?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  contactPerson?: string;
  businessCategory?: VendorBusinessCategory;
  /** 1–5 vendor reliability score */
  rating?: number;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  paymentTermsDays: number;
  leadTimeDays: number;
  notes?: string;
  defaultPurchaseIntent?: BusinessIntent;
  allowedPurchaseIntents?: BusinessIntent[];
  status: VendorStatus;
  createdAt: string;
  updatedAt: string;
};

/**
 * Returns human-readable permanent Vendor Code (e.g. VEN-00000125).
 * Falls back deterministically if code is missing on legacy records.
 */
export function getVendorCode(vendor: { id: string; code?: string } | null | undefined): string {
  if (!vendor) return "VEN-00000000";
  if (vendor.code && vendor.code.trim().length > 0) {
    return vendor.code.trim().toUpperCase();
  }
  const idStr = vendor.id.replace(/^ven-/i, "").trim();
  if (/^\d+$/.test(idStr)) {
    return `VEN-${idStr.padStart(8, "0")}`;
  }
  // Deterministic alphanumeric code mapping
  let hash = 0;
  for (let i = 0; i < vendor.id.length; i++) {
    hash = (hash << 5) - hash + vendor.id.charCodeAt(i);
    hash |= 0;
  }
  const num = (Math.abs(hash) % 999999) + 1;
  return `VEN-${String(num).padStart(8, "0")}`;
}

export type VendorWithStats = Vendor & {
  outstandingBalance: number;
  purchaseCount: number;
  openPurchaseCount: number;
  totalPurchaseAmount?: number;
  totalExpenseAmount?: number;
};

/** Unit of measure on purchase lines */
export type PurchaseUom = "pcs" | "kg" | "g" | "ltr" | "mtr" | "box" | "pair";

export const PURCHASE_UOM_OPTIONS: Array<{ value: PurchaseUom; label: string }> =
  [
    { value: "pcs", label: "Pcs" },
    { value: "kg", label: "Kg" },
    { value: "g", label: "Gms" },
    { value: "ltr", label: "Ltr" },
    { value: "mtr", label: "Mtr" },
    { value: "box", label: "Box" },
    { value: "pair", label: "Pair" },
  ];

/** Business Intent of a line item in Universal Purchase Architecture v2 */
export type BusinessIntent =
  | "sellable"
  | "consumable"
  | "asset"
  | "expense"
  | "service"
  | "marketing"
  | "freight"
  | "other";

export type FreightAllocationMode = "expense" | "landed_cost";

export type LineQCStatus =
  | "pending"
  | "passed"
  | "failed"
  | "partially_failed"
  | "not_applicable";

export type LineQCReason =
  | "transit_damage"
  | "defect"
  | "wrong_product"
  | "missing_qty"
  | "wrong_variant"
  | "other";

export type LineQCRecord = {
  receivedQty: number;
  acceptedQty: number;
  rejectedQty: number;
  reason?: LineQCReason;
  notes?: string;
};

export type PurchaseLineItemType =
  | "SELLABLE_GOODS"
  | "CONSUMABLES"
  | "FIXED_ASSET"
  | "SERVICE";

export const PURCHASE_LINE_ITEM_TYPE_LABELS: Record<PurchaseLineItemType, string> = {
  SELLABLE_GOODS: "SELLABLE_GOODS (Trading Stock)",
  CONSUMABLES: "CONSUMABLES (Tape, Boxes, Labels)",
  FIXED_ASSET: "FIXED_ASSET (Laptops, Printers, Racks)",
  SERVICE: "SERVICE (Freight, Rent, Labour)",
};

export const PURCHASE_LINE_ITEM_TYPE_OPTIONS: Array<{
  value: PurchaseLineItemType;
  label: string;
}> = [
  { value: "SELLABLE_GOODS", label: "SELLABLE_GOODS (Trading Stock)" },
  { value: "CONSUMABLES", label: "CONSUMABLES (Packaging / Tape / Boxes)" },
  { value: "FIXED_ASSET", label: "FIXED_ASSET (Laptops / Racks / Assets)" },
  { value: "SERVICE", label: "SERVICE (Freight / Rent / Services)" },
];

export function lineItemTypeToIntent(itemType: PurchaseLineItemType): BusinessIntent {
  switch (itemType) {
    case "SELLABLE_GOODS":
      return "sellable";
    case "CONSUMABLES":
      return "consumable";
    case "FIXED_ASSET":
      return "asset";
    case "SERVICE":
      return "service";
  }
}

export function intentToLineItemType(intent: BusinessIntent): PurchaseLineItemType {
  switch (intent) {
    case "sellable":
      return "SELLABLE_GOODS";
    case "consumable":
      return "CONSUMABLES";
    case "asset":
      return "FIXED_ASSET";
    case "service":
    case "expense":
    case "marketing":
    case "freight":
    case "other":
    default:
      return "SERVICE";
  }
}

export type GrnInwardingStatus =
  | "pending_inwarding"
  | "partially_inwarded"
  | "inward_complete"
  | "bypassed_asset_expense";

export const GRN_INWARDING_STATUS_LABELS: Record<GrnInwardingStatus, string> = {
  pending_inwarding: "Pending Inwarding",
  partially_inwarded: "Partially Inwarded",
  inward_complete: "Inward Complete",
  bypassed_asset_expense: "Bypassed - Asset/Expense",
};

export function computeGrnInwardingStatus(bill: PurchaseBill): GrnInwardingStatus {
  const lines = bill.lines ?? [];
  const stockLines = lines.filter(
    (l) =>
      l.intent === "sellable" ||
      l.intent === "consumable" ||
      (l.intent === "asset" && l.physicalStorageReceivingRequired === true),
  );

  if (stockLines.length === 0) {
    return "bypassed_asset_expense";
  }

  let totalOrdered = 0;
  let totalReceived = 0;

  for (const line of stockLines) {
    totalOrdered += line.quantity;
    totalReceived += line.qcRecord?.receivedQty ?? 0;
  }

  if (totalReceived >= totalOrdered && totalOrdered > 0) {
    return "inward_complete";
  }
  if (totalReceived > 0) {
    return "partially_inwarded";
  }
  return "pending_inwarding";
}

export type PurchaseBillLine = {
  id: string;
  /** Display / item name */
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  /**
   * Purchase-linked damage qty (not Inventory engine).
   * Sellable from purchase = max(0, quantity - qtyDamaged).
   */
  qtyDamaged: number;
  /** Unit of measure — pcs, kg, g, etc. */
  uom: PurchaseUom;
  sku?: string;
  hsn?: string;
  productId?: string;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  /** Universal Purchase Architecture v2 Line Item Intent */
  intent: BusinessIntent;
  lineItemType?: PurchaseLineItemType;
  /** Optional physical warehouse receiving flag for FIXED_ASSET items */
  physicalStorageReceivingRequired?: boolean;
  freightMode?: FreightAllocationMode;
  qcStatus?: LineQCStatus;
  qcRecord?: LineQCRecord;
};

export type PurchaseBill = {
  id: string;
  organizationId: string;
  workspaceId: string;
  billNumber: string;
  poNumber?: string;
  poReference?: string;
  vendorInvoiceNumber?: string;
  vendorId: string;
  vendorName: string;
  purchaseType: PurchaseType;
  /** Alias for purchaseType — kept for gradual UI migration */
  category: PurchaseType;
  status: PurchaseStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  /** UTR / cheque no / UPI ref / transaction id when payment was recorded */
  paymentId?: string;
  /** Cumulative amount paid against this bill */
  amountPaid?: number;
  /** Date of the latest recorded payment (YYYY-MM-DD) */
  paymentDate?: string;
  instantSettlement?: boolean;
  billDate: string;
  dueDate?: string;
  lines: PurchaseBillLine[];
  subtotal: number;
  discountAmount: number;
  /** Weighted / display average GST % across lines */
  taxPercent: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  freightAmount: number;
  otherCharges: number;
  roundOff: number;
  totalAmount: number;
  interstate: boolean;
  /** Buyer (your business) state from your GSTIN — drives CGST+SGST vs IGST */
  buyerStateCode: string;
  /** Snapshot of your GSTIN at bill create time */
  buyerGstin?: string;
  notes?: string;
  billUploadName?: string;
  attachments?: PurchaseAttachment[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  isDeleted?: boolean;
  deletedAt?: string;
  deletedBy?: string;
  deletedByName?: string;
};

export type CreateVendorInput = {
  name: string;
  registrationType?: VendorRegistrationType;
  gstin?: string;
  pan?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  contactPerson?: string;
  businessCategory?: VendorBusinessCategory;
  rating?: number;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  paymentTermsDays?: number;
  leadTimeDays?: number;
  notes?: string;
  defaultPurchaseIntent?: BusinessIntent;
  allowedPurchaseIntents?: BusinessIntent[];
};

export type CreatePurchaseBillInput = {
  vendorId: string;
  purchaseType: PurchaseType;
  poNumber?: string;
  poReference?: string;
  instantSettlement?: boolean;
  vendorInvoiceNumber?: string;
  billDate: string;
  dueDate?: string;
  taxPercent?: number;
  discountAmount?: number;
  freightAmount?: number;
  otherCharges?: number;
  roundOff?: number;
  notes?: string;
  billUploadName?: string;
  attachments?: Array<{ name: string; kind?: PurchaseAttachmentKind }>;
  status?: Extract<PurchaseStatus, "draft" | "ordered" | "completed">;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod;
  paymentId?: string;
  /** Optional override; server prefers business profile GSTIN state */
  buyerStateCode?: string;
  createdBy?: string;
  createdByName?: string;
  approvalId?: string;
  ownerOverride?: boolean;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    uom?: PurchaseUom;
    sku?: string;
    hsn?: string;
    productId?: string;
    gstRate?: number;
    intent?: BusinessIntent;
    lineItemType?: PurchaseLineItemType;
    physicalStorageReceivingRequired?: boolean;
    freightMode?: FreightAllocationMode;
  }>;
};

export const BUSINESS_INTENT_LABELS: Record<BusinessIntent, string> = {
  sellable: "Sellable Goods",
  consumable: "Consumable Goods (Packaging)",
  asset: "Capital Asset",
  expense: "Operational Expense",
  service: "Service / Professional",
  marketing: "Marketing",
  freight: "Freight / Transport",
  other: "Other Charges",
};

export const ALL_BUSINESS_INTENTS = Object.keys(
  BUSINESS_INTENT_LABELS,
) as BusinessIntent[];

export type PurchaseBillListFilter = {
  purchaseType?: PurchaseType;
  /** @deprecated use purchaseType */
  category?: PurchaseType;
  vendorId?: string;
  status?: PurchaseStatus;
  paymentStatus?: PaymentStatus;
  search?: string;
  deletedOnly?: boolean;
  includeDeleted?: boolean;
};

export type TransitionPurchaseStatusInput = {
  status: PurchaseStatus;
};

export const PURCHASE_TYPE_LABELS: Record<PurchaseType, string> = {
  inventory_product: "Inventory Products",
  packaging_material: "Packaging Material",
  office_expense: "Office Supplies",
  asset: "Asset",
  marketing: "Marketing",
  software: "Software",
  courier: "Courier",
  rent: "Rent",
  utilities: "Utilities",
  service: "Service",
  travel: "Travel",
  professional_fees: "Professional Fees",
  other: "Other",
};

/** @deprecated Use PURCHASE_TYPE_LABELS */
export const PURCHASE_CATEGORY_LABELS = PURCHASE_TYPE_LABELS;

export const PURCHASE_STATUS_LABELS: Record<PurchaseStatus, string> = {
  draft: "Draft",
  ordered: "Ordered",
  received: "Received",
  partially_received: "Partially Received",
  qc: "QC",
  completed: "Completed",
  void: "Void",
};

/** @deprecated Use PURCHASE_STATUS_LABELS */
export const BILL_STATUS_LABELS = PURCHASE_STATUS_LABELS;

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partially Paid",
  paid: "Paid",
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  unpaid: "Pay later / Credit",
  cash: "Cash",
  upi: "UPI",
  cheque: "Cheque",
  neft_rtgs: "NEFT / RTGS",
  card: "Card",
  wallet: "Wallet",
  credit: "Vendor credit note",
};

export const VENDOR_REGISTRATION_TYPE_LABELS: Record<
  VendorRegistrationType,
  string
> = {
  regular: "Regular (With GST)",
  composition: "Composition (With GST)",
  tax_deductor_collector: "Tax Deductor/Tax Collector (With GST)",
  unregistered: "Unregistered (Without GST)",
  unknown: "Unknown (Without GST)",
};

export const ALL_VENDOR_REGISTRATION_TYPES = Object.keys(
  VENDOR_REGISTRATION_TYPE_LABELS,
) as VendorRegistrationType[];

export function vendorRequiresGstin(
  registrationType: VendorRegistrationType,
): boolean {
  return (
    registrationType === "regular" ||
    registrationType === "composition" ||
    registrationType === "tax_deductor_collector"
  );
}

export const ALL_PURCHASE_TYPES = Object.keys(
  PURCHASE_TYPE_LABELS,
) as PurchaseType[];

/** Cumulative paid amount with legacy fallback for partial bills. */
export function billAmountPaid(bill: PurchaseBill): number {
  if (typeof bill.amountPaid === "number" && Number.isFinite(bill.amountPaid)) {
    return Math.max(0, Math.min(bill.totalAmount, bill.amountPaid));
  }
  if (bill.paymentStatus === "paid") return bill.totalAmount;
  if (bill.paymentStatus === "partial") {
    return Number((bill.totalAmount * 0.5).toFixed(2));
  }
  return 0;
}

/** Remaining payable amount. */
export function billPendingAmount(bill: PurchaseBill): number {
  return Number(Math.max(0, bill.totalAmount - billAmountPaid(bill)).toFixed(2));
}

export class PurchaseNotFoundError extends Error {
  readonly code = "PURCHASE_NOT_FOUND";

  constructor(message: string) {
    super(message);
    this.name = "PurchaseNotFoundError";
  }
}

export class PurchaseError extends Error {
  readonly code = "PURCHASE_ERROR";

  constructor(message: string) {
    super(message);
    this.name = "PurchaseError";
  }
}

export type VendorStatusChangeAudit = {
  id: string;
  organizationId: string;
  workspaceId: string;
  vendorId: string;
  previousStatus: VendorStatus;
  newStatus: VendorStatus;
  reason: string;
  changedBy: string;
  changedByName?: string;
  createdAt: string;
};

export type VendorApprovalStatus = "pending" | "approved" | "rejected";

export type VendorApprovalRequest = {
  id: string;
  organizationId: string;
  workspaceId: string;
  vendorId: string;
  requestedBy: string;
  requestedByName?: string;
  reason: string;
  amount?: number;
  purchaseType?: string;
  status: VendorApprovalStatus;
  approvedBy?: string;
  approvedByName?: string;
  rejectedBy?: string;
  rejectedByName?: string;
  rejectionReason?: string;
  createdAt: string;
  decidedAt?: string;
  purchaseBillId?: string;
};

export function isVendorPurchasable(status: VendorStatus): boolean {
  return status === "active";
}

export function getVendorStatusBadgeStyle(status: VendorStatus): {
  label: string;
  className: string;
} {
  switch (status) {
    case "active":
      return {
        label: "ACTIVE",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
      };
    case "blocked":
      return {
        label: "BLOCKED",
        className: "bg-rose-50 text-rose-700 border-rose-200 font-black tracking-wide",
      };
    case "inactive":
      return {
        label: "INACTIVE",
        className: "bg-slate-100 text-slate-600 border-slate-200 font-semibold",
      };
    default:
      return {
        label: "ACTIVE",
        className: "bg-emerald-50 text-emerald-700 border-emerald-200 font-bold",
      };
  }
}

export type PurchaseOrderStatus =
  | "draft"
  | "pending_approval"
  | "approved"
  | "sent_to_vendor"
  | "partially_received"
  | "fully_received"
  | "closed"
  | "cancelled";

export const PO_STATUS_LABELS: Record<PurchaseOrderStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending Approval",
  approved: "Approved",
  sent_to_vendor: "Sent to Vendor",
  partially_received: "Partially Received",
  fully_received: "Fully Received",
  closed: "Closed",
  cancelled: "Cancelled",
};

export const PAYMENT_TERMS_OPTIONS = [
  { value: "Advance", label: "Advance" },
  { value: "Net 7", label: "Net 7 Days" },
  { value: "Net 15", label: "Net 15 Days" },
  { value: "Net 30", label: "Net 30 Days" },
  { value: "Net 45", label: "Net 45 Days" },
  { value: "COD", label: "Cash On Delivery (COD)" },
  { value: "Custom", label: "Custom Terms" },
];

export type PurchaseOrderLine = {
  id: string;
  poId: string;
  description: string;
  quantity: number;
  receivedQty?: number;
  billedQty?: number;
  unitPrice: number;
  amount: number;
  uom: PurchaseUom;
  sku?: string;
  hsn?: string;
  productId?: string;
  gstRate: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  taxAmount: number;
  intent?: BusinessIntent;
};

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  poDate: string;
  expectedDeliveryDate?: string;
  deliveryWarehouseId?: string;
  warehouseCode?: string;
  deliveryWarehouseName?: string;
  currency: string;
  paymentTerms: string;
  vendorReference?: string;
  organizationId: string;
  workspaceId: string;
  vendorId: string;
  vendorName: string;
  purchaseType: PurchaseType;
  status: PurchaseOrderStatus;
  subtotal: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  freightAmount: number;
  otherCharges: number;
  roundOff: number;
  totalAmount: number;
  interstate: boolean;
  buyerStateCode: string;
  notes?: string;
  termsAndConditions?: string;
  internalNotes?: string;
  vendorContact?: string;
  createdBy: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  isDeleted: boolean;
  lines: PurchaseOrderLine[];
  createdAt: string;
  updatedAt: string;
};

export type CreatePurchaseOrderInput = {
  poNumber?: string;
  poDate: string;
  expectedDeliveryDate?: string;
  deliveryWarehouseId?: string;
  warehouseCode?: string;
  deliveryWarehouseName?: string;
  currency?: string;
  paymentTerms?: string;
  vendorReference?: string;
  vendorId: string;
  purchaseType?: PurchaseType;
  discountAmount?: number;
  freightAmount?: number;
  otherCharges?: number;
  notes?: string;
  termsAndConditions?: string;
  internalNotes?: string;
  vendorContact?: string;
  status?: PurchaseOrderStatus;
  buyerStateCode?: string;
  lines: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    uom?: PurchaseUom;
    sku?: string;
    hsn?: string;
    gstRate?: number;
    productId?: string;
    intent?: BusinessIntent;
  }>;
};

