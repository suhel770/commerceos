"use client";

import FilterCheckboxGroup from "@/components/shared/filters/FilterCheckboxGroup";
import FilterSection from "@/components/shared/filters/FilterSection";

import type { ProductFilters } from "@/lib/types/product-filter";

interface BrandFilterProps {
  filters: ProductFilters;
  onFiltersChange: (
    filters: ProductFilters
  ) => void;
}

const BRAND_OPTIONS = [
  {
    value: "lilwalk",
    label: "LilWalk",
    count: 18,
  },
  {
    value: "nike",
    label: "Nike",
    count: 6,
  },
  {
    value: "puma",
    label: "Puma",
    count: 3,
  },
];

export default function BrandFilter({
  filters,
  onFiltersChange,
}: BrandFilterProps) {
  return (
    <FilterSection title="Brand">
      <FilterCheckboxGroup
        value={filters.brands}
        options={BRAND_OPTIONS}
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