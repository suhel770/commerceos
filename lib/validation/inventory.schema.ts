import { z } from "zod";

const warehouseId = z.string().trim().min(1);
const productId = z.string().trim().min(1);

export const inventoryAdjustSchema = z
  .object({
    productId,
    warehouseId: warehouseId.optional(),
    delta: z.number().int(),
    bucket: z
      .enum([
        "available",
        "reserved",
        "incoming",
        "damaged",
        "inTransit",
      ])
      .optional(),
    reason: z.string().trim().min(1).max(200),
  })
  .strict()
  .refine((value) => value.delta !== 0, {
    message: "delta cannot be zero",
    path: ["delta"],
  });

export const inventoryReserveSchema = z
  .object({
    productId,
    warehouseId: warehouseId.optional(),
    quantity: z.number().int().positive(),
    reference: z.string().trim().min(1).max(120).optional(),
    expiresAt: z.string().datetime().optional(),
  })
  .strict();

export const inventoryReleaseSchema = z
  .object({
    reservationId: z.string().uuid(),
    expired: z.boolean().optional(),
  })
  .strict();

export const inventoryTransferSchema = z
  .object({
    productId,
    fromWarehouseId: warehouseId,
    toWarehouseId: warehouseId,
    quantity: z.number().int().positive(),
    reason: z.string().trim().min(1).max(200).optional(),
  })
  .strict()
  .refine(
    (value) => value.fromWarehouseId !== value.toWarehouseId,
    {
      message: "Warehouses must differ",
      path: ["toWarehouseId"],
    },
  );

export const inventoryConsumeSchema = z
  .object({
    productId: productId.optional(),
    sku: z.string().trim().optional(),
    productName: z.string().trim().optional(),
    warehouseId: warehouseId.optional(),
    inventoryType: z.enum(["SELLABLE", "CONSUMABLE"]).optional(),
    usageType: z
      .enum([
        "ORDER_FULFILLMENT",
        "PACKAGING",
        "INTERNAL_OPERATIONS",
        "PRODUCTION",
        "SAMPLE",
        "DAMAGED_WRITEOFF",
        "MANUAL_CONSUMPTION",
        "REVERSAL",
        "OTHER",
      ])
      .optional(),
    quantity: z.number().int().positive(),
    unit: z.string().trim().optional(),
    reason: z.string().trim().min(1).max(200),
    customReason: z.string().trim().max(300).optional(),
    notes: z.string().trim().max(500).optional(),
    sourceLocationId: z.string().trim().optional(),
    sourceLocationName: z.string().trim().optional(),
    relatedProductSku: z.string().trim().optional(),
    relatedProductName: z.string().trim().optional(),
    relatedOrderId: z.string().trim().optional(),
    relatedShipmentId: z.string().trim().optional(),
    relatedPurchaseBillId: z.string().trim().optional(),
    reference: z.string().trim().max(120).optional(),
    actorName: z.string().trim().max(100).optional(),
  })
  .strict();

export const inventoryReverseConsumptionSchema = z
  .object({
    ledgerId: z.string().trim().min(1),
    reason: z.string().trim().max(200).optional(),
    notes: z.string().trim().max(500).optional(),
    actorName: z.string().trim().max(100).optional(),
  })
  .strict();

