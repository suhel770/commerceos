"use client";

import { useState } from "react";
import { Package } from "lucide-react";
import type { Product } from "@/lib/types/product";
import { getUniversalProductId } from "@/lib/products/product-id-utils";

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

  const brand = product.brand && product.brand.trim() !== "CommerceOS" ? product.brand.trim() : null;
  const sku = product.sku;
  const category = product.category && product.category.trim() !== "General" ? product.category.trim() : null;
  const displayName = product.name?.trim() || product.sku;
  const productId = getUniversalProductId(product);

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-slate-100/80 shadow-2xs">
        {hasRealImage ? (
          <img
            src={product.image}
            alt={displayName}
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
        <h3 className="truncate text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
          {displayName}
        </h3>

        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500 truncate">
          {productId && (
            <>
              <span className="font-mono font-bold text-indigo-600 bg-indigo-50/80 px-1.5 py-0.5 rounded border border-indigo-100/60">
                {productId}
              </span>
              <span className="text-slate-300">·</span>
            </>
          )}
          {brand && (
            <>
              <span className="font-medium text-slate-700">{brand}</span>
              <span className="text-slate-300">·</span>
            </>
          )}
          <span className="font-mono font-medium text-slate-600">{sku}</span>
          {category && (
            <>
              <span className="text-slate-300">·</span>
              <span className="truncate text-slate-500">{category}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}