"use client";

import FilterRange from "@/components/shared/filters/FilterRange";
import FilterSection from "@/components/shared/filters/FilterSection";

import type { ProductFilters } from "@/lib/types/product-filter";

interface CostPriceFilterProps {
  filters: ProductFilters;
  onFiltersChange: (
    filters: ProductFilters
  ) => void;
}

export default function CostPriceFilter({
  filters,
  onFiltersChange,
}: CostPriceFilterProps) {
  return (
    <FilterSection title="Cost Price">
      <FilterRange
        min={filters.costPrice.min}
        max={filters.costPrice.max}
        minPlaceholder="Minimum Cost"
        maxPlaceholder="Maximum Cost"
        onMinChange={(min) =>
          onFiltersChange({
            ...filters,
            costPrice: {
              ...filters.costPrice,
              min,
            },
          })
        }
        onMaxChange={(max) =>
          onFiltersChange({
            ...filters,
            costPrice: {
              ...filters.costPrice,
              max,
            },
          })
        }
      />
    </FilterSection>
  );
}