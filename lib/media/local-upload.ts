import { safeResponseJson } from "@/lib/api/client";
import type { MediaKind } from "@/lib/types/master-listing";

export const ACCEPTED_MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "application/pdf",
] as const;

export type AcceptedMediaMimeType =
  (typeof ACCEPTED_MEDIA_MIME_TYPES)[number];

export const MEDIA_ACCEPT_ATTRIBUTE =
  ACCEPTED_MEDIA_MIME_TYPES.join(",");

const MAX_BYTES = 25 * 1024 * 1024;

export function isAcceptedMediaMimeType(
  mimeType: string,
): mimeType is AcceptedMediaMimeType {
  return (
    ACCEPTED_MEDIA_MIME_TYPES as readonly string[]
  ).includes(mimeType);
}

export function mediaKindFromMimeType(
  mimeType: AcceptedMediaMimeType,
): MediaKind {
  if (mimeType.startsWith("image/")) {
    return "image";
  }

  if (mimeType.startsWith("video/")) {
    return "video";
  }

  return "document";
}

export function validateMediaFile(file: File): string | null {
  if (!isAcceptedMediaMimeType(file.type)) {
    return `${file.name}: unsupported type. Use JPEG, PNG, WebP, MP4, or PDF.`;
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return `${file.name}: must be between 1 byte and 25 MB.`;
  }

  return null;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error(`${file.name}: unable to read file.`));
    };

    reader.onerror = () => {
      reject(new Error(`${file.name}: unable to read file.`));
    };

    reader.readAsDataURL(file);
  });
}

export async function requestMediaUploadPolicy(file: File): Promise<void> {
  const response = await fetch("/api/v1/media/upload-policy", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
    }),
  });

  const payload = (await safeResponseJson(response)) as {
    success?: boolean;
    error?: { message?: string };
  };

  if (!payload.success) {
    throw new Error(
      payload.error?.message ??
        `${file.name}: upload policy rejected.`,
    );
  }
}
