import { Suspense } from "react";
import InventoryOverviewView from "@/components/inventory/InventoryOverviewView";

export default function InventoryOverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1400px] px-6 py-8 text-sm text-slate-500">
          Loading inventory overview…
        </div>
      }
    >
      <InventoryOverviewView />
    </Suspense>
  );
}
