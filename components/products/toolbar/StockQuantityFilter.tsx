"use client";

import FilterRange from "@/components/shared/filters/FilterRange";
import FilterSection from "@/components/shared/filters/FilterSection";

import type { ProductFilters } from "@/lib/types/product-filter";

interface StockQuantityFilterProps {
  filters: ProductFilters;
  onFiltersChange: (
    filters: ProductFilters
  ) => void;
}

export default function StockQuantityFilter({
  filters,
  onFiltersChange,
}: StockQuantityFilterProps) {
  return (
    <FilterSection title="Stock Quantity">
      <FilterRange
        min={filters.stockQuantity.min}
        max={filters.stockQuantity.max}
        minPlaceholder="Minimum Stock"
        maxPlaceholder="Maximum Stock"
        onMinChange={(min) =>
          onFiltersChange({
            ...filters,
            stockQuantity: {
              ...filters.stockQuantity,
              min,
            },
          })
        }
        onMaxChange={(max) =>
          onFiltersChange({
            ...filters,
            stockQuantity: {
              ...filters.stockQuantity,
              max,
            },
          })
        }
      />
    </FilterSection>
  );
}