"use client";

import FilterCheckboxGroup from "@/components/shared/filters/FilterCheckboxGroup";
import FilterSection from "@/components/shared/filters/FilterSection";

import type { ProductFilters } from "@/lib/types/product-filter";

interface ProductHealthFilterProps {
  filters: ProductFilters;
  onFiltersChange: (
    filters: ProductFilters
  ) => void;
}

const PRODUCT_HEALTH_OPTIONS = [
  {
    value: "excellent",
    label: "Excellent",
  },
  {
    value: "good",
    label: "Good",
  },
  {
    value: "attention",
    label: "Needs Attention",
  },
];

export default function ProductHealthFilter({
  filters,
  onFiltersChange,
}: ProductHealthFilterProps) {
  return (
    <FilterSection title="Product Health">
      <FilterCheckboxGroup
        value={filters.productHealth}
        options={PRODUCT_HEALTH_OPTIONS}
        onChange={(productHealth) =>
          onFiltersChange({
            ...filters,
            productHealth,
          })
        }
      />
    </FilterSection>
  );
}