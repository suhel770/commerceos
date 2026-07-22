"use client";

import FilterRange from "@/components/shared/filters/FilterRange";
import FilterSection from "@/components/shared/filters/FilterSection";

import type { ProductFilters } from "@/lib/types/product-filter";

interface SellingPriceFilterProps {
  filters: ProductFilters;
  onFiltersChange: (
    filters: ProductFilters
  ) => void;
}

export default function SellingPriceFilter({
  filters,
  onFiltersChange,
}: SellingPriceFilterProps) {
  return (
    <FilterSection title="Selling Price">
      <FilterRange
        min={filters.sellingPrice.min}
        max={filters.sellingPrice.max}
        minPlaceholder="Minimum Price"
        maxPlaceholder="Maximum Price"
        onMinChange={(min) =>
          onFiltersChange({
            ...filters,
            sellingPrice: {
              ...filters.sellingPrice,
              min,
            },
          })
        }
        onMaxChange={(max) =>
          onFiltersChange({
            ...filters,
            sellingPrice: {
              ...filters.sellingPrice,
              max,
            },
          })
        }
      />
    </FilterSection>
  );
}