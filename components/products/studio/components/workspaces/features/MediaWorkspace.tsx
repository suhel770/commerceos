"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  FileUp,
  ImagePlus,
  Images,
  Trash2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  MEDIA_ACCEPT_ATTRIBUTE,
  mediaKindFromMimeType,
  readFileAsDataUrl,
  requestMediaUploadPolicy,
  validateMediaFile,
  type AcceptedMediaMimeType,
} from "@/lib/media/local-upload";
import {
  type ListingMedia,
  type MasterListing,
} from "@/lib/types/master-listing";
import { useStudio } from "../../../context/StudioContext";
import { Panel, Field, EmptyState } from "./workspace-ui";

export function MediaWorkspace() {
  const { listing, updateListing } = useStudio();
  const singleInputRef = useRef<HTMLInputElement>(null);
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [replaceTargetId, setReplaceTargetId] = useState<string | null>(
    null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!listing) return null;

  const updateMedia = (
    id: string,
    updates: Partial<MasterListing["media"][number]>,
  ) => {
    updateListing({
      media: listing.media.map((item) =>
        item.id === id ? { ...item, ...updates } : item,
      ),
    });
  };

  const removeMedia = (id: string) => {
    const next = listing.media.filter((item) => item.id !== id);

    if (next.length > 0 && !next.some((item) => item.isPrimary)) {
      next[0] = {
        ...next[0],
        isPrimary: true,
      };
    }

    updateListing({ media: next });
  };

  const setPrimary = (id: string) => {
    updateListing({
      media: listing.media.map((item) => ({
        ...item,
        isPrimary: item.id === id,
      })),
    });
  };

  const ingestFiles = async (
    fileList: FileList | File[],
    options?: {
      replaceId?: string;
    },
  ) => {
    const files = Array.from(fileList);

    if (files.length === 0) {
      return;
    }

    setUploading(true);
    setStatusMessage(null);

    try {
      const validationErrors = files
        .map((file) => validateMediaFile(file))
        .filter((error): error is string => Boolean(error));

      if (validationErrors.length > 0) {
        throw new Error(validationErrors[0]);
      }

      const created: ListingMedia[] = [];

      for (const [index, file] of files.entries()) {
        await requestMediaUploadPolicy(file);

        const url = await readFileAsDataUrl(file);
        const kind = mediaKindFromMimeType(
          file.type as AcceptedMediaMimeType,
        );
        const baseName = file.name.replace(/\.[^.]+$/, "");

        created.push({
          id: crypto.randomUUID(),
          kind,
          url,
          thumbnail: kind === "image" ? url : undefined,
          alt:
            listing.identity.productName ||
            baseName ||
            "Product media",
          isPrimary: false,
          tags: [],
          sortOrder: listing.media.length + index,
        });
      }

      if (options?.replaceId && created[0]) {
        const replacement = created[0];
        const remaining = created.slice(1);

        updateListing({
          media: [
            ...listing.media.map((item) =>
              item.id === options.replaceId
                ? {
                    ...item,
                    kind: replacement.kind,
                    url: replacement.url,
                    thumbnail: replacement.thumbnail,
                    alt: item.alt || replacement.alt,
                  }
                : item,
            ),
            ...remaining.map((item, index) => ({
              ...item,
              sortOrder: listing.media.length + index,
              isPrimary: false,
            })),
          ],
        });

        setStatusMessage(
          remaining.length > 0
            ? `Replaced 1 asset and added ${remaining.length} more.`
            : "Asset replaced.",
        );
        return;
      }

      const nextMedia = [
        ...listing.media,
        ...created.map((item, index) => ({
          ...item,
          isPrimary:
            listing.media.length === 0 && index === 0,
          sortOrder: listing.media.length + index,
        })),
      ];

      updateListing({ media: nextMedia });
      setStatusMessage(
        created.length === 1
          ? "1 file uploaded to the media library."
          : `${created.length} files uploaded to the media library.`,
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : "Unable to upload media.",
      );
    } finally {
      setUploading(false);
      setReplaceTargetId(null);

      if (singleInputRef.current) {
        singleInputRef.current.value = "";
      }

      if (bulkInputRef.current) {
        bulkInputRef.current.value = "";
      }

      if (replaceInputRef.current) {
        replaceInputRef.current.value = "";
      }
    }
  };

  const onFileInputChange = async (
    event: ChangeEvent<HTMLInputElement>,
    replaceId?: string,
  ) => {
    if (!event.target.files) {
      return;
    }

    await ingestFiles(event.target.files, { replaceId });
  };

  const onDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    await ingestFiles(event.dataTransfer.files);
  };

  return (
    <div className="space-y-5">
      <Panel
        title="Master Media Library"
        description="Upload product images one at a time or in bulk. CommerceOS keeps the master assets here and maps them to each marketplace."
      >
        <input
          ref={singleInputRef}
          type="file"
          accept={MEDIA_ACCEPT_ATTRIBUTE}
          className="hidden"
          onChange={(event) => void onFileInputChange(event)}
        />
        <input
          ref={bulkInputRef}
          type="file"
          accept={MEDIA_ACCEPT_ATTRIBUTE}
          multiple
          className="hidden"
          onChange={(event) => void onFileInputChange(event)}
        />
        <input
          ref={replaceInputRef}
          type="file"
          accept={MEDIA_ACCEPT_ATTRIBUTE}
          className="hidden"
          onChange={(event) =>
            void onFileInputChange(
              event,
              replaceTargetId ?? undefined,
            )
          }
        />

        <div
          role="button"
          tabIndex={0}
          aria-label="Upload media by dropping files or clicking to browse"
          onClick={() => {
            if (!uploading) {
              bulkInputRef.current?.click();
            }
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              if (!uploading) {
                bulkInputRef.current?.click();
              }
            }
          }}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(event) => void onDrop(event)}
          className={`rounded-xl border border-dashed px-5 py-8 text-center transition-colors ${
            isDragging
              ? "border-blue-400 bg-blue-50"
              : "border-slate-300 bg-slate-50 hover:border-slate-400"
          } ${uploading ? "pointer-events-none opacity-70" : "cursor-pointer"}`}
        >
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
            <Upload className="h-5 w-5 text-blue-600" />
          </div>
          <p className="mt-3 text-sm font-semibold text-slate-900">
            {uploading
              ? "Uploading…"
              : "Drop images here, or click to browse"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            JPEG, PNG, WebP, MP4, or PDF · up to 25 MB each · single or bulk
          </p>
        </div>

        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={() => singleInputRef.current?.click()}
          >
            <ImagePlus className="mr-2 h-4 w-4" />
            Upload one
          </Button>
          <Button
            type="button"
            disabled={uploading}
            onClick={() => bulkInputRef.current?.click()}
          >
            <Images className="mr-2 h-4 w-4" />
            Upload bulk
          </Button>
        </div>

        {statusMessage && (
          <p
            className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600"
            role="status"
          >
            {statusMessage}
          </p>
        )}

        {listing.media.length === 0 ? (
          <div className="mt-4">
            <EmptyState>
              No media yet. Upload a primary product image to begin.
            </EmptyState>
          </div>
        ) : (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {listing.media.map((item, index) => (
              <article
                key={item.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="font-medium text-slate-900">
                    Asset {index + 1}
                  </p>

                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-slate-600">
                      Primary
                      <Switch
                        checked={item.isPrimary}
                        onCheckedChange={() => setPrimary(item.id)}
                      />
                    </label>

                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove asset ${index + 1}`}
                      onClick={() => removeMedia(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>

                <div className="mt-4 space-y-4">
                  <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                    {item.kind === "image" && item.url ? (
                      // eslint-disable-next-line @next/next/no-img-element -- local data/blob previews and mock paths
                      <img
                        src={item.url}
                        alt={item.alt || `Asset ${index + 1}`}
                        className="aspect-[4/3] w-full object-contain"
                      />
                    ) : (
                      <div className="flex aspect-[4/3] flex-col items-center justify-center gap-2 text-sm text-slate-500">
                        <FileUp className="h-6 w-6" />
                        <span className="capitalize">{item.kind}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                      onClick={() => {
                        setReplaceTargetId(item.id);
                        replaceInputRef.current?.click();
                      }}
                    >
                      <Upload className="mr-2 h-3.5 w-3.5" />
                      Replace file
                    </Button>
                    <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                      {item.kind}
                    </span>
                  </div>

                  <Field label="Alt text">
                    <Input
                      value={item.alt ?? ""}
                      placeholder="Describe this image"
                      onChange={(event) =>
                        updateMedia(item.id, {
                          alt: event.target.value,
                        })
                      }
                    />
                  </Field>

                  <Field label="Tags">
                    <Input
                      value={(item.tags ?? []).join(", ")}
                      placeholder="hero, lifestyle, detail"
                      onChange={(event) =>
                        updateMedia(item.id, {
                          tags: event.target.value
                            .split(",")
                            .map((tag) => tag.trim())
                            .filter(Boolean),
                        })
                      }
                    />
                  </Field>
                </div>
              </article>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
