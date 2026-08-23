import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((value) => {
      if (!value) return undefined;
      return value;
    });

const purchaseTypeSchema = z.preprocess(
  (val) => {
    if (typeof val === "string") {
      const s = val.trim().toLowerCase();
      if (
        s === "office_supplies" ||
        s === "office supplies" ||
        s === "office-supplies"
      ) {
        return "office_expense";
      }
    }
    return val;
  },
  z.enum([
    "inventory_product",
    "packaging_material",
    "office_expense",
    "asset",
    "marketing",
    "software",
    "courier",
    "rent",
    "utilities",
    "service",
    "travel",
    "professional_fees",
    "other",
  ]),
);

const purchaseStatusSchema = z.enum([
  "draft",
  "ordered",
  "received",
  "partially_received",
  "qc",
  "completed",
  "void",
]);

const vendorRegistrationTypeSchema = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((val) => {
    if (!val) return "regular";
    const l = val.toLowerCase();
    if (l.includes("composition")) return "composition";
    if (l.includes("tax_deductor") || l.includes("collector")) return "tax_deductor_collector";
    if (l.includes("unregistered")) return "unregistered";
    if (l.includes("unknown")) return "unknown";
    return "regular";
  });

export const createVendorSchema = z
  .object({
    name: z.string().trim().min(1).max(160),
    code: optionalText(60),
    vendor_code: optionalText(60),
    registrationType: vendorRegistrationTypeSchema.optional(),
    gstin: optionalText(15),
    pan: optionalText(10),
    phone: optionalText(20),
    email: z
      .string()
      .trim()
      .max(160)
      .optional()
      .or(z.literal(""))
      .transform((value) => {
        if (!value) return undefined;
        return value;
      })
      .refine(
        (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        "Invalid email",
      ),
    address: optionalText(300),
    city: optionalText(80),
    state: optionalText(80),
    pincode: optionalText(20),
    contactPerson: optionalText(120),
    businessCategory: z
      .enum([
        "product_manufacturer",
        "wholesaler",
        "packaging",
        "labels",
        "courier",
        "office_supplies",
        "marketing",
        "software",
        "professional_service",
        "utilities",
        "assets",
        "other",
      ])
      .optional(),
    rating: z.number().min(1).max(5).optional(),
    bankName: optionalText(120),
    bankAccountName: optionalText(160),
    bankAccountNumber: optionalText(40),
    bankIfsc: optionalText(20),
    paymentTermsDays: z.number().int().min(0).max(365).optional(),
    leadTimeDays: z.number().int().min(0).max(365).optional(),
    notes: optionalText(500),
  })
  .passthrough();

const optionalTextForUpdate = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((value) => {
      if (value === undefined) return undefined;
      return value.trim();
    });

export const updateVendorSchema = z
  .object({
    name: z.string().trim().min(1).max(160).optional(),
    registrationType: vendorRegistrationTypeSchema.optional(),
    gstin: optionalTextForUpdate(15),
    pan: optionalTextForUpdate(10),
    phone: optionalTextForUpdate(20),
    email: z
      .string()
      .trim()
      .max(160)
      .optional()
      .or(z.literal(""))
      .transform((value) => {
        if (value === undefined) return undefined;
        return value.trim();
      })
      .refine(
        (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        "Invalid email",
      ),
    address: optionalTextForUpdate(300),
    city: optionalTextForUpdate(80),
    state: optionalTextForUpdate(80),
    pincode: optionalTextForUpdate(20),
    contactPerson: optionalTextForUpdate(120),
    bankName: optionalTextForUpdate(120),
    bankAccountName: optionalTextForUpdate(160),
    bankAccountNumber: optionalTextForUpdate(40),
    bankIfsc: optionalTextForUpdate(20),
    paymentTermsDays: z.number().int().min(0).max(365).optional(),
    leadTimeDays: z.number().int().min(0).max(365).optional(),
    notes: optionalTextForUpdate(500),
    status: z.enum(["active", "blocked", "inactive"]).optional(),
  })
  .passthrough();

const purchaseUomSchema = z.enum([
  "pcs",
  "kg",
  "g",
  "ltr",
  "mtr",
  "box",
  "pair",
]);

const businessIntentSchema = z.enum([
  "sellable",
  "consumable",
  "asset",
  "expense",
  "service",
  "marketing",
  "freight",
  "other",
]);

const freightAllocationModeSchema = z.enum(["expense", "landed_cost"]);

const billLineSchema = z
  .object({
    description: z.string().trim().min(1).max(200),
    quantity: z.number().positive().max(1_000_000),
    unitPrice: z.number().nonnegative().max(100_000_000),
    uom: purchaseUomSchema.optional(),
    sku: optionalText(80),
    hsn: optionalText(16),
    productId: optionalText(80),
    gstRate: z.number().min(0).max(100).optional(),
    intent: businessIntentSchema.optional(),
    freightMode: freightAllocationModeSchema.optional(),
    assetCategory: optionalText(80),
    costCenter: optionalText(80),
  })
  .passthrough();

const attachmentSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    kind: z
      .enum(["bill", "tax_invoice", "po", "grn", "payment_proof", "other"])
      .optional(),
  })
  .passthrough();

export const poLineSchema = z
  .object({
    description: z.string().trim().min(1).max(200),
    quantity: z.number().positive().max(1_000_000),
    unitPrice: z.number().min(0).max(100_000_000),
    uom: purchaseUomSchema.optional(),
    sku: optionalText(80),
    hsn: optionalText(30),
    gstRate: z.number().min(0).max(100).optional(),
    productId: optionalText(80),
    intent: businessIntentSchema.optional(),
  })
  .passthrough();

export const createPurchaseOrderSchema = z
  .object({
    poNumber: optionalText(80),
    vendorId: z.string().trim().min(1),
    poDate: z.string().trim().min(8).max(12),
    expectedDeliveryDate: optionalText(12),
    deliveryWarehouseId: optionalText(80),
    warehouseCode: optionalText(80),
    deliveryWarehouseName: optionalText(120),
    currency: optionalText(10),
    paymentTerms: optionalText(60),
    vendorReference: optionalText(80),
    purchaseType: purchaseTypeSchema.optional(),
    discountAmount: z.number().min(0).max(100_000_000).optional(),
    freightAmount: z.number().min(0).max(100_000_000).optional(),
    otherCharges: z.number().min(0).max(100_000_000).optional(),
    notes: optionalText(500),
    termsAndConditions: optionalText(1000),
    internalNotes: optionalText(500),
    vendorContact: optionalText(120),
    status: z
      .enum([
        "draft",
        "pending_approval",
        "approved",
        "sent_to_vendor",
        "partially_received",
        "fully_received",
        "closed",
        "cancelled",
      ])
      .optional(),
    buyerStateCode: z.string().trim().length(2).optional(),
    lines: z.array(poLineSchema).min(1).max(100),
  })
  .passthrough();

export const createPurchaseBillSchema = z
  .object({
    vendorId: z.string().trim().min(1),
    purchaseType: purchaseTypeSchema,
    vendorInvoiceNumber: optionalText(80),
    billDate: z.string().trim().min(8).max(12),
    dueDate: optionalText(12),
    taxPercent: z.number().min(0).max(100).optional(),
    discountAmount: z.number().min(0).max(100_000_000).optional(),
    freightAmount: z.number().min(0).max(100_000_000).optional(),
    otherCharges: z.number().min(0).max(100_000_000).optional(),
    allocateFreightToLandedCost: z.boolean().optional(),
    roundOff: z.number().min(-1000).max(1000).optional(),
    poReference: optionalText(80),
    department: optionalText(80),
    costCenter: optionalText(80),
    notes: optionalText(500),
    billUploadName: optionalText(200),
    attachments: z.array(attachmentSchema).max(20).optional(),
    status: z.enum(["draft", "ordered", "completed"]).optional(),
    paymentStatus: z.enum(["unpaid", "partial", "paid"]).optional(),
    paymentMethod: z
      .enum([
        "unpaid",
        "cash",
        "upi",
        "cheque",
        "neft_rtgs",
        "card",
        "wallet",
        "credit",
      ])
      .optional(),
    paymentId: optionalText(100),
    buyerStateCode: z.string().trim().length(2).optional(),
    approvalId: optionalText(80),
    ownerOverride: z.boolean().optional(),
    lines: z.array(billLineSchema).min(1).max(100),
  })
  .passthrough();

export const transitionPurchaseBillSchema = z
  .object({
    status: purchaseStatusSchema,
  })
  .strict();

export const recordPurchasePaymentSchema = z
  .object({
    paymentMethod: z.enum([
      "cash",
      "upi",
      "cheque",
      "neft_rtgs",
      "card",
      "wallet",
      "credit",
    ]),
    paymentStatus: z.enum(["unpaid", "partial", "paid"]).optional(),
    paymentId: z.string().trim().max(120).optional(),
    amount: z.number().positive().max(100_000_000),
    paymentDate: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  })
  .strict();

export const recordPurchaseLineDamageSchema = z
  .object({
    lineId: z.string().trim().min(1),
    qtyDamaged: z.number().min(0).max(1_000_000),
  })
  .strict();

export const recordPurchaseSkuDamageSchema = z
  .object({
    stockKey: z.string().trim().min(1).max(200),
    qtyDamaged: z.number().min(0).max(1_000_000),
  })
  .strict();

export const updatePurchaseStockItemSchema = z
  .object({
    stockKey: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(200),
    sku: z.string().trim().max(80).optional(),
  })
  .strict();
