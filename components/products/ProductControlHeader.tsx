"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Plus, Download, Package, Boxes, ToggleLeft, ToggleRight, LayoutDashboard } from "lucide-react";
import { useProducts } from "@/hooks/useProducts";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface ProductControlHeaderProps {
  onAddProductClick?: () => void;
  onImportClick?: () => void;
}

export default function ProductControlHeader({
  onAddProductClick,
  onImportClick,
}: ProductControlHeaderProps) {
  const pathname = usePathname();
  const { products } = useProducts();
  const [exporting, setExporting] = useState(false);
  const [trackConsumables, setTrackConsumables] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch from workspace settings API on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/v1/settings/business");
        const json = await res.json();
        if (json?.success && json.data) {
          const enabled = json.data.trackConsumables !== false;
          setTrackConsumables(enabled);
          localStorage.setItem("commerceos_track_consumables", String(enabled));
        }
      } catch {}
    };
    fetchSettings();
  }, []);

  const handleToggleConsumables = () => {
    if (trackConsumables) {
      setShowConfirm(true);
    } else {
      void updateSetting(true);
    }
  };

  const updateSetting = async (enabled: boolean) => {
    setTrackConsumables(enabled);
    localStorage.setItem("commerceos_track_consumables", String(enabled));
    
    // Dispatch a custom event to notify other components (like product forms/details)
    window.dispatchEvent(new CustomEvent("commerceos_toggle_track_consumables", { detail: enabled }));

    try {
      await fetch("/api/v1/settings/business", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackConsumables: enabled }),
      });
    } catch {}
  };

  const isOverview = pathname === "/products";
  const isList = pathname === "/products/list";
  const isConsumables = pathname === "/products/consumables";

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
        "Category",
        "Brand",
        "Selling Price",
        "Cost Price",
        "ATS",
        "Status",
      ];
      const rows = products.map((p) => [
        p.sku,
        p.name,
        p.category,
        p.brand,
        p.pricing?.sellingPrice || 0,
        p.pricing?.costPrice || 0,
        p.inventory?.available || 0,
        p.status,
      ]);
      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `products_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {}
    setExporting(false);
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Product Control Center
          </h1>
          <p className="text-xs text-slate-500">
            Authoritative product & packaging management layer.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Add Product Primary CTA */}
          {onAddProductClick && (
            <button
              type="button"
              onClick={onAddProductClick}
              className="flex h-9 items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-slate-800 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Product</span>
            </button>
          )}

          {/* Import */}
          {onImportClick && (
            <button
              type="button"
              onClick={onImportClick}
              className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 cursor-pointer"
            >
              <span>Import</span>
            </button>
          )}

          {/* Track Consumables Toggle */}
          <button
            type="button"
            onClick={handleToggleConsumables}
            className={`flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold shadow-2xs transition duration-200 select-none cursor-pointer ${
              trackConsumables
                ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/80"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Boxes className={`h-3.5 w-3.5 transition-colors duration-300 ${
              trackConsumables ? "text-emerald-600" : "text-slate-500"
            }`} />
            <span>Consumables</span>
            {trackConsumables ? (
              <ToggleRight className="h-4 w-4 text-emerald-600 transition-all duration-200" />
            ) : (
              <ToggleLeft className="h-4 w-4 text-slate-400 transition-all duration-200" />
            )}
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={exporting}
            className="flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-500" />
            <span>{exporting ? "Exporting..." : "Export CSV"}</span>
          </button>
        </div>
      </div>

      {/* Primary Section Switcher */}
      <div className="flex items-center gap-1 border-b border-slate-200 pb-1.5">
        <Link
          href="/products"
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            isOverview
              ? "bg-blue-50 text-blue-700 shadow-2xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <LayoutDashboard className="h-3.5 w-3.5" />
          <span>Overview</span>
        </Link>

        <Link
          href="/products/list"
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            isList
              ? "bg-blue-50 text-blue-700 shadow-2xs"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Package className="h-3.5 w-3.5" />
          <span>Product List</span>
        </Link>

        {trackConsumables && (
          <Link
            href="/products/consumables"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              isConsumables
                ? "bg-blue-50 text-blue-700 shadow-2xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Boxes className="h-3.5 w-3.5" />
            <span>Consumables & Packaging</span>
          </Link>
        )}
      </div>

      {showConfirm && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-150 p-6 max-w-md w-full mx-4 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-slate-900">
              Disable Consumable Tracking?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              Consumable tracking will be hidden for this workspace. Your existing configuration and history will be preserved and can be restored anytime.
            </p>
            <div className="flex justify-end gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  void updateSetting(false);
                }}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Turn Off
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}