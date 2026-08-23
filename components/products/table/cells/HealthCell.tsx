"use client";

import { useMemo } from "react";
import { calculateProductHealth } from "@/lib/products/health-score";
import type { Product } from "@/lib/types/product";

interface HealthCellProps {
  product: Product;
}

export default function HealthCell({ product }: HealthCellProps) {
  const health = useMemo(() => calculateProductHealth(product), [product]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold ${health.badgeClass}`}
        >
          {health.score}%
        </span>
      </div>

      <span className={`mt-0.5 text-[10px] font-medium ${health.colorClass}`}>
        {health.grade}
      </span>
    </div>
  );
}