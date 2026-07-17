"use client";

import { OVERVIEW_SECTIONS } from "../registry/studio-sections";

import type { Product } from "@/lib/types/product";

interface OverviewTabProps {
  product: Product;
}

export default function OverviewTab({
  product,
}: OverviewTabProps) {
  return (
    <div className="space-y-6">
      {OVERVIEW_SECTIONS.map((section) => {
        const Component = section.component;

        return (
          <Component
            key={section.id}
            product={product}
          />
        );
      })}
    </div>
  );
}