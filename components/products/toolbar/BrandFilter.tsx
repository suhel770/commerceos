"use client";

import { useMemo } from "react";
import FilterCheckboxGroup from "@/components/shared/filters/FilterCheckboxGroup";
import FilterSection from "@/components/shared/filters/FilterSection";

import type { ProductFilters } from "@/lib/types/product-filter";
import type { Product } from "@/lib/types/product";

interface BrandFilterProps {
  products?: Product[];
  filters: ProductFilters;
  onFiltersChange: (
    filters: ProductFilters
  ) => void;
}

export default function BrandFilter({
  products = [],
  filters,
  onFiltersChange,
}: BrandFilterProps) {
  const brandOptions = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      if (p.brand && p.brand.trim() && p.brand.trim() !== "CommerceOS") {
        const b = p.brand.trim();
        map.set(b, (map.get(b) || 0) + 1);
      }
    }
    return Array.from(map.entries()).map(([brand, count]) => ({
      value: brand,
      label: brand,
      count,
    }));
  }, [products]);

  if (brandOptions.length === 0) {
    return null;
  }

  return (
    <FilterSection title="Brand">
      <FilterCheckboxGroup
        value={filters.brands}
        options={brandOptions}
        onChange={(brands) =>
          onFiltersChange({
            ...filters,
            brands,
          })
        }
      />
    </FilterSection>
  );
}