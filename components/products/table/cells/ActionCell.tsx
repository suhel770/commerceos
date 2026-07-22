"use client";

import { Eye, Pencil } from "lucide-react";

interface ActionCellProps {
  productId: string;
}

export default function ActionCell({
  productId,
}: ActionCellProps) {
  return (
    <div className="flex items-center justify-center gap-1">

      <button
        className="rounded-md p-1.5 transition hover:bg-slate-100"
        title="View Product"
      >
        <Eye size={16} />
      </button>

      <button
        className="rounded-md p-1.5 transition hover:bg-slate-100"
        title="Edit Product"
      >
        <Pencil size={16} />
      </button>

    </div>
  );
} 