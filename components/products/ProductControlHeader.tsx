"use client";

import { useState, useEffect } from "react";
import { Plus, Download, Package, Boxes, Check, X } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ProductControlHeader() {
  const pathname = usePathname();
  const { products } = useProducts();
  const [exporting, setExporting] = useState(false);
  const [trackConsumables, setTrackConsumables] = useState(true);

  // Safely read from localStorage on client-side mount to prevent Next.js hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem("commerceos_track_consumables");
    if (saved !== null) {
      setTrackConsumables(saved !== "false");
    }
  }, []);

  const handleToggleConsumables = () => {
    const nextVal = !trackConsumables;
    setTrackConsumables(nextVal);
    localStorage.setItem("commerceos_track_consumables", String(nextVal));
    
    // Dispatch a custom event to notify other components (like product forms/details)
    window.dispatchEvent(new CustomEvent("commerceos_toggle_track_consumables", { detail: nextVal }));
  };

  const isConsumables = pathname?.startsWith("/products/consumables");

  const handleExportCSV = () => {
    if (!products || products.length === 0) {
      alert("No sellable products to export.");
      return;
    }

    setExporting(true);
    try {
      const headers = [
        "SKU",
        "Product Name",
        "Brand",
        "Category",
        "ATS (Sellable Stock)",
        "Reserved",
        "Damaged",
        "Selling Price",
        "Cost Price",
        "MRP",
        "Listing Status",
      ];

      const rows = products.map((p) => [
        `"${p.sku}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${p.brand || "CommerceOS"}"`,
        `"${p.category || ""}"`,
        p.inventory?.available ?? 0,
        p.inventory?.reserved ?? 0,
        p.inventory?.damaged ?? 0,
        p.pricing?.sellingPrice ?? 0,
        p.pricing?.costPrice ?? 0,
        p.pricing?.mrp ?? 0,
        `"${p.status || "Active"}"`,
      ]);

      const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `CommerceOS_Product_Catalog_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Product Control Center
          </h1>
          <p className="mt-0.5 text-xs font-semibold text-slate-500">
            Authoritative product & packaging management layer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Track Consumables Toggle (Matched to Export CSV size) */}
          <button
            type="button"
            onClick={handleToggleConsumables}
            className={`flex h-[42px] items-center gap-1.5 rounded-2xl border px-4 text-xs font-bold shadow-2xs transition duration-200 select-none ${
              trackConsumables
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/80"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Boxes className={`h-4 w-4 transition-colors duration-300 ${
              trackConsumables ? "text-emerald-600" : "text-slate-500"
            }`} />
            <span>Consumables: {trackConsumables ? "ON" : "OFF"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex h-[42px] items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-60"
          >
            <Download className="h-4 w-4 text-slate-500" />
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Primary Section Switcher */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-2">
        <Link
          href="/products"
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
            !isConsumables
              ? "bg-blue-50 text-blue-700 shadow-2xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Sellable Products</span>
        </Link>

        {trackConsumables && (
          <Link
            href="/products/consumables"
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
              isConsumables
                ? "bg-blue-50 text-blue-700 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Boxes className="h-4 w-4" />
            <span>Consumables & Packaging</span>
          </Link>
        )}
      </div>
    </div>
  );
}