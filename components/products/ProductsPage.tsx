"use client";

import { useState } from "react";

import ProductControlHeader from "./ProductControlHeader";
import ProductKPIStrip from "./ProductKPIStrip";
import ProductToolbar from "./toolbar/ProductToolbar";
import ProductDataTable from "./table/ProductDataTable";

import ProductPagination from "@/components/shared/pagination/ProductPagination";

import { useProducts } from "@/hooks/useProducts";

import {
  defaultProductFilters,
  type ProductFilters,
} from "@/lib/types/product-filter";

export default function ProductsPage() {
  const [filters, setFilters] = useState<ProductFilters>(defaultProductFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const { products, loading } = useProducts(filters);
  const totalItems = products.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleProducts = products.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleFiltersChange = (nextFilters: ProductFilters) => {
    setFilters(nextFilters);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <ProductControlHeader />

      <ProductKPIStrip products={products} />

      <ProductToolbar
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <ProductDataTable
        products={visibleProducts}
        loading={loading}
      />

      <ProductPagination
        page={safePage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          setPage(1);
        }}
      />
    </div>
  );
}