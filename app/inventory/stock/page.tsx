import { Suspense } from "react";
import StockInventoryWorkspace from "@/components/inventory/StockInventoryWorkspace";

export default function StockInventoryPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1400px] px-6 py-8 text-sm text-slate-500">
          Loading stock inventory ledger…
        </div>
      }
    >
      <StockInventoryWorkspace />
    </Suspense>
  );
}
