"use client";

import type { ProductFilters } from "@/lib/types/product-filter";

import BrandFilter from "./BrandFilter";
import SellingPriceFilter from "./SellingPriceFilter";
import CostPriceFilter from "./CostPriceFilter";
import ProfitMarginFilter from "./ProfitMarginFilter";
import StockStatusFilter from "./StockStatusFilter";
import StockQuantityFilter from "./StockQuantityFilter";
import MarketplaceCountFilter from "./MarketplaceCountFilter";
import ProductHealthFilter from "./ProductHealthFilter";

interface ProductFiltersContentProps {
  filters: ProductFilters;
  onFiltersChange: (
    filters: ProductFilters
  ) => void;
}

export default function ProductFiltersContent({
  filters,
  onFiltersChange,
}: ProductFiltersContentProps) {
  return (
    <div className="space-y-2">

      <BrandFilter
        filters={filters}
        onFiltersChange={onFiltersChange}
      />

      <SellingPriceFilter
        filters={filters}
        onFiltersChange={onFiltersChange}
      />

      <CostPriceFilter
        filters={filters}
        onFiltersChange={onFiltersChange}
      />

      <ProfitMarginFilter
        filters={filters}
        onFiltersChange={onFiltersChange}
      />

      <StockStatusFilter
        filters={filters}
        onFiltersChange={onFiltersChange}
      />

      <StockQuantityFilter
        filters={filters}
        onFiltersChange={onFiltersChange}
      />

      <MarketplaceCountFilter
        filters={filters}
        onFiltersChange={onFiltersChange}
      />

      <ProductHealthFilter
        filters={filters}
        onFiltersChange={onFiltersChange}
      />

    </div>
  );
}