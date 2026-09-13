"use client";

import React, { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, CheckCircle, Upload } from "lucide-react";

import ProductControlHeader from "./ProductControlHeader";
import ProductKPIStrip from "./ProductKPIStrip";
import ProductToolbar from "./toolbar/ProductToolbar";
import ProductDataTable from "./table/ProductDataTable";
import ProductPreviewDrawer from "./ProductPreviewDrawer";
import UniversalListingDrawer from "./UniversalListingDrawer";
import BulkPublishModal from "./dialogs/BulkPublishModal";

import ProductPagination from "@/components/shared/pagination/ProductPagination";
import CommerceSelect from "@/components/ui/CommerceSelect";

import { useProducts } from "@/hooks/useProducts";
import type { Product } from "@/lib/types/product";

import { useSearchParams } from "next/navigation";

import {
  defaultProductFilters,
  type ProductFilters,
} from "@/lib/types/product-filter";

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

export default function ProductsPage() {
  const isMounted = useIsMounted();
  const searchParams = useSearchParams();

  // Parse filters from searchParams or defaults
  const parseFiltersFromParams = useCallback((): { filters: ProductFilters; page: number } => {
    const s = searchParams?.get("search") || "";
    const st = searchParams?.get("status") || "all";
    const cat = searchParams?.get("category") || "all";
    const br = searchParams?.get("brand") || "all";
    const mp = searchParams?.get("marketplace") || "all";
    const stock = searchParams?.get("stockStatus");
    const health = searchParams?.get("health");
    const pg = parseInt(searchParams?.get("page") || "1", 10) || 1;

    return {
      filters: {
        ...defaultProductFilters,
        search: s,
        status: st,
        category: cat,
        brands: br && br !== "all" ? br.split(",") : [],
        marketplace: mp,
        stockStatus: stock ? stock.split(",") : [],
        productHealth: health ? health.split(",") : [],
      },
      page: pg,
    };
  }, [searchParams]);

  const initial = parseFiltersFromParams();
  const [filters, setFilters] = useState<ProductFilters>(initial.filters);
  const [page, setPage] = useState(initial.page);
  const [pageSize, setPageSize] = useState(100);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Sync state from searchParams whenever searchParams update (e.g. Back navigation)
  useEffect(() => {
    const current = parseFiltersFromParams();
    queueMicrotask(() => {
      setFilters(current.filters);
      setPage(current.page);
    });
  }, [parseFiltersFromParams]);

  const updateUrl = (nextFilters: ProductFilters, nextPage: number) => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (nextFilters.search) params.set("search", nextFilters.search);
    if (nextFilters.status && nextFilters.status !== "all") params.set("status", nextFilters.status);
    if (nextFilters.category && nextFilters.category !== "all") params.set("category", nextFilters.category);
    if (nextFilters.brands && nextFilters.brands.length > 0) params.set("brand", nextFilters.brands.join(","));
    if (nextFilters.marketplace && nextFilters.marketplace !== "all") params.set("marketplace", nextFilters.marketplace);
    if (nextFilters.stockStatus && nextFilters.stockStatus.length > 0) params.set("stockStatus", nextFilters.stockStatus.join(","));
    if (nextFilters.productHealth && nextFilters.productHealth.length > 0) params.set("health", nextFilters.productHealth.join(","));
    if (nextPage > 1) params.set("page", String(nextPage));

    const queryString = params.toString();
    const targetUrl = queryString ? `/products/list?${queryString}` : "/products/list";
    window.history.replaceState(null, "", targetUrl);
    try {
      sessionStorage.setItem("commerceos_last_product_list_url", targetUrl);
    } catch {}
  };

  const { products, loading } = useProducts(filters, refreshTrigger);
  const totalItems = products.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleProducts = products.slice((safePage - 1) * pageSize, safePage * pageSize);

  // Inspector & modal states
  const [inspectingProduct, setInspectingProduct] = useState<Product | null>(null);
  const [universalListingProduct, setUniversalListingProduct] = useState<Product | null>(null);
  const [showBulkPublishModal, setShowBulkPublishModal] = useState(false);
  const [bulkPublishSelectedIds, setBulkPublishSelectedIds] = useState<string[]>([]);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Quick create fields
  const [newName, setNewName] = useState("");
  const [newSku, setNewSku] = useState("");
  const [newBrand, setNewBrand] = useState("");
  const [newCategory, setNewCategory] = useState("kids clogs");
  const [newSellingPrice, setNewSellingPrice] = useState(0);
  const [newCostPrice, setNewCostPrice] = useState(0);
  const [newMrp, setNewMrp] = useState(0);
  const [newAts, setNewAts] = useState(0);
  const [createError, setCreateError] = useState("");
  const [creating, setCreating] = useState(false);

  // Import fields
  const [csvText, setCsvText] = useState("");
  const [importResult, setImportResult] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  const handleFiltersChange = (nextFilters: ProductFilters) => {
    setFilters(nextFilters);
    setPage(1);
    updateUrl(nextFilters, 1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    updateUrl(filters, nextPage);
  };

  const handleInspect = (product: Product) => {
    setInspectingProduct(product);
  };

  const handleBulkAction = async (action: string, selectedIds: string[]) => {
    if (action === "publish_channels") {
      setBulkPublishSelectedIds(selectedIds);
      setShowBulkPublishModal(true);
      return;
    }

    try {
      if (action === "activate") {
        await Promise.all(
          selectedIds.map((id) =>
            fetch(`/api/v1/products/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "Active", revision: 1 }),
            })
          )
        );
      } else if (action === "deactivate") {
        await Promise.all(
          selectedIds.map((id) =>
            fetch(`/api/v1/products/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "Inactive", revision: 1 }),
            })
          )
        );
      } else if (action === "archive") {
        await Promise.all(
          selectedIds.map((id) =>
            fetch(`/api/v1/products/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "Archived", revision: 1 }),
            })
          )
        );
      } else if (action === "export") {
        const selectedList = products.filter((p) => selectedIds.includes(p.id));
        const headers = ["SKU", "Product Name", "Category", "Brand", "Selling Price", "Cost Price", "ATS", "Status"];
        const rows = selectedList.map((p) => [
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
        link.setAttribute("download", `bulk_products_export_${Date.now()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      setRefreshTrigger((prev) => prev + 1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSku.trim() || !newBrand.trim()) {
      setCreateError("Please configure Name, SKU, and Brand.");
      return;
    }
    if (newSellingPrice < 0 || newCostPrice < 0 || newMrp < 0 || newAts < 0) {
      setCreateError("Price and stock quantities must be non-negative values.");
      return;
    }

    setCreating(true);
    setCreateError("");

    const payload = {
      id: `prod-${Date.now()}`,
      identity: {
        id: `prod-${Date.now()}`,
        sku: newSku.trim(),
        productName: newName.trim(),
        brand: newBrand.trim(),
        category: newCategory,
      },
      status: "Active",
      pricing: {
        sellingPrice: Number(newSellingPrice),
        costPrice: Number(newCostPrice),
        mrp: Number(newMrp),
        currency: "INR",
      },
      inventory: {
        available: Number(newAts),
        reserved: 0,
        incoming: 0,
        safetyStock: 0,
        warehouseIds: ["LOC-0846"],
      },
      listings: [],
    };

    try {
      const res = await fetch("/api/v1/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json?.success) {
        setShowAddProductModal(false);
        setNewName("");
        setNewSku("");
        setNewBrand("");
        setNewSellingPrice(0);
        setNewCostPrice(0);
        setNewMrp(0);
        setNewAts(0);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        setCreateError(json?.error || "Failed to create catalog product.");
      }
    } catch {
      setCreateError("An unexpected error occurred during creation.");
    } finally {
      setCreating(false);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) {
      setImportResult("Please enter CSV rows first.");
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      const lines = csvText.split("\n").map((l) => l.trim()).filter(Boolean);
      let successCount = 0;
      let failCount = 0;

      // Skip header row if it starts with 'sku' or similar
      const startIdx = lines[0].toLowerCase().includes("sku") ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(",").map((p) => p.trim());
        if (parts.length < 4) {
          failCount++;
          continue;
        }

        const sku = parts[0];
        const name = parts[1];
        const category = parts[2] || "kids clogs";
        const brand = parts[3] || "CommerceOS";
        const sellingPrice = Number(parts[4]) || 0;
        const costPrice = Number(parts[5]) || 0;
        const ats = Number(parts[6]) || 0;

        const payload = {
          id: `prod-import-${Date.now()}-${i}`,
          identity: {
            id: `prod-import-${Date.now()}-${i}`,
            sku,
            productName: name,
            brand,
            category,
          },
          status: "Active",
          pricing: {
            sellingPrice,
            costPrice,
            mrp: sellingPrice * 1.5,
            currency: "INR",
          },
          inventory: {
            available: ats,
            reserved: 0,
            incoming: 0,
            safetyStock: 0,
            warehouseIds: ["LOC-0846"],
          },
          listings: [],
        };

        const res = await fetch("/api/v1/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (json?.success) {
          successCount++;
        } else {
          failCount++;
        }
      }

      setImportResult(`Successfully imported ${successCount} products. Failed items: ${failCount}`);
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      setImportResult("Failed to parse or submit imported CSV records.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-3.5">
      <ProductControlHeader
        onAddProductClick={() => setShowAddProductModal(true)}
        onImportClick={() => setShowImportModal(true)}
      />

      <ProductKPIStrip
        products={products}
        onFilterChange={(partial) => handleFiltersChange({ ...filters, ...partial })}
      />

      <ProductToolbar
        products={products}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <ProductDataTable
        products={visibleProducts}
        loading={loading}
        onViewClick={handleInspect}
        onUniversalListingClick={(p) => setUniversalListingProduct(p)}
        onBulkAction={handleBulkAction}
      />

      <ProductPagination
        page={safePage}
        pageSize={pageSize}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onPageSizeChange={(nextPageSize) => {
          setPageSize(nextPageSize);
          handlePageChange(1);
        }}
      />

      <ProductPreviewDrawer
        product={inspectingProduct}
        isOpen={inspectingProduct !== null}
        onClose={() => setInspectingProduct(null)}
      />

      <UniversalListingDrawer
        product={universalListingProduct}
        isOpen={universalListingProduct !== null}
        onClose={() => setUniversalListingProduct(null)}
        onListingUpdated={() => setRefreshTrigger((prev) => prev + 1)}
      />

      <BulkPublishModal
        selectedIds={bulkPublishSelectedIds}
        isOpen={showBulkPublishModal}
        onClose={() => setShowBulkPublishModal(false)}
        onSuccess={() => {
          setRefreshTrigger((prev) => prev + 1);
        }}
      />

      {/* Add Product Modal */}
      {isMounted && showAddProductModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <form onSubmit={handleCreateProductSubmit} className="bg-white rounded-2xl border border-slate-150 p-6 max-w-md w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-black text-slate-900">Add Sellable Product</h3>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 rounded-xl bg-rose-50 border border-rose-100 p-3 text-xs text-rose-700 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{createError}</span>
              </div>
            )}

            <div className="space-y-4 text-xs font-bold text-slate-900">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Product Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. StripeKids Outdoor Sandals"
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">SKU</label>
                  <input
                    type="text"
                    required
                    value={newSku}
                    onChange={(e) => setNewSku(e.target.value)}
                    placeholder="e.g. SR-SANDAL-BLU"
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Brand</label>
                  <input
                    type="text"
                    required
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    placeholder="e.g. StripeKids"
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Category</label>
                <CommerceSelect
                  value={newCategory}
                  onChange={(val) => setNewCategory(val)}
                  options={[
                    { value: "kids clogs", label: "Kids Clogs" },
                    { value: "kids sandals", label: "Kids Sandals" },
                    { value: "accessories", label: "Accessories" },
                    { value: "packaging", label: "Packaging Supplies" },
                  ]}
                  searchable={false}
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Selling Price</label>
                  <input
                    type="number"
                    min="0"
                    value={newSellingPrice}
                    onChange={(e) => setNewSellingPrice(Number(e.target.value))}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Cost Price</label>
                  <input
                    type="number"
                    min="0"
                    value={newCostPrice}
                    onChange={(e) => setNewCostPrice(Number(e.target.value))}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">MRP</label>
                  <input
                    type="number"
                    min="0"
                    value={newMrp}
                    onChange={(e) => setNewMrp(Number(e.target.value))}
                    className="h-10 rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Initial Stock (ATS)</label>
                <input
                  type="number"
                  min="0"
                  value={newAts}
                  onChange={(e) => setNewAts(Number(e.target.value))}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-3 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
              >
                {creating ? "Creating..." : "Save Product"}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}

      {/* Import Modal */}
      {isMounted && showImportModal && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <form onSubmit={handleImportSubmit} className="bg-white rounded-2xl border border-slate-150 p-6 max-w-md w-full mx-4 shadow-xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="text-sm font-black text-slate-900">Import Product Catalog</h3>
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                  setCsvText("");
                }}
                className="h-6 w-6 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {importResult && (
              <div className="mb-4 rounded-xl bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800 flex items-start gap-2">
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-blue-600" />
                <span>{importResult}</span>
              </div>
            )}

            <div className="space-y-3">
              <p className="text-[11px] leading-relaxed text-slate-500 font-semibold">
                Paste comma-separated rows. Format: <br />
                <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px] text-slate-700">
                  sku, productName, category, brand, sellingPrice, costPrice, ats
                </code>
              </p>

              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="SR-CLOG-RED,StripeKids Clogs Red,kids clogs,StripeKids,599,300,100"
                rows={6}
                className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-blue-500 font-mono text-xs"
              />
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportResult(null);
                  setCsvText("");
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={importing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
              >
                <Upload size={14} />
                {importing ? "Importing..." : "Run Import"}
              </button>
            </div>
          </form>
        </div>,
        document.body
      )}
    </div>
  );
}