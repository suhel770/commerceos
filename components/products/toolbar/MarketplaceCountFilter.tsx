"use client";

import FilterCheckboxGroup from "@/components/shared/filters/FilterCheckboxGroup";
import FilterSection from "@/components/shared/filters/FilterSection";

import type { ProductFilters } from "@/lib/types/product-filter";

interface MarketplaceCountFilterProps {
  filters: ProductFilters;
  onFiltersChange: (
    filters: ProductFilters
  ) => void;
}

const MARKETPLACE_COUNT_OPTIONS = [
  {
    value: "1",
    label: "Listed on 1 Marketplace",
  },
  {
    value: "2",
    label: "Listed on 2+ Marketplaces",
  },
  {
    value: "3",
    label: "Listed on 3+ Marketplaces",
  },
];

export default function MarketplaceCountFilter({
  filters,
  onFiltersChange,
}: MarketplaceCountFilterProps) {
  return (
    <FilterSection title="Marketplace Count">
      <FilterCheckboxGroup
        value={filters.marketplaceCount}
        options={MARKETPLACE_COUNT_OPTIONS}
        onChange={(marketplaceCount) =>
          onFiltersChange({
            ...filters,
            marketplaceCount,
          })
        }
      />
    </FilterSection>
  );
}