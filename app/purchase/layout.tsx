"use client";

import { usePathname } from "next/navigation";

import AppShell from "@/components/layout/AppShell";

function PurchaseSectionTitle({ section }: { section: string }) {
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className="text-xl font-bold text-slate-900">Purchase</span>
      <span className="text-lg font-semibold text-slate-300">/</span>
      <span className="text-base font-semibold text-slate-600">{section}</span>
    </span>
  );
}

export default function PurchaseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isBills = pathname.startsWith("/purchase/bills");
  const isVendors = pathname.startsWith("/purchase/vendors");

  return (
    <AppShell
      title={
        isBills ? (
          <PurchaseSectionTitle section="Bills" />
        ) : isVendors ? (
          <PurchaseSectionTitle section="Vendors" />
        ) : (
          "Purchase"
        )
      }
      subtitle={
        isBills
          ? "View and manage every outgoing purchase bill"
          : isVendors
            ? "Manage suppliers, spend, and outstanding"
            : "Every outgoing rupee starts here"
      }
    >
      {children}
    </AppShell>
  );
}
