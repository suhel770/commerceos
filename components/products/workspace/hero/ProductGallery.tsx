"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Package, ImagePlus } from "lucide-react";

import type { Product } from "@/lib/types/product";

interface ProductGalleryProps {
  product: Product;
}

export default function ProductGallery({ product }: ProductGalleryProps) {
  const images = useMemo(() => {
    const all = [product.image, ...(product.gallery ?? [])].filter(
      (img) => typeof img === "string" && img.trim().length > 0 && img !== "{}"
    );
    return Array.from(new Set(all));
  }, [product.gallery, product.image]);

  const [selectedImage, setSelectedImage] = useState(images[0] ?? "");
  const [imageError, setImageError] = useState<Record<string, boolean>>({});

  const visibleThumbs = images.slice(0, 4);
  const extraCount = Math.max(0, images.length - visibleThumbs.length);

  const checks = [
    { label: "Primary", ok: Boolean(product.image && product.image !== "{}") },
    { label: `${images.length} images`, ok: images.length >= 4 },
    { label: "Video", ok: Boolean(product.video) },
  ];

  const isFailed = !selectedImage || imageError[selectedImage] || selectedImage === "{}";

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-xl p-8 bg-slate-50 text-center gap-2">
        <Package className="h-10 w-10 text-slate-300" />
        <p className="text-xs font-bold text-slate-800">No product image</p>
        <p className="text-[10px] text-slate-400">Add media files to list the item on channels.</p>
        <Link
          href={`/products/${product.slug}/edit`}
          className="mt-1.5 py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
        >
          Add Media
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Primary Image Viewport */}
      <div className="relative h-[220px] w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
        {isFailed ? (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
            <Package className="h-10 w-10 text-slate-300" />
            <span className="text-[9px] font-bold text-slate-400">No product image</span>
          </div>
        ) : (
          <Image
            src={selectedImage}
            alt={product.name || "Product image"}
            fill
            priority
            className="object-contain p-4"
            onError={() => setImageError((prev) => ({ ...prev, [selectedImage]: true }))}
          />
        )}
      </div>

      {/* Thumbnails Row */}
      <div className="flex items-center gap-1.5">
        {visibleThumbs.map((image, index) => {
          const thumbFailed = imageError[image] || image === "{}";
          return (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setSelectedImage(image)}
              className={`
                relative h-11 w-11 overflow-hidden rounded-lg border transition-all flex items-center justify-center bg-slate-50
                ${
                  selectedImage === image
                    ? "border-blue-600 ring-2 ring-blue-100"
                    : "border-slate-200 hover:border-slate-300"
                }
              `}
            >
              {thumbFailed ? (
                <Package className="h-4 w-4 text-slate-400" />
              ) : (
                <Image
                  src={image}
                  alt=""
                  fill
                  className="object-contain p-0.5"
                  onError={() => setImageError((prev) => ({ ...prev, [image]: true }))}
                />
              )}
            </button>
          );
        })}

        {extraCount > 0 ? (
          <button
            type="button"
            onClick={() => setSelectedImage(images[4] ?? images[0])}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-xs font-semibold text-slate-600"
          >
            +{extraCount}
          </button>
        ) : null}
      </div>

      {/* Media Metadata & Checklists */}
      <div className="border-t border-slate-100 pt-2 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Product Gallery</span>
          <span className="text-[10px] font-bold text-slate-700">
            {images.length} Images
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {checks.map((check) => (
            <span
              key={check.label}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold ${
                check.ok
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {check.ok ? <CheckCircle2 size={10} /> : <Circle size={10} />}
              {check.label}
            </span>
          ))}
        </div>

        <Link
          href={`/products/${product.slug}/edit`}
          className="w-full mt-1.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition"
        >
          <ImagePlus size={12} />
          <span>Manage Media</span>
        </Link>
      </div>
    </div>
  );
}
