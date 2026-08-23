"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, Search, Filter, Boxes } from "lucide-react";
import ConsumablesKPIStrip from "./ConsumablesKPIStrip";
import ConsumablesDataTable from "./ConsumablesDataTable";
import ProductControlHeader from "../ProductControlHeader";
import ProductPagination from "@/components/shared/pagination/ProductPagination";
import type { ConsumableItem } from "@/lib/consumables/consumable.service";
import { safeResponseJson } from "@/lib/api/client";

export default function ConsumablesPage() {
  const [consumables, setConsumables] = useState<ConsumableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const loadConsumables = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/v1/products/consumables?${params.toString()}`);
      const payload = await safeResponseJson(res);
      if (payload?.success && Array.isArray(payload.data)) {
        setConsumables(payload.data);
      } else if (Array.isArray(payload)) {
        setConsumables(payload);
      } else {
        setConsumables([]);
      }
    } catch {
      setConsumables([]);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    void loadConsumables();
    const handleUpdate = () => void loadConsumables();
    window.addEventListener("commerceos_stock_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("commerceos_stock_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadConsumables]);

  const totalItems = consumables.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleConsumables = consumables.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleExportCSV = () => {
    if (consumables.length === 0) {
      alert("No consumables to export.");
      return;
    }
    const headers = ["Consumable Name", "SKU", "Category", "Available", "Used / Consumed", "Unit", "Reorder Point", "Unit Cost (INR)", "Status"];
    const rows = consumables.map((c) => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.sku}"`,
      `"${c.category}"`,
      c.available,
      c.used,
      `"${c.unit}"`,
      c.reorderPoint,
      c.unitCost,
      `"${c.status}"`,
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `CommerceOS_Consumables_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      <ProductControlHeader />

      <ConsumablesKPIStrip consumables={consumables} />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search consumable name or SKU (e.g. Box, Polybag, Mailer)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-4 text-xs font-semibold text-slate-800 placeholder-slate-400 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 transition focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              <option value="In Stock">In Stock</option>
              <option value="Low Stock">Low Stock</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export Consumables
          </button>
        </div>
      </div>

      {/* Data Table */}
      <ConsumablesDataTable consumables={visibleConsumables} loading={loading} />

      {/* Pagination */}
      <ProductPagination
        page={safePage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={setPage}
        onPageSizeChange={(nextSize) => {
          setPageSize(nextSize);
          setPage(1);
        }}
      />
    </div>
  );
}
