import { Suspense } from "react";

import PurchaseDashboard from "@/components/purchase/PurchaseDashboard";

export default function PurchaseDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[1700px] px-6 py-8 text-sm text-slate-500">
          Loading purchase workspace…
        </div>
      }
    >
      <PurchaseDashboard />
    </Suspense>
  );
}
