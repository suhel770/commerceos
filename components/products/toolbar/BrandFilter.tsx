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

const BRAND_OPTIONS: Array<{
  value: string;
  label: string;
  count: number;
}> = [];

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