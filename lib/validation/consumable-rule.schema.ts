/**
 * CommerceOS — Consumable Usage Rule Validation Schema
 * =====================================================
 */

import { z } from "zod";

export const consumptionModeEnum = z.enum([
  "PER_UNIT",
  "PER_ORDER",
  "PER_SHIPMENT",
  "FIXED_PER_PACK",
]);

export const consumableRuleCreateSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  productSku: z.string().min(1, "Product SKU is required"),
  variantSku: z.string().optional().nullable(),
  consumableSku: z.string().min(1, "Consumable SKU is required"),
  consumableName: z.string().optional().nullable(),
  quantity: z.number().positive("Quantity must be greater than 0"),
  unit: z.string().default("pcs"),
  consumptionMode: consumptionModeEnum.default("PER_UNIT"),
  notes: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

export const consumableRuleUpdateSchema = z.object({
  quantity: z.number().positive("Quantity must be greater than 0").optional(),
  unit: z.string().optional(),
  consumptionMode: consumptionModeEnum.optional(),
  notes: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export const consumableCalculationQuerySchema = z.object({
  productSku: z.string().min(1, "Product SKU is required"),
  variantSku: z.string().optional(),
  orderQuantity: z.coerce.number().int().positive("Order quantity must be a positive integer"),
  shipmentCount: z.coerce.number().int().positive().optional().default(1),
  packCount: z.coerce.number().int().positive().optional().default(1),
});
