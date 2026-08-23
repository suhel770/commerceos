/**
 * CommerceOS V4 — Storage Location Validation Schemas
 * Zod schemas for input validation & contract safety
 */

import { z } from "zod";
import { ALL_STORAGE_CAPABILITIES } from "../domain/capabilities";

export const storageAddressSchema = z
  .object({
    line1: z.string().trim().max(200).optional(),
    line2: z.string().trim().max(200).optional(),
    city: z.string().trim().max(100).optional(),
    state: z.string().trim().max(100).optional(),
    pincode: z.string().trim().max(20).optional(),
    country: z.string().trim().max(100).optional(),
    timezone: z.string().trim().max(50).optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
  })
  .strict();

export const storageMarketplaceSchema = z
  .object({
    provider: z.enum([
      "amazon",
      "flipkart",
      "meesho",
      "shopify",
      "custom_3pl",
      "none",
    ]),
    sellerId: z.string().trim().max(100).optional(),
    region: z.string().trim().max(50).optional(),
    fcReferenceCode: z.string().trim().max(50).optional(),
    connectionStatus: z.enum([
      "connected",
      "disconnected",
      "syncing",
      "error",
      "not_configured",
    ]),
    lastSyncedAt: z.string().datetime().optional(),
  })
  .strict();

export const securityContextSchema = z
  .object({
    tenantId: z.string().trim().min(1),
    organizationId: z.string().trim().min(1),
    workspaceId: z.string().trim().min(1),
    actorId: z.string().trim().optional(),
    actorName: z.string().trim().optional(),
    roles: z.array(z.string()).optional(),
  })
  .passthrough();

export const storageComplexityModeSchema = z.enum(["simple", "medium", "advanced"]);

export const subLocationNodeSchema: z.ZodType<any> = z.lazy(() =>
  z
    .object({
      id: z.string().trim().min(1),
      code: z.string().trim().min(1),
      name: z.string().trim().min(1),
      level: z.enum(["zone", "aisle", "rack", "shelf", "bin"]),
      parentId: z.string().trim().optional(),
      barcode: z.string().trim().optional(),
      capacityMaxUnits: z.number().min(0).optional(),
      currentUnitsCount: z.number().min(0).optional(),
      children: z.array(subLocationNodeSchema).optional(),
    })
    .strict()
);

export const createStorageLocationSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
    code: z
      .string()
      .trim()
      .min(2, "Code must be at least 2 characters")
      .max(40)
      .regex(/^[A-Z0-9_-]+$/i, "Code must contain alphanumeric characters, hyphens or underscores"),
    type: z.enum([
      "home_storage",
      "warehouse",
      "amazon_fba",
      "flipkart_fulfillment",
      "3pl",
      "factory",
      "retail_store",
      "transit",
      "returns_area",
      "temporary_storage",
      "custom",
    ]),
    storageComplexityMode: storageComplexityModeSchema.default("simple"),
    subLocations: z.array(subLocationNodeSchema).optional(),
    parentLocationId: z.string().trim().min(1).optional(),
    address: storageAddressSchema.optional(),
    marketplace: storageMarketplaceSchema.optional(),
    isDefault: z.boolean().default(false),
    capabilities: z.array(z.enum(ALL_STORAGE_CAPABILITIES as [string, ...string[]])).optional(),
    tags: z.array(z.string().trim()).default([]),
    metadata: z.record(z.string(), z.unknown()).default({}),
    securityContext: securityContextSchema,
  })
  .strict();

export const updateStorageLocationSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    code: z.string().trim().min(2).max(40).optional(),
    storageComplexityMode: storageComplexityModeSchema.optional(),
    subLocations: z.array(subLocationNodeSchema).optional(),
    parentLocationId: z.string().trim().min(1).nullable().optional(),
    address: storageAddressSchema.optional(),
    marketplace: storageMarketplaceSchema.optional(),
    isDefault: z.boolean().optional(),
    capabilities: z.array(z.enum(ALL_STORAGE_CAPABILITIES as [string, ...string[]])).optional(),
    tags: z.array(z.string().trim()).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
    reason: z.string().optional(),
  })
  .passthrough();
