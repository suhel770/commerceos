"use client";

import Image from "next/image";
import { useState } from "react";

import type { Product } from "@/lib/types/product";

interface ProductGalleryProps {
  product: Product;
}

export default function ProductGallery({
  product,
}: ProductGalleryProps) {
  const images = [
    product.image,
    product.image,
    product.image,
    product.image,
    product.image,
  ];

  const [selectedImage, setSelectedImage] = useState(images[0]);

  return (
    <div className="flex h-full flex-col">

      {/* Main Image */}

      <div className="relative h-[250px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">

        <Image
          src={selectedImage}
          alt={product.name}
          fill
          priority
          className="object-contain p-6"
        />

      </div>

      {/* Thumbnail Strip */}

      <div className="mt-4 flex items-center gap-2">

        {images.slice(0, 4).map((image, index) => (

          <button
            key={index}
            onClick={() => setSelectedImage(image)}
            className={`
              relative
              h-16
              w-16
              overflow-hidden
              rounded-xl
              border
              transition-all
              ${
                selectedImage === image
                  ? "border-blue-600 ring-2 ring-blue-100"
                  : "border-slate-200 hover:border-slate-300"
              }
            `}
          >

            <Image
              src={image}
              alt=""
              fill
              className="object-contain p-1"
            />

          </button>

        ))}

        <button
          className="
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-xl
            border
            border-slate-200
            bg-slate-100
            text-lg
            font-semibold
            text-slate-600
          "
        >
          +3
        </button>

      </div>

      {/* Footer */}

      <div className="mt-5 flex items-center justify-between">

        <span className="text-sm font-medium text-slate-600">
          Product Media
        </span>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          {images.length} Images
        </span>

      </div>

    </div>
  );
}