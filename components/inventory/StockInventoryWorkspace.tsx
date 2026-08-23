"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import Link from "next/link";
import { safeResponseJson } from "@/lib/api/client";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  Boxes,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  Coins,
  Download,
  Eye,
  FileSpreadsheet,
  Layers,
  MoreHorizontal,
  Package,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Truck,
  RotateCcw,
  X,
  Filter,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ProductPagination from "@/components/shared/pagination/ProductPagination";
import type { StockBalance } from "@/lib/inventory/types";
import type { PurchaseBill } from "@/lib/purchase/types";
import { DEFAULT_WAREHOUSE_ID } from "@/lib/inventory/types";
import {
  inventoryDecisionEngine,
  type SkuDecisionMetrics,
} from "@/lib/inventory/inventory-decision-engine";
import { channelAllocationEngine } from "@/lib/inventory/channel-allocation.engine";
import { notificationEngine } from "@/lib/core/notification-engine";
import { locationStockRepository } from "@/lib/storage/engine/receiving.engine";
import RecordUsageModal from "@/components/inventory/RecordUsageModal";
import SkuUsageHistoryTab from "@/components/inventory/SkuUsageHistoryTab";

type SortField =
  | "sku"
  | "type"
  | "productName"
  | "physical"
  | "available"
  | "reserved"
  | "used"
  | "damaged"
  | "incoming"
  | "reorderPoint"
  | "status";
type SortDirection = "asc" | "desc";

export function detectStockItemClassification(item: { sku?: string; productName?: string; intent?: string }): {
  label: string;
  badgeClass: string;
} {
  const intent = (item.intent || "").toLowerCase();
  const s = (item.sku || "").toLowerCase();
  const n = (item.productName || "").toLowerCase();

  if (
    intent === "asset" ||
    s.includes("asset") ||
    s.includes("eqp") ||
    s.includes("shelf") ||
    s.includes("rack") ||
    s.includes("scanner") ||
    n.includes("scanner") ||
    n.includes("shelf") ||
    n.includes("rack") ||
    n.includes("trolley")
  ) {
    return {
      label: "Asset",
      badgeClass: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  if (
    intent === "consumable" ||
    s.includes("box") ||
    s.includes("poly") ||
    s.includes("tape") ||
    s.includes("sticker") ||
    s.includes("bubble") ||
    s.includes("carton") ||
    s.includes("pkg") ||
    s.includes("mailer") ||
    s.includes("wrap") ||
    n.includes("box") ||
    n.includes("carton") ||
    n.includes("polybag") ||
    n.includes("tape") ||
    n.includes("packaging") ||
    n.includes("mailer") ||
    n.includes("bubble")
  ) {
    return {
      label: "Consumable",
      badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    };
  }

  return {
    label: "Sellable Good",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
}


export default function StockInventoryWorkspace() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // URL state initialization
  const initialSearch = searchParams.get("search") || "";
  const initialTab = searchParams.get("tab") || "all";
  const initialType = searchParams.get("type") || "all";
  const initialStatus = searchParams.get("status") || "all";
  const initialPage = parseInt(searchParams.get("page") || "1", 10);
  const initialLimit = parseInt(searchParams.get("limit") || "25", 10);

  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [search, setSearch] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [typeFilter, setTypeFilter] = useState<string>(initialType);
  const [statusFilter, setStatusFilter] = useState<string>(initialStatus);
  const [locationFilter, setLocationFilter] = useState<string>("all");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("sku");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialLimit);

  // Selection
  const [selectedSkus, setSelectedSkus] = useState<Set<string>>(new Set());

  // SKU 360 Inspector
  const [selectedSkuMetrics, setSelectedSkuMetrics] = useState<SkuDecisionMetrics | null>(null);
  const [skuModalTab, setSkuModalTab] = useState<
    "overview" | "balances" | "timeline" | "financials" | "marketplace" | "consumption"
  >("overview");

  // Action Modals
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [adjustSku, setAdjustSku] = useState("PROD-FOOTWEAR-001");
  const [adjustQty, setAdjustQty] = useState("10");
  const [adjustReason, setAdjustReason] = useState("Cycle Count Reconciliation Variance");
  const [isSkuDropdownOpen, setIsSkuDropdownOpen] = useState(false);
  const [skuSearchQuery, setSkuSearchQuery] = useState("");

  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [consumeSku, setConsumeSku] = useState("");
  const [consumeQty, setConsumeQty] = useState("10");
  const [consumeReason, setConsumeReason] = useState<string>("Order Packaging");
  const [consumeCustomReason, setConsumeCustomReason] = useState("");
  const [consumeRef, setConsumeRef] = useState("Order #ORD-10234");
  const [consumeLocation, setConsumeLocation] = useState("Main Facility");
  const [consumeError, setConsumeError] = useState<string | null>(null);
  const [isConsumeSkuDropdownOpen, setIsConsumeSkuDropdownOpen] = useState(false);

  // Debounced search effect (~150ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 150);
    return () => clearTimeout(timer);
  }, [search]);

  // Synchronize URL parameters
  const updateUrlParams = useCallback(() => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (activeTab !== "all") params.set("tab", activeTab);
    if (typeFilter !== "all") params.set("type", typeFilter);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (currentPage > 1) params.set("page", String(currentPage));
    if (pageSize !== 25) params.set("limit", String(pageSize));

    const queryString = params.toString();
    const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;
    window.history.replaceState(null, "", targetUrl);
  }, [debouncedSearch, activeTab, typeFilter, statusFilter, currentPage, pageSize, pathname]);

  useEffect(() => {
    updateUrlParams();
  }, [updateUrlParams]);

  // Fetch live inventory data
  const loadInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [invRes, billsRes] = await Promise.all([
        fetch("/api/v1/inventory"),
        fetch("/api/v1/purchase/bills"),
      ]);

      const invPayload = await safeResponseJson(invRes);
      const billsPayload = await safeResponseJson(billsRes);

      const data = invPayload?.data || invPayload;
      let fresh: StockBalance[] = Array.isArray(data?.balances)
        ? data.balances
        : Array.isArray(data)
          ? data
          : [];

      const dataBills = billsPayload?.data || billsPayload;
      const freshBills: PurchaseBill[] = Array.isArray(dataBills?.bills)
        ? dataBills.bills
        : Array.isArray(dataBills)
          ? dataBills
          : [];
      setBills(freshBills);

      // Merge live storage repository records
      if (typeof window !== "undefined") {
        try {
          const storageRecords = locationStockRepository.getAllBalances();
          if (storageRecords.length > 0) {
            for (const sr of storageRecords) {
              const skuTrimmed = (sr.sku || "").toLowerCase().trim();
              const matchIdx = fresh.findIndex((b) => (b.sku || "").toLowerCase().trim() === skuTrimmed);
              if (matchIdx >= 0) {
                const current = fresh[matchIdx];
                if (current) {
                  fresh[matchIdx] = {
                    ...current,
                    available: Math.max(current.available, sr.availableQty),
                    productName: current.productName || sr.productName || sr.sku,
                  };
                }
              } else {
                fresh.push({
                  id: sr.id || `stk-${sr.sku}`,
                  organizationId: "org-commerceos",
                  workspaceId: "ws-default",
                  warehouseId: sr.storageLocationId || DEFAULT_WAREHOUSE_ID,
                  productId: sr.productId || `prod-${sr.sku}`,
                  sku: sr.sku,
                  productName: sr.productName || sr.sku,
                  available: sr.availableQty,
                  reserved: 0,
                  incoming: 0,
                  damaged: 0,
                  inTransit: 0,
                  updatedAt: sr.updatedAt || new Date().toISOString(),
                });
              }
            }
          }
        } catch {}
      }

      setBalances(fresh);
    } catch (err: any) {
      setError(err?.message || "Failed to load inventory stock.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadInventory();

    const handleUpdate = () => {
      void loadInventory();
    };

    window.addEventListener("commerceos_stock_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("commerceos_stock_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [loadInventory]);

  // Compute decision metrics for all SKUs
  const skuMetricsList = useMemo(() => {
    return inventoryDecisionEngine.computeSkuDecisionMetrics(balances, bills);
  }, [balances, bills]);

  // Filtered & Sorted SKU List
  const filteredSkus = useMemo(() => {
    return skuMetricsList.filter((m) => {
      // 1. Text Search (SKU, Product Name, Category)
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const matches =
          m.sku.toLowerCase().includes(q) ||
          m.productName.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q);
        if (!matches) return false;
      }

      const isConsumable =
        String((m as any).intent || "").toLowerCase() === "consumable" ||
        m.sku.toLowerCase().includes("poly") ||
        m.productName.toLowerCase().includes("box") ||
        m.productName.toLowerCase().includes("tape") ||
        m.productName.toLowerCase().includes("wrap");

      // 2. Tab Filter
      if (activeTab === "sellable" && isConsumable) return false;
      if (activeTab === "consumable" && !isConsumable) return false;
      if (activeTab === "reorder" && !m.isReorderRequired) return false;
      if (activeTab === "damaged" && m.damagedQty <= 0) return false;

      // 3. Type Filter Dropdown
      if (typeFilter === "sellable" && isConsumable) return false;
      if (typeFilter === "consumable" && !isConsumable) return false;

      // 4. Status Filter Dropdown
      if (statusFilter === "in_stock" && m.availableQty <= 0) return false;
      if (statusFilter === "low_stock" && (!m.isReorderRequired || m.availableQty === 0)) return false;
      if (statusFilter === "out_of_stock" && m.availableQty > 0) return false;
      if (statusFilter === "overstocked" && !m.isDeadStock) return false;

      return true;
    });
  }, [skuMetricsList, debouncedSearch, activeTab, typeFilter, statusFilter]);

  // Sorting
  const sortedSkus = useMemo(() => {
    return [...filteredSkus].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (sortField === "sku") {
        valA = a.sku.toLowerCase();
        valB = b.sku.toLowerCase();
      } else if (sortField === "type") {
        valA = detectStockItemClassification(a).label.toLowerCase();
        valB = detectStockItemClassification(b).label.toLowerCase();
      } else if (sortField === "productName") {
        valA = a.productName.toLowerCase();
        valB = b.productName.toLowerCase();
      }
 else if (sortField === "physical") {
        valA = a.availableQty + a.reservedQty + a.damagedQty;
        valB = b.availableQty + b.reservedQty + b.damagedQty;
      } else if (sortField === "available") {
        valA = a.availableQty;
        valB = b.availableQty;
      } else if (sortField === "reserved") {
        valA = a.reservedQty;
        valB = b.reservedQty;
      } else if (sortField === "used") {
        valA = a.usedQty;
        valB = b.usedQty;
      } else if (sortField === "damaged") {
        valA = a.damagedQty;
        valB = b.damagedQty;
      } else if (sortField === "incoming") {
        valA = 0;
        valB = 0;
      } else if (sortField === "reorderPoint") {
        valA = a.reorderPoint;
        valB = b.reorderPoint;
      }

      if (typeof valA === "string" && typeof valB === "string") {
        return sortDir === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortDir === "asc" ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
    });
  }, [filteredSkus, sortField, sortDir]);

  // Paginated List
  const totalPages = Math.max(1, Math.ceil(sortedSkus.length / pageSize));
  const paginatedSkus = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedSkus.slice(start, start + pageSize);
  }, [sortedSkus, currentPage, pageSize]);

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 inline-block h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline-block h-3.5 w-3.5 text-indigo-600 font-bold" />
    ) : (
      <ArrowDown className="ml-1 inline-block h-3.5 w-3.5 text-indigo-600 font-bold" />
    );
  };

  // Selection handlers
  const handleToggleAll = () => {
    if (selectedSkus.size === paginatedSkus.length) {
      setSelectedSkus(new Set());
    } else {
      setSelectedSkus(new Set(paginatedSkus.map((s) => s.sku)));
    }
  };

  const handleToggleSku = (sku: string) => {
    setSelectedSkus((prev) => {
      const next = new Set(prev);
      if (next.has(sku)) next.delete(sku);
      else next.add(sku);
      return next;
    });
  };

  // Export Selected CSV
  const handleExportSelected = () => {
    const exportRows = sortedSkus.filter((s) => selectedSkus.size === 0 || selectedSkus.has(s.sku));
    const headers = ["SKU", "Product Name", "Item Type", "Physical On-Hand", "Available ATS", "Reserved", "Used/Consumed", "Damaged QC", "Reorder Point", "Status"];
    const rows = exportRows.map((s) => [
      `"${s.sku}"`,
      `"${s.productName}"`,
      `"${detectStockItemClassification(s).label}"`,
      s.availableQty + s.reservedQty + s.damagedQty,
      s.availableQty,
      s.reservedQty,
      s.usedQty,
      s.damagedQty,
      s.reorderPoint,
      s.availableQty === 0 ? "Zero Stock" : s.isReorderRequired ? "Reorder" : "In Stock",
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CommerceOS_Stock_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    notificationEngine.send({
      recipientId: "usr-amir-patel",
      channels: ["in_app"],
      priority: "low",
      title: "Stock Inventory Exported",
      body: `Exported ${exportRows.length} SKUs to CSV.`,
    });
  };

  // Summary Metrics
  const summary = useMemo(() => {
    const totalSkus = skuMetricsList.length;
    const totalAts = skuMetricsList.reduce((acc, s) => acc + s.availableQty, 0);
    const lowStockCount = skuMetricsList.filter((s) => s.isReorderRequired || s.availableQty === 0).length;
    const qcDamagedCount = skuMetricsList.filter((s) => s.damagedQty > 0).reduce((acc, s) => acc + s.damagedQty, 0);
    return { totalSkus, totalAts, lowStockCount, qcDamagedCount };
  }, [skuMetricsList]);

  // Adjustment & Consumption executions
  const handleExecuteAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch("/api/v1/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: adjustSku,
          delta: parseInt(adjustQty) || 0,
          bucket: "available",
          reason: adjustReason,
        }),
      });
      await loadInventory();
    } catch {}
    setShowAdjustmentModal(false);
  };

  const handleExecuteConsumption = async (e: React.FormEvent) => {
    e.preventDefault();
    setConsumeError(null);

    const targetSku = consumeSku || (skuMetricsList[0]?.sku ?? "");
    const qty = parseInt(consumeQty, 10) || 0;

    if (qty <= 0) {
      setConsumeError("Please enter a consumption quantity greater than zero.");
      return;
    }

    const targetMetric = skuMetricsList.find((m) => m.sku.toLowerCase() === targetSku.toLowerCase());
    const available = targetMetric?.availableQty ?? 0;

    if (qty > available) {
      setConsumeError(`Insufficient stock. Only ${available} units available on hand for ${targetSku}.`);
      return;
    }

    if (consumeReason === "Other" && !consumeCustomReason.trim()) {
      setConsumeError("Please specify a note/reason for 'Other' consumption.");
      return;
    }

    const consResult = locationStockRepository.consumeStock({
      sku: targetSku,
      quantity: qty,
      reason: consumeReason === "Other" ? consumeCustomReason.trim() : consumeReason,
      customReason: consumeCustomReason.trim() || undefined,
      reference: consumeRef.trim() || "Internal Usage",
      storageLocationName: consumeLocation,
      actorName: "Warehouse Operator",
    });

    if (!consResult.success) {
      setConsumeError(consResult.error || "Consumption failed.");
      return;
    }

    try {
      await fetch("/api/v1/inventory/consume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: targetSku,
          sku: targetSku,
          quantity: qty,
          reason: consumeReason,
          customReason: consumeCustomReason.trim() || undefined,
          reference: consumeRef.trim() || undefined,
        }),
      });
    } catch {}

    notificationEngine.send({
      recipientId: "usr-amir-patel",
      channels: ["in_app"],
      priority: "medium",
      title: `Stock Consumed: ${qty} units of ${targetSku}`,
      body: `Deducted ${qty} units for "${consumeReason}". Remaining Available: ${consResult.remainingAvailable} units.`,
    });

    await loadInventory();
    setShowConsumeModal(false);
    setConsumeQty("10");
    setConsumeCustomReason("");
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] font-sans space-y-4 animate-in fade-in duration-300 pb-16">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Stock Inventory Ledger</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Search, inspect, and perform operational stock actions on every inventory SKU.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
          <button
            type="button"
            onClick={handleExportSelected}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            {selectedSkus.size > 0 ? `Export (${selectedSkus.size})` : "Export All CSV"}
          </button>
          <button
            type="button"
            onClick={() => {
              setConsumeSku(skuMetricsList[0]?.sku || "");
              setShowConsumeModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-xs cursor-pointer active:scale-95"
          >
            <span className="font-mono text-sm leading-none font-bold">−</span> Record Usage
          </button>
          <button
            type="button"
            onClick={() => setShowAdjustmentModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Adjust Stock
          </button>
        </div>
      </div>

      {/* SECTION 1 — COMPACT OPERATIONAL KPI SNAPSHOT */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Total Active SKUs</span>
            <span className="text-2xl font-black text-slate-900 block mt-0.5">{summary.totalSkus}</span>
            <span className="text-[10px] font-semibold text-slate-500">Tracked in Stock Engine</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <Package size={16} />
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-emerald-200 bg-emerald-50/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">Available to Sell (ATS)</span>
            <span className="text-2xl font-black text-emerald-950 block mt-0.5">{summary.totalAts.toLocaleString("en-IN")}</span>
            <span className="text-[10px] font-semibold text-emerald-700">Central Available Pool</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
            <CheckCircle2 size={16} />
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-amber-200 bg-amber-50/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 block">Low Stock / Reorder</span>
            <span className="text-2xl font-black text-amber-950 block mt-0.5">{summary.lowStockCount}</span>
            <span className="text-[10px] font-semibold text-amber-700">Breached safety buffer</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <AlertTriangle size={16} />
          </div>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-rose-200 bg-rose-50/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 block">QC Damaged Stock</span>
            <span className="text-2xl font-black text-rose-950 block mt-0.5">{summary.qcDamagedCount}</span>
            <span className="text-[10px] font-semibold text-rose-700">Quarantined units</span>
          </div>
          <div className="h-9 w-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold">
            <AlertTriangle size={16} />
          </div>
        </div>
      </div>

      {/* SECTION 2 — SEARCH & FILTER TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "all", label: `All (${summary.totalSkus})` },
              { id: "sellable", label: "Sellable Only" },
              { id: "consumable", label: "Packaging & Consumables" },
              { id: "reorder", label: `Reorder Needed (${summary.lowStockCount})` },
              { id: "damaged", label: "QC Damaged" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setActiveTab(t.id);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === t.id
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search SKU, product, HSN…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Secondary Filter Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
            <Filter size={12} /> Filters:
          </span>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 focus:border-indigo-600 focus:outline-none"
          >
            <option value="all">All Types</option>
            <option value="sellable">Sellable Goods</option>
            <option value="consumable">Consumables & Packaging</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 focus:border-indigo-600 focus:outline-none"
          >
            <option value="all">All Stock Statuses</option>
            <option value="in_stock">In Stock (&gt; 0)</option>
            <option value="low_stock">Low Stock (Below ROP)</option>
            <option value="out_of_stock">Out of Stock (0)</option>
            <option value="overstocked">Overstocked / Dead Stock</option>
          </select>

          {(search || activeTab !== "all" || typeFilter !== "all" || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveTab("all");
                setTypeFilter("all");
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className="text-xs font-bold text-rose-600 hover:text-rose-800 ml-auto inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={11} /> Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* SECTION 3 — OPERATIONAL SKU TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
            <p className="text-xs font-bold text-slate-500">Loading live stock engine data…</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-600 mx-auto" />
            <p className="text-xs font-bold text-slate-700">{error}</p>
            <button
              onClick={() => void loadInventory()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition"
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4 w-8">
                      <input
                        type="checkbox"
                        checked={paginatedSkus.length > 0 && selectedSkus.size === paginatedSkus.length}
                        onChange={handleToggleAll}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                      />
                    </th>
                    <th
                      className="py-3 px-4 cursor-pointer group select-none hover:text-slate-700"
                      onClick={() => handleSort("sku")}
                    >
                      SKU & Product Name {renderSortIcon("sku")}
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer group select-none hover:text-slate-700 text-center"
                      onClick={() => handleSort("type")}
                    >
                      Item Type {renderSortIcon("type")}
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer group select-none hover:text-slate-700 text-center"
                      onClick={() => handleSort("physical")}
                    >
                      Physical {renderSortIcon("physical")}
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer group select-none text-emerald-800 bg-emerald-50/40 text-center font-black"
                      onClick={() => handleSort("available")}
                    >
                      Available (ATS) {renderSortIcon("available")}
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer group select-none hover:text-slate-700 text-center"
                      onClick={() => handleSort("reserved")}
                    >
                      Reserved {renderSortIcon("reserved")}
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer group select-none hover:text-slate-700 text-center"
                      onClick={() => handleSort("used")}
                    >
                      Used {renderSortIcon("used")}
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer group select-none hover:text-slate-700 text-center"
                      onClick={() => handleSort("damaged")}
                    >
                      Damaged {renderSortIcon("damaged")}
                    </th>
                    <th
                      className="py-3 px-3 cursor-pointer group select-none hover:text-slate-700 text-center"
                      onClick={() => handleSort("reorderPoint")}
                    >
                      ROP {renderSortIcon("reorderPoint")}
                    </th>
                    <th className="py-3 px-3 text-center">Marketplace Status</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {paginatedSkus.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="py-16 text-center text-xs font-semibold text-slate-400">
                        No inventory SKUs match your current search or filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedSkus.map((m) => {
                      const physicalQty = m.availableQty + m.reservedQty + m.damagedQty;
                      const isSelected = selectedSkus.has(m.sku);
                      const itemClassification = detectStockItemClassification(m);

                      return (
                        <tr
                          key={m.sku}
                          onClick={() => {
                            setSelectedSkuMetrics(m);
                            setSkuModalTab("overview");
                          }}
                          className={`hover:bg-indigo-50/30 transition-colors cursor-pointer group ${
                            isSelected ? "bg-indigo-50/40" : ""
                          }`}
                        >
                          <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleToggleSku(m.sku)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-extrabold text-xs text-slate-900 block group-hover:text-indigo-700 transition-colors">
                              {m.sku}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium block truncate max-w-[220px]">
                              {m.productName}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${itemClassification.badgeClass}`}
                            >
                              {itemClassification.label}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center font-bold text-slate-900 font-mono">
                            {physicalQty.toLocaleString("en-IN")}
                          </td>

                          <td className="py-3 px-3 text-center bg-emerald-50/20">
                            <span className="font-black text-emerald-800 text-xs font-mono">
                              {m.availableQty.toLocaleString("en-IN")}
                            </span>
                            <span className="text-[9px] text-emerald-600 font-bold ml-1">ATS</span>
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-slate-600">
                            {m.reservedQty > 0 ? (
                              <span className="font-bold text-violet-700">{m.reservedQty}</span>
                            ) : (
                              <span className="text-slate-300">0</span>
                            )}
                          </td>
                          <td
                            className="py-3 px-3 text-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedSkuMetrics(m);
                              setSkuModalTab("consumption");
                            }}
                          >
                            <span
                              className={`font-mono text-xs ${
                                m.usedQty > 0
                                  ? "text-amber-700 font-bold underline decoration-amber-300 underline-offset-2"
                                  : "text-slate-300"
                              }`}
                            >
                              {m.usedQty > 0 ? m.usedQty.toLocaleString("en-IN") : "0"}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {m.damagedQty > 0 ? (
                              <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-bold text-[10px]">
                                {m.damagedQty}
                              </span>
                            ) : (
                              <span className="text-slate-300 font-mono">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-500">
                            {m.reorderPoint}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                              Product Central
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center">
                            {m.availableQty === 0 ? (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-bold text-[10px]">
                                Out of Stock
                              </span>
                            ) : m.isReorderRequired ? (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                                Below ROP
                              </span>
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                                In Stock
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                title="Inspect 360° SKU"
                                onClick={() => {
                                  setSelectedSkuMetrics(m);
                                  setSkuModalTab("overview");
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                title="Adjust Stock"
                                onClick={() => {
                                  setAdjustSku(m.sku);
                                  setShowAdjustmentModal(true);
                                }}
                                className="p-1 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="px-4 py-3 border-t border-slate-100">
              <ProductPagination
                page={currentPage}
                pageSize={pageSize}
                totalItems={sortedSkus.length}
                onPageChange={(p) => setCurrentPage(p)}
                onPageSizeChange={(sz) => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                itemLabel="SKUs"
              />
            </div>
          </>
        )}
      </div>

      {/* SKU 360 Inspector Modal */}
      {selectedSkuMetrics && (
        <div
          onClick={() => setSelectedSkuMetrics(null)}
          className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-3xl border border-slate-100 p-6 shadow-2xl space-y-4 cursor-default relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
                  <Boxes size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">{selectedSkuMetrics.sku}</h3>
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-800">
                      Active SOT Record
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{selectedSkuMetrics.productName}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedSkuMetrics(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2 text-xs font-bold">
              {[
                { id: "overview", label: "Overview" },
                { id: "balances", label: "Node Balances" },
                { id: "consumption", label: "Usage / Consumed" },
                { id: "timeline", label: "Movement Timeline" },
                { id: "financials", label: "Financials" },
                { id: "marketplace", label: "Marketplace Allocation" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSkuModalTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-xl transition ${
                    skuModalTab === t.id
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Content Tabs */}
            {skuModalTab === "overview" && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                      Physical Stock
                    </span>
                    <span className="text-xl font-black text-slate-900 block mt-1 font-mono">
                      {selectedSkuMetrics.availableQty +
                        selectedSkuMetrics.reservedQty +
                        selectedSkuMetrics.damagedQty}
                    </span>
                  </div>
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                      Available ATS
                    </span>
                    <span className="text-xl font-black text-emerald-950 block mt-1 font-mono">
                      {selectedSkuMetrics.availableQty}
                    </span>
                  </div>
                  <div className="p-3.5 bg-violet-50 rounded-2xl border border-violet-200">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-800 block">
                      Reserved (Orders)
                    </span>
                    <span className="text-xl font-black text-violet-950 block mt-1 font-mono">
                      {selectedSkuMetrics.reservedQty}
                    </span>
                  </div>
                  <div className="p-3.5 bg-rose-50 rounded-2xl border border-rose-200">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 block">
                      Damaged / QC
                    </span>
                    <span className="text-xl font-black text-rose-950 block mt-1 font-mono">
                      {selectedSkuMetrics.damagedQty}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500 font-medium">Reorder Point (ROP):</span>
                    <span className="font-bold text-slate-800">{selectedSkuMetrics.reorderPoint} Units</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500 font-medium">ABC Classification:</span>
                    <span className="font-bold text-indigo-700">Class {selectedSkuMetrics.abcCategory} Item</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500 font-medium">Daily Velocity:</span>
                    <span className="font-bold text-slate-800">{selectedSkuMetrics.dailyVelocity} units/day</span>
                  </div>
                </div>
              </div>
            )}

            {skuModalTab === "balances" && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Physical Storage Nodes & Locations</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time inventory breakdown across storage locations.</p>
                </div>

                <div className="space-y-2">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-sm text-slate-900 block">Main Fulfillment Center</span>
                      <span className="text-xs text-slate-500 font-medium">Primary Physical Facility (Ready to Pick)</span>
                    </div>
                    <span className="font-black font-mono text-sm text-slate-900">
                      {selectedSkuMetrics.availableQty.toLocaleString("en-IN")} units
                    </span>
                  </div>

                  {selectedSkuMetrics.damagedQty > 0 && (
                    <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-sm text-rose-950 block">QC Quarantine / Damaged Holding</span>
                        <span className="text-xs text-rose-700 font-medium">Defective units isolated from sale</span>
                      </div>
                      <span className="font-black font-mono text-sm text-rose-800">
                        {selectedSkuMetrics.damagedQty.toLocaleString("en-IN")} units
                      </span>
                    </div>
                  )}

                  {selectedSkuMetrics.reservedQty > 0 && (
                    <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-sm text-indigo-950 block">Committed Order Reservations</span>
                        <span className="text-xs text-indigo-700 font-medium">Held for customer orders</span>
                      </div>
                      <span className="font-black font-mono text-sm text-indigo-800">
                        {selectedSkuMetrics.reservedQty.toLocaleString("en-IN")} units
                      </span>
                    </div>
                  )}

                  {(selectedSkuMetrics.inTransitQty || 0) > 0 && (
                    <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-sm text-amber-950 block">In-Transit Movements</span>
                        <span className="text-xs text-amber-700 font-medium">Inter-facility transfer in progress</span>
                      </div>
                      <span className="font-black font-mono text-sm text-amber-800">
                        {(selectedSkuMetrics.inTransitQty || 0).toLocaleString("en-IN")} units
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-sm mt-3">External Marketplace Nodes</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Reported physical balance at external fulfillment centers.</p>
                </div>

                <div className="space-y-2">
                  {[
                    { name: "Amazon FBA (External)", status: "Not Connected", desc: "Amazon SP-API integration required" },
                    { name: "Flipkart FBF (External)", status: "Not Connected", desc: "Flipkart Smart API integration required" },
                    { name: "Shopify D2C Store", status: "Not Connected", desc: "Shopify private app integration required" },
                  ].map((node) => (
                    <div key={node.name} className="p-3.5 bg-slate-50/60 rounded-xl border border-slate-200 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-sm text-slate-700 block">{node.name}</span>
                        <span className="text-[11px] text-slate-400 font-medium">{node.desc}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-400 bg-slate-200/70 px-2 py-0.5 rounded">
                        {node.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {skuModalTab === "timeline" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Chronological Movement Audit Timeline</h4>
                  <span className="text-xs text-slate-400 font-mono font-medium">
                    {selectedSkuMetrics.movementTimeline.length} Real Event{selectedSkuMetrics.movementTimeline.length === 1 ? "" : "s"}
                  </span>
                </div>

                {selectedSkuMetrics.movementTimeline.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <p className="text-sm font-semibold text-slate-500">No movement activity recorded for this SKU yet.</p>
                    <p className="text-xs text-slate-400">
                      All Purchase GRNs, storage transfers, usage consumptions, order allocations, and stock adjustments for this SKU will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {selectedSkuMetrics.movementTimeline.map((tl) => (
                      <div key={tl.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                        <div className="space-y-0.5 min-w-0">
                          <span className="font-bold text-slate-900 text-sm block truncate">{tl.event}</span>
                          <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                            <span>{tl.location}</span>
                            <span>·</span>
                            <span className="text-slate-700 font-semibold">{tl.auditRef}</span>
                            <span>·</span>
                            <span>{new Date(tl.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`font-black text-base block font-mono ${tl.qtyChange > 0 ? "text-emerald-600" : tl.qtyChange < 0 ? "text-rose-600" : "text-slate-600"}`}>
                            {tl.qtyChange > 0 ? `+${tl.qtyChange}` : tl.qtyChange === 0 ? "—" : tl.qtyChange} units
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">{tl.executedBy}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {skuModalTab === "consumption" && (
              <SkuUsageHistoryTab
                sku={selectedSkuMetrics.sku}
                productName={selectedSkuMetrics.productName}
                onRecordUsageClick={() => {
                  setConsumeSku(selectedSkuMetrics.sku);
                  setShowConsumeModal(true);
                }}
                onDataChanged={loadInventory}
              />
            )}

            {skuModalTab === "financials" && (
              <div className="space-y-3 text-xs">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">Unit Cost Price:</span>
                    <span className="font-bold text-slate-900 font-mono">
                      {selectedSkuMetrics.unitCostPrice > 0 ? `₹${selectedSkuMetrics.unitCostPrice.toLocaleString("en-IN")}` : "₹0 (Uncosted)"}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-500">Total Asset Valuation:</span>
                    <span className="font-black text-indigo-800 font-mono">
                      ₹{selectedSkuMetrics.totalAssetValue.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Costing Method:</span>
                    <span className="font-bold text-slate-700">Weighted Average Purchase Cost</span>
                  </div>
                </div>
              </div>
            )}

            {skuModalTab === "marketplace" && (() => {
              const allocResult = channelAllocationEngine.calculateAllocations(
                {
                  id: `bal-${selectedSkuMetrics.sku}`,
                  organizationId: "org-commerceos",
                  workspaceId: "ws-default",
                  productId: selectedSkuMetrics.sku,
                  sku: selectedSkuMetrics.sku,
                  productName: selectedSkuMetrics.productName,
                  warehouseId: DEFAULT_WAREHOUSE_ID,
                  available: selectedSkuMetrics.availableQty,
                  reserved: selectedSkuMetrics.reservedQty,
                  incoming: 0,
                  damaged: selectedSkuMetrics.damagedQty,
                  inTransit: selectedSkuMetrics.inTransitQty,
                  updatedAt: new Date().toISOString(),
                },
                "growing",
                ["AMAZON", "FLIPKART", "SHOPIFY"]
              );

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Marketplace Sales Channel Allocations</h4>
                      <p className="text-xs text-slate-500">
                        Configured in Product / Master Listing · Bounded by Central ATS ({selectedSkuMetrics.availableQty} Units)
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push("/products")}
                      className="text-xs font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 cursor-pointer"
                    >
                      <span>Manage in Product</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {allocResult.allocations.map((a) => {
                      const channelName =
                        a.channel === "AMAZON"
                          ? "Amazon SP-API"
                          : a.channel === "FLIPKART"
                            ? "Flipkart Smart"
                            : "Shopify D2C";
                      return (
                        <div key={a.channel} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-800 text-xs">{channelName}</span>
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
                              Not Connected
                            </span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between text-slate-600">
                              <span>Allocated:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {a.allocatedQty > 0 ? `${a.allocatedQty} Units` : "No Allocation"}
                              </span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Sync State:</span>
                              <span className="font-bold text-slate-400">
                                {a.syncStatus === "NOT_SYNCED" ? "Not Synced" : "Pending Sync"}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedSkuMetrics(null)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && (
        <div
          onClick={() => setShowAdjustmentModal(false)}
          className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in cursor-pointer"
        >
          <form
            onSubmit={handleExecuteAdjustment}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl border border-slate-100 p-6 shadow-2xl space-y-4 cursor-default relative"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Stock Level Adjustment</h3>
              <button
                type="button"
                onClick={() => setShowAdjustmentModal(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Target SKU</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsSkuDropdownOpen(!isSkuDropdownOpen)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-left flex items-center justify-between text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <div className="truncate">
                      <span className="font-mono text-slate-900">{adjustSku}</span>
                      <span className="text-xs text-slate-500 font-normal ml-2">
                        ({skuMetricsList.find((m) => m.sku === adjustSku)?.productName || "Select SKU"})
                      </span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                  </button>
                  {isSkuDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsSkuDropdownOpen(false)} />
                      <div className="absolute left-0 right-0 mt-1 rounded-xl bg-white border border-slate-200 shadow-2xl z-50 p-2 space-y-1.5">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search SKU or product..."
                            value={skuSearchQuery}
                            onChange={(e) => setSkuSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            autoFocus
                          />
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                          {skuMetricsList
                            .filter(
                              (m) =>
                                m.sku.toLowerCase().includes(skuSearchQuery.toLowerCase()) ||
                                m.productName.toLowerCase().includes(skuSearchQuery.toLowerCase())
                            )
                            .map((m) => (
                              <div
                                key={m.sku}
                                onClick={() => {
                                  setAdjustSku(m.sku);
                                  setIsSkuDropdownOpen(false);
                                }}
                                className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between transition ${
                                  adjustSku === m.sku
                                    ? "bg-indigo-50 border border-indigo-200"
                                    : "hover:bg-slate-50 border border-transparent"
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <span className="font-bold font-mono text-slate-900 text-xs block">{m.sku}</span>
                                  <span className="text-[10px] text-slate-500 block truncate">{m.productName}</span>
                                </div>
                                <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded shrink-0">
                                  {m.availableQty} avail
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Adjustment Quantity</label>
                <input
                  type="number"
                  required
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Reason Code</label>
                <Select value={adjustReason} onValueChange={setAdjustReason}>
                  <SelectTrigger className="h-11 border-slate-200 bg-slate-50 font-bold text-sm text-slate-900 focus:bg-white">
                    <SelectValue placeholder="Select reason code..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cycle Count Reconciliation Variance">
                      Cycle Count Reconciliation Variance
                    </SelectItem>
                    <SelectItem value="Quarantine Damage">Quarantine Damaged Stock</SelectItem>
                    <SelectItem value="Shrinkage">Shrinkage / Expiry</SelectItem>
                    <SelectItem value="Found Inventory">Found Inventory Stock</SelectItem>
                    <SelectItem value="Correction">Data Entry Correction</SelectItem>
                    <SelectItem value="Lost Inventory">Lost Inventory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAdjustmentModal(false)}
                className="px-4 py-2 bg-slate-100 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition active:scale-95"
              >
                Approve & Adjust SOT
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Record Usage / Consume Stock Modal */}
      {showConsumeModal && (
        <RecordUsageModal
          isOpen={showConsumeModal}
          onClose={() => setShowConsumeModal(false)}
          skuMetricsList={skuMetricsList}
          initialSku={consumeSku || skuMetricsList[0]?.sku}
          onSuccess={loadInventory}
        />
      )}
    </div>
  );
}
