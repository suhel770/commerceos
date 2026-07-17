"use client";

import FilterRange from "@/components/shared/filters/FilterRange";
import FilterSection from "@/components/shared/filters/FilterSection";

import type { ProductFilters } from "@/lib/types/product-filter";

interface ProfitMarginFilterProps {
  filters: ProductFilters;
  onFiltersChange: (
    filters: ProductFilters
  ) => void;
}

export default function ProfitMarginFilter({
  filters,
  onFiltersChange,
}: ProfitMarginFilterProps) {
  return (
    <FilterSection title="Profit Margin">
      <FilterRange
        min={filters.profitMargin.min}
        max={filters.profitMargin.max}
        minPlaceholder="Minimum Margin %"
        maxPlaceholder="Maximum Margin %"
        onMinChange={(min) =>
          onFiltersChange({
            ...filters,
            profitMargin: {
              ...filters.profitMargin,
              min,
            },
          })
        }
        onMaxChange={(max) =>
          onFiltersChange({
            ...filters,
            profitMargin: {
              ...filters.profitMargin,
              max,
            },
          })
        }
      />
    </FilterSection>
  );
}