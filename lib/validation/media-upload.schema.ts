import { z } from "zod";

export const mediaUploadRequestSchema =
  z
    .object({
      fileName: z
        .string()
        .trim()
        .min(1)
        .max(200),
      mimeType: z.enum([
        "image/jpeg",
        "image/png",
        "image/webp",
        "video/mp4",
        "application/pdf",
      ]),
      size: z
        .number()
        .int()
        .positive()
        .max(25 * 1024 * 1024),
    })
    .strict();
