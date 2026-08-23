"use client";

import { usePathname } from "next/navigation";
import AppShell from "@/components/layout/AppShell";

function InventorySectionTitle({ section }: { section: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-xl font-bold text-slate-900">Inventory</span>
      <span className="text-lg font-semibold text-slate-300">/</span>
      <span className="text-base font-semibold text-slate-600">{section}</span>
    </span>
  );
}

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isStock = pathname.startsWith("/inventory/stock");

  return (
    <AppShell
      title={
        isStock ? (
          <InventorySectionTitle section="Stock Inventory" />
        ) : (
          "Inventory"
        )
      }
      subtitle={
        isStock
          ? "Search, manage, and monitor every inventory SKU"
          : "Stock engine, channel allocation, and decision intelligence"
      }
    >
      <div className="mx-auto w-full max-w-[1700px] px-4 sm:px-6 py-3">
        {children}
      </div>
    </AppShell>
  );
}
