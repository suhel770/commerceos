"use client";

import Link from "next/link";
import { Eye, Edit3 } from "lucide-react";

interface ActionCellProps {
  slug: string;
}

export default function ActionCell({ slug }: ActionCellProps) {
  const currentOrigin = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/products/list";

  return (
    <div className="flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
      <Link
        href={`/products/${slug}?from=${encodeURIComponent(currentOrigin)}`}
        onClick={(e) => e.stopPropagation()}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
        title="View Product Workspace"
        aria-label="View product workspace"
      >
        <Eye className="h-3.5 w-3.5" />
      </Link>

      <Link
        href={`/products/${slug}/edit?from=${encodeURIComponent(currentOrigin)}`}
        onClick={(e) => e.stopPropagation()}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
        title="Edit in Product Studio"
        aria-label="Edit product"
      >
        <Edit3 className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}