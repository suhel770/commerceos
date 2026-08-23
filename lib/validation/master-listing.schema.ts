import { z } from "zod";

import {
  ListingStatus,
  MarketplaceName,
  MarketplacePublishStatus,
  ValidationSeverity,
} from "@/lib/types/master-listing";

const identitySchema = z
  .object({
    id: z.string().min(1),
    sku: z.string().trim().min(1),
    productName: z
      .string()
      .trim()
      .min(1),
    shortName: z.string().optional(),
    brand: z.string().trim().min(1),
    manufacturer: z
      .string()
      .optional(),
    category: z
      .string()
      .trim()
      .min(1),
    subCategory: z
      .string()
      .optional(),
    productType: z
      .string()
      .optional(),
    variantGroupId: z
      .string()
      .optional(),
    barcode: z.string().optional(),
    gtin: z.string().optional(),
    upc: z.string().optional(),
    ean: z.string().optional(),
    hsn: z.string().optional(),
    taxCode: z.string().optional(),
  })
  .strict();

const mediaSchema = z
  .object({
    id: z.string().min(1),
    kind: z.enum([
      "image",
      "video",
      "document",
    ]),
    url: z.union([
      z.url(),
      z.literal(""),
    ]),
    thumbnail: z.string().optional(),
    alt: z.string().optional(),
    isPrimary: z.boolean(),
    width: z
      .number()
      .nonnegative()
      .optional(),
    height: z
      .number()
      .nonnegative()
      .optional(),
    tags: z.array(z.string()).optional(),
    sortOrder: z
      .number()
      .int()
      .nonnegative(),
  })
  .strict();

const pricingSchema = z
  .object({
    mrp: z.number().nonnegative(),
    sellingPrice: z
      .number()
      .nonnegative(),
    costPrice: z
      .number()
      .nonnegative(),
    currency: z
      .string()
      .length(3),
    taxPercentage: z
      .number()
      .min(0)
      .max(100)
      .optional(),
  })
  .strict();

const inventorySchema = z
  .object({
    available: z
      .number()
      .int()
      .nonnegative(),
    reserved: z
      .number()
      .int()
      .nonnegative(),
    incoming: z
      .number()
      .int()
      .nonnegative(),
    safetyStock: z
      .number()
      .int()
      .nonnegative(),
    warehouseIds: z.array(
      z.string().min(1),
    ),
  })
  .strict();

const attributeSchema = z
  .object({
    id: z.string().min(1),
    key: z.string().min(1),
    label: z.string().min(1),
    value: z.unknown(),
    group: z.string().min(1),
    searchable: z
      .boolean()
      .optional(),
    filterable: z
      .boolean()
      .optional(),
  })
  .strict();

const marketplaceSchema = z
  .object({
    marketplace: z.enum(
      MarketplaceName,
    ),
    enabled: z.boolean(),
    publishStatus: z.enum(
      MarketplacePublishStatus,
    ),
    listingId: z.string().optional(),
    externalId: z.string().optional(),
    listingUrl: z.string().optional(),
    lastPublishedAt: z
      .string()
      .optional(),
    lastSyncedAt: z
      .string()
      .optional(),
    validationScore: z
      .number()
      .min(0)
      .max(100),
    issues: z.array(
      z
        .object({
          id: z.string().min(1),
          severity: z.enum(
            ValidationSeverity,
          ),
          title: z
            .string()
            .min(1),
          description: z
            .string()
            .min(1),
          field: z
            .string()
            .optional(),
          marketplaces: z.array(
            z.enum(
              MarketplaceName,
            ),
          ),
        })
        .strict(),
    ),
  })
  .strict();

export const masterListingUpdateSchema =
  z
    .object({
      identity:
        identitySchema.optional(),
      status: z
        .enum(ListingStatus)
        .optional(),
      media: z
        .array(mediaSchema)
        .optional(),
      pricing:
        pricingSchema.optional(),
      commercials: z
        .object({
          minimumPrice: z
            .number()
            .nonnegative()
            .optional(),
          maximumPrice: z
            .number()
            .nonnegative()
            .optional(),
          weightGrams: z
            .number()
            .nonnegative()
            .optional(),
          packageLengthCm: z
            .number()
            .nonnegative()
            .optional(),
          packageWidthCm: z
            .number()
            .nonnegative()
            .optional(),
          packageHeightCm: z
            .number()
            .nonnegative()
            .optional(),
        })
        .strict()
        .optional(),
      inventory:
        inventorySchema.optional(),
      supply: z
        .object({
          primarySupplier: z
            .string()
            .optional(),
          supplierSku: z
            .string()
            .optional(),
          leadTimeDays: z
            .number()
            .nonnegative()
            .optional(),
          minimumOrderQuantity: z
            .number()
            .nonnegative()
            .optional(),
          reorderQuantity: z
            .number()
            .nonnegative()
            .optional(),
          procurementReference: z
            .string()
            .optional(),
        })
        .strict()
        .optional(),
      variants: z
        .array(
          z
            .object({
              id: z.string().min(1),
              sku: z
                .string()
                .min(1),
              title: z
                .string()
                .min(1),
              optionValues: z.record(
                z.string(),
                z.string(),
              ),
              barcode: z
                .string()
                .optional(),
              sellingPrice: z
                .number()
                .nonnegative()
                .optional(),
              available: z
                .number()
                .nonnegative()
                .optional(),
              mediaIds: z.array(
                z.string(),
              ),
              active: z.boolean(),
            })
            .strict(),
        )
        .optional(),
      compliance: z
        .object({
          countryOfOrigin: z
            .string()
            .optional(),
          warranty: z
            .string()
            .optional(),
          legalMetrology: z
            .string()
            .optional(),
          certifications: z.array(
            z.string(),
          ),
          documents: z.array(
            z
              .object({
                id: z
                  .string()
                  .min(1),
                name: z
                  .string()
                  .min(1),
                type: z
                  .string()
                  .min(1),
                url: z.string(),
                expiresAt: z
                  .string()
                  .optional(),
              })
              .strict(),
          ),
        })
        .strict()
        .optional(),
      growth: z
        .object({
          seoTitle: z
            .string()
            .optional(),
          metaDescription: z
            .string()
            .optional(),
          searchTerms: z.array(
            z.string(),
          ),
          bulletPoints: z.array(
            z.string(),
          ),
          merchandisingTags:
            z.array(z.string()),
        })
        .strict()
        .optional(),
      attributes: z
        .array(attributeSchema)
        .optional(),
      marketplaces: z
        .array(marketplaceSchema)
        .optional(),
      revision: z
        .number()
        .int()
        .nonnegative()
        .optional(),
    })
    .strict();

export const publishCommandSchema = z
  .object({
    marketplace: z
      .enum(MarketplaceName)
      .optional(),
    revision: z
      .number()
      .int()
      .nonnegative()
      .optional(),
  })
  .strict();

export const masterListingPatchSchema =
  masterListingUpdateSchema.extend({
    revision: z
      .number()
      .int()
      .nonnegative(),
  });

export type MasterListingUpdateInput =
  z.infer<
    typeof masterListingUpdateSchema
  >;
