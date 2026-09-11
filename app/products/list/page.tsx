import React, { Suspense } from "react";
import AppShell from "@/components/layout/AppShell";
import ProductsPage from "@/components/products/ProductsPage";

export const dynamic = "force-dynamic";

export default function ProductsListRoutePage() {
  return (
    <AppShell
      title="Products"
      subtitle="Master Product Engine across sales channels and warehouses"
    >
      <div className="mx-auto w-full max-w-[1700px] px-6 py-4 lg:px-8 lg:py-5">
        <Suspense fallback={<div className="text-xs font-bold text-slate-500 py-8 text-center">Loading product list...</div>}>
          <ProductsPage />
        </Suspense>
      </div>
    </AppShell>
  );
}
