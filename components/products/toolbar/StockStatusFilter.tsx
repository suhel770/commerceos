"use client";

import FilterRadioGroup from "@/components/shared/filters/FilterRadioGroup";
import FilterSection from "@/components/shared/filters/FilterSection";

import type { ProductFilters } from "@/lib/types/product-filter";

interface StockStatusFilterProps {
  filters: ProductFilters;
  onFiltersChange: (
    filters: ProductFilters
  ) => void;
}

const STOCK_STATUS_OPTIONS = [
  {
    value: "any",
    label: "Any",
  },
  {
    value: "in-stock",
    label: "In Stock",
  },
  {
    value: "low-stock",
    label: "Low Stock",
  },
  {
    value: "out-of-stock",
    label: "Out of Stock",
  },
];

export default function StockStatusFilter({
  filters,
  onFiltersChange,
}: StockStatusFilterProps) {
  return (
    <FilterSection title="Stock Status">
      <FilterRadioGroup
        value={filters.stockStatus[0] ?? "any"}
        options={STOCK_STATUS_OPTIONS}
        onChange={(value) =>
          onFiltersChange({
            ...filters,
            stockStatus:
              value === "any" ? [] : [value],
          })
        }
      />
    </FilterSection>
  );
}