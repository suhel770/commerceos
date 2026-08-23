"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Package } from "lucide-react";

import type { Product } from "@/lib/types/product";

interface ProductGalleryProps {
  product: Product;
}

export default function ProductGallery({ product }: ProductGalleryProps) {
  const images = useMemo(() => {
    const all = [product.image, ...(product.gallery ?? [])].filter((img) => typeof img === "string" && img.trim().length > 0 && img !== "{}");
    return Array.from(new Set(all));
  }, [product.gallery, product.image]);

  const [selectedImage, setSelectedImage] = useState(images[0] ?? "");
  const visibleThumbs = images.slice(0, 4);
  const extraCount = Math.max(0, images.length - visibleThumbs.length);

  const checks = [
    { label: "Primary", ok: Boolean(product.image) },
    { label: `${images.length} images`, ok: images.length >= 4 },
    { label: "Video", ok: Boolean(product.video) },
  ];

  const hasValidSelectedImage = typeof selectedImage === "string" && selectedImage.trim().length > 0 && selectedImage !== "{}";

  return (
    <div className="flex flex-col">
      <div className="relative h-[250px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center">
        {hasValidSelectedImage ? (
          <Image
            src={selectedImage}
            alt={product.name || "Product image"}
            fill
            priority
            className="object-contain p-6"
          />
        ) : (
          <Package className="h-12 w-12 text-slate-400" />
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        {visibleThumbs.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            onClick={() => setSelectedImage(image)}
            className={`
              relative h-16 w-16 overflow-hidden rounded-xl border transition-all
              ${
                selectedImage === image
                  ? "border-blue-600 ring-2 ring-blue-100"
                  : "border-slate-200 hover:border-slate-300"
              }
            `}
          >
            <Image src={image} alt="" fill className="object-contain p-1" />
          </button>
        ))}

        {extraCount > 0 ? (
          <button
            type="button"
            onClick={() => setSelectedImage(images[4] ?? images[0])}
            className="flex h-16 w-16 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-600"
          >
            +{extraCount}
          </button>
        ) : null}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-slate-600">Product Media</span>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {images.length} Images
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {checks.map((check) => (
          <span
            key={check.label}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
              check.ok
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-500"
            }`}
          >
            {check.ok ? <CheckCircle2 size={12} /> : <Circle size={12} />}
            {check.label}
          </span>
        ))}
        <Link
          href={`/products/${product.slug}/edit`}
          className="ml-auto text-xs font-semibold text-blue-600 hover:text-blue-700"
        >
          Manage →
        </Link>
      </div>
    </div>
  );
}
