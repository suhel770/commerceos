"use client";

import { useState } from "react";
import Link from "next/link";
import { Package } from "lucide-react";
import type { Product } from "@/lib/types/product";

interface ProductCellProps {
  product: Product;
}

export default function ProductCell({ product }: ProductCellProps) {
  const [imageError, setImageError] = useState(false);
  const hasRealImage =
    typeof product?.image === "string" &&
    product.image.trim().length > 0 &&
    product.image !== "{}" &&
    !product.image.includes("placeholder.jpg") &&
    !imageError;

  const targetHref = `/products/${product.slug || product.id}`;

  return (
    <Link
      href={targetHref}
      className="group flex items-center gap-3 rounded-xl p-1 -m-1 transition-all duration-200 hover:bg-blue-50/60"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-slate-100/80 shadow-2xs transition-transform duration-200 group-hover:scale-105">
        {hasRealImage ? (
          <img
            src={product.image}
            alt={product.name || "Product"}
            onError={() => setImageError(true)}
            className="h-full w-full rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-indigo-50/50 text-indigo-600">
            <Package className="h-5 w-5" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-xs font-bold text-slate-900 transition-colors group-hover:text-blue-600">
          {product.name}
        </h3>

        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-slate-500">
          <span className="font-medium text-slate-600">{product.brand || "CommerceOS"}</span>
          <span>•</span>
          <span className="font-mono font-medium text-slate-500">{product.sku}</span>
          {product.category && (
            <>
              <span>•</span>
              <span className="truncate">{product.category}</span>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}