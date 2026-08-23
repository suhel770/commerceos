import { z } from "zod";

import { MarketplaceName } from "@/lib/types/master-listing";

export const listingValidateSchema = z
  .object({
    productId: z.string().trim().min(1),
  })
  .strict();

export const listingPublishSchema = z
  .object({
    productId: z.string().trim().min(1),
    marketplace: z.nativeEnum(MarketplaceName).optional(),
  })
  .strict();

export const listingSyncSchema = z
  .object({
    productId: z.string().trim().min(1),
    type: z.enum([
      "sync_price",
      "sync_inventory",
      "sync_status",
    ]),
    marketplace: z.nativeEnum(MarketplaceName).optional(),
  })
  .strict();

export const listingRetrySchema = z
  .object({
    jobId: z.string().uuid(),
  })
  .strict();
