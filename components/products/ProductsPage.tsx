"use client";

import { useState } from "react";

import ProductControlHeader from "./ProductControlHeader";
import ProductKPIStrip from "./ProductKPIStrip";
import ProductToolbar from "./toolbar/ProductToolbar";
import ProductDataTable from "./table/ProductDataTable";

import ProductPagination from "@/components/shared/pagination/ProductPagination";

import { useProducts } from "@/hooks/useProducts";

import type { ProductFilters } from "@/lib/services/product.service";

const defaultFilters: ProductFilters = {
  search: "",
  marketplace: "all",
  category: "all",
  status: "all",
};

export default function ProductsPage() {
  const [filters, setFilters] =
    useState<ProductFilters>(defaultFilters);

  const {
    products,
    loading,
  } = useProducts(filters);

  return (
    <div className="space-y-5">

      <ProductControlHeader />

      <ProductKPIStrip />

      <ProductToolbar
        filters={filters}
        onFiltersChange={setFilters}
      />

      <ProductDataTable
        products={products}
        loading={loading}
      />

      <ProductPagination />

    </div>
  );
}