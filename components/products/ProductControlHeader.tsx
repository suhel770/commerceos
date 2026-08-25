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
          {/* Futuristic/Premium Track Consumables Toggle */}
          <div className="flex h-[42px] items-center gap-2.5 rounded-2xl border border-slate-200/80 bg-white/40 backdrop-blur-md px-4 shadow-[0_2px_8px_rgba(15,23,42,0.03)] transition duration-200 hover:border-slate-300 hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
            <Boxes className={`h-4 w-4 shrink-0 transition-colors duration-300 ${
              trackConsumables ? "text-emerald-500" : "text-slate-400"
            }`} />
            
            <span className="text-xs font-extrabold tracking-tight text-slate-700 select-none mr-1">
              Track Consumables
            </span>

            {/* Custom Interactive Toggle Switch */}
            <button
              type="button"
              onClick={handleToggleConsumables}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-hidden ${
                trackConsumables
                  ? "bg-linear-to-r from-emerald-500 to-teal-500 shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  : "bg-slate-200"
              }`}
            >
              <span
                className={`pointer-events-none flex items-center justify-center h-5 w-5 transform rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.15)] ring-0 transition duration-300 ease-in-out ${
                  trackConsumables ? "translate-x-5" : "translate-x-0"
                }`}
              >
                {trackConsumables ? (
                  <Check className="h-3 w-3 text-emerald-600 stroke-[3px] transition-all duration-300" />
                ) : (
                  <X className="h-2.5 w-2.5 text-slate-400 stroke-[3px] transition-all duration-300" />
                )}
              </span>
            </button>

            {/* Micro Status Label */}
            <span
              className={`text-[9px] uppercase tracking-widest font-black transition-all duration-300 select-none w-7 text-right ${
                trackConsumables ? "text-emerald-600 drop-shadow-[0_0_6px_rgba(16,185,129,0.1)]" : "text-slate-400"
              }`}
            >
              {trackConsumables ? "ON" : "OFF"}
            </span>
          </div>

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