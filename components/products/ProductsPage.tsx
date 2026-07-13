"use client";

import ProductControlHeader from "./ProductControlHeader";
import ProductKPIStrip from "./ProductKPIStrip";
import ProductToolbar from "./toolbar/ProductToolbar";
import ProductDataTable from "./table/ProductDataTable";

import ProductPagination from "@/components/shared/pagination/ProductPagination";

import { useProducts } from "@/hooks/useProducts";

export default function ProductsPage() {
  const {
    products,
    loading,
  } = useProducts();

  return (
    <div className="space-y-5">

      <ProductControlHeader />

      <ProductKPIStrip />

      <ProductToolbar />

      <ProductDataTable
        products={products}
        loading={loading}
      />

      <ProductPagination />

    </div>
  );
}