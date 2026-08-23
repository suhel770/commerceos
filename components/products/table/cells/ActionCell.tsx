"use client";

import Link from "next/link";
import { Eye, Edit3 } from "lucide-react";

interface ActionCellProps {
  slug: string;
}

export default function ActionCell({ slug }: ActionCellProps) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      <Link
        href={`/products/${slug}`}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
        title="View Product Workspace"
        aria-label="View product"
      >
        <Eye className="h-3.5 w-3.5" />
      </Link>

      <Link
        href={`/products/${slug}/edit`}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600"
        title="Edit in Product Studio"
        aria-label="Edit product"
      >
        <Edit3 className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}