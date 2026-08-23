import { z } from "zod";

const orderLineSchema = z
  .object({
    productId: z.string().trim().min(1),
    sku: z.string().trim().min(1).max(80),
    productName: z.string().trim().min(1).max(200),
    quantity: z.number().int().positive(),
    unitPrice: z.number().nonnegative(),
  })
  .strict();

export const createOrderSchema = z
  .object({
    channel: z.string().trim().min(1).max(80),
    externalOrderId: z.string().trim().min(1).max(120).optional(),
    paymentStatus: z.enum(["pending", "paid", "failed"]).optional(),
    lines: z.array(orderLineSchema).min(1).max(50),
  })
  .strict();

export const cancelOrderSchema = z
  .object({
    reason: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const holdOrderSchema = z
  .object({
    reason: z
      .enum([
        "inventory_issue",
        "fraud_check",
        "payment_issue",
        "customer_request",
        "marketplace_issue",
        "manual_review",
        "other",
      ])
      .optional(),
    note: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const reserveOrderSchema = z.object({}).strict();

export const allocateOrderSchema = z.object({}).strict();

export const shipOrderSchema = z
  .object({
    courier: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

export const advanceTrackingSchema = z
  .object({
    trackingStatus: z.enum(["in_transit", "out_for_delivery"]),
  })
  .strict();

export const failedAttemptSchema = z
  .object({
    reason: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const initiateRtoSchema = z
  .object({
    reason: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const failQcSchema = z
  .object({
    reason: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const openReturnSchema = z
  .object({
    kind: z.enum(["return", "rto"]).optional(),
    reason: z.string().trim().min(1).max(200),
  })
  .strict();

export const disposeReturnSchema = z
  .object({
    disposition: z.enum(["restock", "refurbish", "scrap"]),
  })
  .strict();

export const addNoteSchema = z
  .object({
    body: z.string().trim().min(1).max(2000),
  })
  .strict();

export const addClaimSchema = z
  .object({
    type: z.enum([
      "empty_box",
      "wrong_item",
      "courier_damage",
      "lost_shipment",
      "fake_return",
      "weight_difference",
      "damaged",
      "missing_item",
    ]),
    note: z.string().trim().min(1).max(500).optional(),
    evidence: z.array(z.string().trim().min(1).max(200)).max(10).optional(),
  })
  .strict();

export const generateDocumentSchema = z
  .object({
    type: z.enum([
      "shipping_label",
      "invoice",
      "tax_invoice",
      "packing_slip",
      "manifest",
      "return_label",
      "replacement_label",
      "credit_note",
      "claim_document",
      "return_receipt",
    ]),
  })
  .strict();

export const createShipmentSchema = z
  .object({
    lines: z
      .array(
        z
          .object({
            lineId: z.string().trim().min(1),
            quantity: z.number().int().positive(),
          })
          .strict(),
      )
      .min(1)
      .max(100),
    warehouseId: z.string().trim().min(1).max(80).optional(),
    courier: z.string().trim().min(1).max(80).optional(),
  })
  .strict();

export const advanceShipmentEventSchema = z
  .object({
    event: z.enum([
      "label_generated",
      "label_printed",
      "manifest_generated",
      "pickup_requested",
      "pickup_completed",
      "in_transit",
      "out_for_delivery",
      "delivery_attempt_failed",
      "delivered",
      "rto_expected",
      "rto_in_transit",
      "rto_completed",
    ]),
    note: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export const bulkOrdersSchema = z
  .object({
    orderIds: z.array(z.string().trim().min(1)).min(1).max(200),
    action: z.enum([
      "confirm",
      "accept",
      "reserve",
      "allocate",
      "pick",
      "pack",
      "ship",
      "cancel",
      "hold",
      "release_hold",
      "generate_labels",
      "print_labels",
      "generate_invoice",
      "export",
      "print_pick_list",
      "generate_manifest",
      "mark_packed",
      "mark_shipped",
    ]),
    reason: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export type CreateOrderBody = z.infer<typeof createOrderSchema>;
export type CancelOrderBody = z.infer<typeof cancelOrderSchema>;
export type BulkOrdersBody = z.infer<typeof bulkOrdersSchema>;
export type HoldOrderBody = z.infer<typeof holdOrderSchema>;
export type CreateShipmentBody = z.infer<typeof createShipmentSchema>;
export type AdvanceShipmentEventBody = z.infer<
  typeof advanceShipmentEventSchema
>;
