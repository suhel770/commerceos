"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Download, Search, Filter, Boxes, Plus } from "lucide-react";
import ConsumablesKPIStrip from "./ConsumablesKPIStrip";
import ConsumablesDataTable from "./ConsumablesDataTable";
import ProductControlHeader from "../ProductControlHeader";
import ProductPagination from "@/components/shared/pagination/ProductPagination";
import type { ConsumableItem } from "@/lib/consumables/consumable.service";
import { safeResponseJson } from "@/lib/api/client";
import CommerceSelect from "@/components/ui/CommerceSelect";

const statusOptions = [
  { value: "all", label: "All Statuses" },
  { value: "In Stock", label: "In Stock" },
  { value: "Low Stock", label: "Low Stock" },
  { value: "Out of Stock", label: "Out of Stock" },
];

const typeOptions = [
  { value: "all", label: "All Types" },
  { value: "packaging", label: "Packaging Material" },
  { value: "shipping", label: "Shipping Box" },
  { value: "office", label: "Office Supply" },
];

const modeOptions = [
  { value: "all", label: "All Modes" },
  { value: "PER_UNIT", label: "Per Unit" },
  { value: "PER_ORDER", label: "Per Order" },
  { value: "PER_SHIPMENT", label: "Per Shipment" },
  { value: "FIXED_PER_PACK", label: "Fixed Per Pack" },
];

export default function ConsumablesPage() {
  const router = useRouter();
  const [consumables, setConsumables] = useState<ConsumableItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [trackConsumables, setTrackConsumables] = useState(true);
  const [checkingSettings, setCheckingSettings] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [typeFilter, setTypeFilter] = useState("all");
  const [warehouseFilter, setWarehouseFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [storageLocations, setStorageLocations] = useState<{ id: string; name: string }[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newCategory, setNewCategory] = useState("Packaging Supplies");
  const [newStock, setNewStock] = useState(0);
  const [newCost, setNewCost] = useState(0);
  const [newUnit, setNewUnit] = useState("pcs");
  const [submitting, setSubmitting] = useState(false);
  const [addError, setAddError] = useState("");

  useEffect(() => {
    fetch("/api/v1/storage/locations")
      .then((res) => res.json())
      .then((json) => {
        if (json?.success && Array.isArray(json.data)) {
          setStorageLocations(json.data);
        }
      })
      .catch(() => {});
  }, []);

  const warehouseOptions = useMemo(() => {
    return [
      { value: "all", label: "All Warehouses" },
      ...storageLocations.map((loc) => ({
        value: loc.id,
        label: loc.name,
      })),
    ];
  }, [storageLocations]);

  const handleCreateConsumable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku.trim() || !newName.trim()) {
      setAddError("SKU and Name are required");
      return;
    }
    setSubmitting(true);
    setAddError("");
    try {
      const res = await fetch("/api/v1/products/consumables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sku: newSku,
          name: newName,
          category: newCategory,
          available: newStock,
          unitCost: newCost,
          unit: newUnit,
        }),
      });
      const json = await res.json();
      if (json?.success) {
        setShowAddModal(false);
        setNewSku("");
        setNewName("");
        setNewStock(0);
        setNewCost(0);
        setNewUnit("pcs");
        void loadConsumables();
      } else {
        setAddError(json?.error || "Failed to create consumable");
      }
    } catch {
      setAddError("Internal server error");
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch settings and consumables
  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/settings/business");
      const json = await res.json();
      if (json?.success && json.data) {
        setTrackConsumables(json.data.trackConsumables !== false);
      }
    } catch {} finally {
      setCheckingSettings(false);
    }
  }, []);

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
    void fetchSettings();
  }, [fetchSettings]);

  useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent;
      const enabled = customEvent.detail;
      if (enabled === false) {
        setIsFading(true);
        const timer = setTimeout(() => {
          setTrackConsumables(false);
          router.push("/products");
        }, 1200);
        return () => clearTimeout(timer);
      } else {
        setTrackConsumables(true);
        setIsFading(false);
      }
    };
    window.addEventListener("commerceos_toggle_track_consumables", handleToggle);
    return () => {
      window.removeEventListener("commerceos_toggle_track_consumables", handleToggle);
    };
  }, [router]);

  useEffect(() => {
    if (!trackConsumables) return;
    void loadConsumables();
    const handleUpdate = () => void loadConsumables();
    window.addEventListener("commerceos_stock_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("commerceos_stock_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadConsumables, trackConsumables]);

  const filteredConsumables = useMemo(() => {
    return consumables.filter((c) => {
      // Type/Category filter
      if (typeFilter !== "all") {
        const categoryMap: Record<string, string> = {
          packaging: "Packaging Supplies",
          shipping: "Shipping Box",
          office: "Office Supplies",
        };
        const mappedCategory = categoryMap[typeFilter];
        if (mappedCategory && c.category.toLowerCase() !== mappedCategory.toLowerCase()) {
          return false;
        }
      }
      // Warehouse filter
      if (warehouseFilter !== "all") {
        if (c.locationId !== warehouseFilter && c.storageLocationName !== warehouseFilter) {
          return false;
        }
      }
      return true;
    });
  }, [consumables, typeFilter, warehouseFilter]);

  const totalItems = filteredConsumables.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleConsumables = filteredConsumables.slice((safePage - 1) * pageSize, safePage * pageSize);

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

  if (checkingSettings) {
    return (
      <div className="flex h-60 items-center justify-center">
        <span className="text-xs font-semibold text-slate-500 animate-pulse">Loading settings...</span>
      </div>
    );
  }

  if (!trackConsumables) {
    return (
      <div className="space-y-5">
        <ProductControlHeader />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-200/80 bg-white p-12 text-center shadow-2xs">
          <Boxes className="h-10 w-10 text-slate-300 mb-3" />
          <h3 className="text-base font-bold text-slate-900">Consumables Tracking is Disabled</h3>
          <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
            Operational packaging supplies and warehouse consumable inventory tracking is currently turned off for this workspace.
          </p>
          <button
            type="button"
            onClick={async () => {
              setTrackConsumables(true);
              window.dispatchEvent(new CustomEvent("commerceos_toggle_track_consumables", { detail: true }));
              try {
                await fetch("/api/v1/settings/business", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ trackConsumables: true }),
                });
              } catch {}
            }}
            className="mt-5 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow-2xs"
          >
            Enable Consumables Tracking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-5 transition-all duration-1000 ease-in-out ${isFading ? "opacity-0 scale-[0.98] blur-[2px] brightness-50 pointer-events-none" : "opacity-100 scale-100 blur-none brightness-100"}`}>
      <ProductControlHeader />

      <ConsumablesKPIStrip consumables={consumables} />

      {/* Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-md">
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

          <div className="flex flex-wrap items-center gap-2">
            <CommerceSelect
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setPage(1);
              }}
              options={statusOptions}
              searchable={false}
              size="sm"
              className="w-[140px]"
            />

            <CommerceSelect
              value={typeFilter}
              onChange={(val) => {
                setTypeFilter(val);
                setPage(1);
              }}
              options={typeOptions}
              searchable={false}
              size="sm"
              className="w-[140px]"
            />

            <CommerceSelect
              value={warehouseFilter}
              onChange={(val) => {
                setWarehouseFilter(val);
                setPage(1);
              }}
              options={warehouseOptions}
              searchable={false}
              size="sm"
              className="w-[140px]"
            />

            <CommerceSelect
              value={modeFilter}
              onChange={(val) => {
                setModeFilter(val);
                setPage(1);
              }}
              options={modeOptions}
              searchable={false}
              size="sm"
              className="w-[140px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <Plus className="h-4 w-4 text-slate-500" />
            Add Consumable
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Import
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export
          </button>
        </div>
      </div>

      {/* Data Table */}
      <ConsumablesDataTable
        consumables={visibleConsumables}
        loading={loading}
        isCatalogEmpty={consumables.length === 0}
        onAddTrigger={() => setShowAddModal(true)}
      />

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

      {showAddModal && mounted && typeof document !== "undefined" && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-150 p-6 max-w-md w-full mx-4 shadow-xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-base font-bold text-slate-900">Add Packaging Consumable</h3>
            <p className="mt-1 text-xs text-slate-400">Introduce new packaging materials or supplies to your catalog.</p>

            {addError && (
              <div className="mt-3 rounded-lg bg-rose-50 border border-rose-100 p-2.5 text-[11px] text-rose-700">
                {addError}
              </div>
            )}

            <form onSubmit={handleCreateConsumable} className="mt-4 space-y-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Material Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Bubble Wrap Roll"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">SKU</label>
                  <input
                    type="text"
                    required
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    placeholder="e.g. pkg-bubble-wrap"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Category</label>
                  <CommerceSelect
                    value={newCategory}
                    onChange={(val) => setNewCategory(val)}
                    options={[
                      { value: "Packaging Supplies", label: "Packaging Supplies" },
                      { value: "Shipping Supplies", label: "Shipping Supplies" },
                      { value: "Office Supplies", label: "Office Supplies" },
                    ]}
                    searchable={false}
                    size="md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={newStock}
                    onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Unit Cost (INR)</label>
                  <input
                    type="number"
                    min="0"
                    value={newCost}
                    onChange={(e) => setNewCost(parseFloat(e.target.value) || 0)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Unit</label>
                  <input
                    type="text"
                    required
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="pcs"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 mt-5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-60"
                >
                  {submitting ? "Creating..." : "Create Material"}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
