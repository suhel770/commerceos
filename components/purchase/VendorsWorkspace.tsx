"use client";

import { safeFetchJson, safeResponseJson } from "@/lib/api/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Banknote,
  Ban,
  Building2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Download,
  Edit,
  Eye,
  FileSpreadsheet,
  GripVertical,
  IndianRupee,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  Wallet,
} from "lucide-react";
import { useReorderableKpis } from "@/components/ui/kpi";

import {
  VENDOR_REGISTRATION_TYPE_LABELS,
  formatPurchaseMoney,
  getVendorCode,
  getVendorStatusBadgeStyle,
  type CreateVendorInput,
  type PurchaseBill,
  type Vendor,
  type VendorStatus,
  type VendorWithStats,
} from "@/lib/purchase";

import NewVendorDialog from "./NewVendorDialog";
import EditVendorDialog from "./EditVendorDialog";

type VendorSortField =
  | "vendor"
  | "registration"
  | "bills"
  | "totalSpend"
  | "stock"
  | "expense"
  | "outstanding"
  | "status";

type SortDirection = "asc" | "desc";
import BulkUploadVendorsDialog from "./BulkUploadVendorsDialog";
import BillInspectorDrawer from "./BillInspectorDrawer";
import VendorInspectorDrawer from "./VendorInspectorDrawer";
import { aggregateVendorPurchases } from "./purchase-ops";
import { downloadVendorsExport } from "./vendors-export";
import CommerceSelect, { type CommerceSelectOption } from "@/components/ui/CommerceSelect";

export default function VendorsWorkspace() {
  const [vendors, setVendors] = useState<VendorWithStats[]>([]);
  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [newVendorOpen, setNewVendorOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [selectedVendor, setSelectedVendor] =
    useState<VendorWithStats | null>(null);
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "blocked" | "inactive">("all");
  const [statusModal, setStatusModal] = useState<{
    vendor: Vendor;
    targetStatus: VendorStatus;
  } | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [statusError, setStatusError] = useState<string | null>(null);
  const [actionMenuVendorId, setActionMenuVendorId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const handleOutsideClick = () => setActionMenuVendorId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vendorsPayload, billsPayload] = await Promise.all([
        safeFetchJson<{ success: boolean; data: VendorWithStats[] }>(
          "/api/v1/purchase/vendors",
        ).catch((err) => {
          console.warn("[VendorsWorkspace] load vendors warning:", err);
          return { success: true, data: [] as VendorWithStats[] };
        }),
        safeFetchJson<{ success: boolean; data: PurchaseBill[] }>(
          "/api/v1/purchase/bills",
        ).catch((err) => {
          console.warn("[VendorsWorkspace] load bills warning:", err);
          return { success: true, data: [] as PurchaseBill[] };
        }),
      ]);

      setVendors((vendorsPayload?.data as VendorWithStats[]) || []);
      setBills((billsPayload?.data as PurchaseBill[]) || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load vendors.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const spendByVendor = useMemo(
    () => aggregateVendorPurchases(bills),
    [bills],
  );

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return vendors
      .map((vendor) => {
        const spend = spendByVendor.get(vendor.id);
        return {
          vendor,
          totalSpend: spend?.totalSpend ?? 0,
          expenseSpend: spend?.expenseSpend ?? 0,
          stockSpend: spend?.stockSpend ?? 0,
          assetSpend: spend?.assetSpend ?? 0,
          billCount: spend?.billCount ?? vendor.purchaseCount,
          lastBillDate: spend?.lastBillDate ?? null,
          lastBillNumber: spend?.lastBillNumber ?? null,
        };
      })
      .filter((row) => {
        if (statusFilter !== "all" && row.vendor.status !== statusFilter) {
          return false;
        }
        if (!query) return true;
        const haystack = [
          row.vendor.name,
          getVendorCode(row.vendor),
          row.vendor.gstin,
          row.vendor.pan,
          row.vendor.city,
          row.vendor.state,
          row.vendor.contactPerson,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(query);
      });
  }, [vendors, spendByVendor, search, statusFilter]);

  const [sortField, setSortField] = useState<VendorSortField>("totalSpend");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const handleSort = (field: VendorSortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const renderSortIcon = (field: VendorSortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="ml-1 inline-block h-3 w-3 shrink-0 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
      );
    }
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline-block h-3.5 w-3.5 shrink-0 font-bold text-violet-600" />
    ) : (
      <ArrowDown className="ml-1 inline-block h-3.5 w-3.5 shrink-0 font-bold text-violet-600" />
    );
  };

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (sortField === "vendor") {
        valA = a.vendor.name.toLowerCase();
        valB = b.vendor.name.toLowerCase();
      } else if (sortField === "registration") {
        valA = a.vendor.registrationType;
        valB = b.vendor.registrationType;
      } else if (sortField === "bills") {
        valA = a.billCount;
        valB = b.billCount;
      } else if (sortField === "totalSpend") {
        valA = a.totalSpend;
        valB = b.totalSpend;
      } else if (sortField === "stock") {
        valA = a.stockSpend;
        valB = b.stockSpend;
      } else if (sortField === "expense") {
        valA = a.expenseSpend;
        valB = b.expenseSpend;
      } else if (sortField === "outstanding") {
        valA = a.vendor.outstandingBalance;
        valB = b.vendor.outstandingBalance;
      } else if (sortField === "status") {
        valA = a.vendor.status;
        valB = b.vendor.status;
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [rows, sortField, sortDir]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, pageSize]);

  const totalRows = sortedRows.length;
  const isAllRows = pageSize === 0 || pageSize >= totalRows;
  const totalPages = isAllRows ? 1 : Math.max(1, Math.ceil(totalRows / pageSize));
  const activePage = Math.min(Math.max(1, currentPage), totalPages);

  const paginatedRows = useMemo(() => {
    if (isAllRows) return sortedRows;
    const startIndex = (activePage - 1) * pageSize;
    return sortedRows.slice(startIndex, startIndex + pageSize);
  }, [sortedRows, isAllRows, activePage, pageSize]);

  const pageSizeOptions: CommerceSelectOption[] = useMemo(
    () => [
      { value: "10", label: "10 rows" },
      { value: "20", label: "20 rows" },
      { value: "50", label: "50 rows" },
      { value: "100", label: "100 rows" },
      { value: "0", label: `All rows (${totalRows})` },
    ],
    [totalRows],
  );

  const summary = useMemo(() => {
    const active = vendors.filter((vendor) => vendor.status === "active").length;
    let totalSpend = 0;
    let expenseSpend = 0;
    for (const spend of spendByVendor.values()) {
      totalSpend += spend.totalSpend;
      expenseSpend += spend.expenseSpend;
    }
    const outstanding = vendors.reduce(
      (sum, vendor) => sum + vendor.outstandingBalance,
      0,
    );
    return {
      vendorCount: vendors.length,
      active,
      totalSpend,
      expenseSpend,
      outstanding,
    };
  }, [vendors, spendByVendor]);

  const allSelected = useMemo(
    () => rows.length > 0 && rows.every((r) => selectedIds.has(r.vendor.id)),
    [rows, selectedIds],
  );

  const toggleAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.vendor.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleExport = () => {
    if (selectedIds.size > 0) {
      const selectedList = vendors.filter((v) => selectedIds.has(v.id));
      downloadVendorsExport(selectedList, true);
    } else {
      downloadVendorsExport(vendors, false);
    }
  };

  const createVendor = async (input: CreateVendorInput) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/purchase/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await safeResponseJson(response);
      await load();
      setNewVendorOpen(false);
      return payload.data as Vendor;
    } finally {
      setSubmitting(false);
    }
  };

  const bulkCreateVendors = async (inputs: CreateVendorInput[]) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/purchase/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputs),
      });
      const payload = await safeResponseJson(response);
      await load();
      setBulkUploadOpen(false);
      return payload.data as Vendor[];
    } finally {
      setSubmitting(false);
    }
  };

  const updateVendorDetails = async (
    id: string,
    patch: Partial<CreateVendorInput> & { status?: VendorStatus },
  ) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/purchase/vendors", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const payload = await safeResponseJson(response);
      await load();
      setEditingVendor(null);
      return payload.data as Vendor;
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/purchase/vendors", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) }),
      });
      const payload = await safeResponseJson(response);
      setSelectedIds(new Set());
      setConfirmDeleteOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete vendors.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmStatusChange = async () => {
    if (!statusModal) return;
    if (statusModal.targetStatus === "blocked" && !statusReason.trim()) {
      setStatusError("Reason is required to block a vendor.");
      return;
    }

    setSubmitting(true);
    setStatusError(null);
    try {
      const response = await fetch("/api/v1/purchase/vendors/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: statusModal.vendor.id,
          status: statusModal.targetStatus,
          reason: statusReason.trim() || `Status updated to ${statusModal.targetStatus}`,
        }),
      });
      const payload = await safeResponseJson(response);
      setStatusModal(null);
      setStatusReason("");
      await load();
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "Failed to update vendor status.");
    } finally {
      setSubmitting(false);
    }
  };

  const kpiCards: Array<{
    key: string;
    title: string;
    value: string;
    footer: string;
    footerTone?: "up" | "warn" | "muted";
    icon: LucideIcon;
    iconWrap: string;
    iconColor: string;
  }> = useMemo(() => [
    {
      key: "vendors",
      title: "Vendors",
      value: loading ? "…" : String(summary.vendorCount),
      footer: `${summary.active} active`,
      footerTone: "muted",
      icon: Users,
      iconWrap: "bg-violet-100",
      iconColor: "text-violet-600",
    },
    {
      key: "spend",
      title: "Total purchase",
      value: loading ? "…" : formatPurchaseMoney(summary.totalSpend),
      footer: "All non-void bills",
      footerTone: "muted",
      icon: IndianRupee,
      iconWrap: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      key: "expense",
      title: "Expense spend",
      value: loading ? "…" : formatPurchaseMoney(summary.expenseSpend),
      footer: "Services, rent, ads…",
      footerTone: "muted",
      icon: Banknote,
      iconWrap: "bg-amber-100",
      iconColor: "text-amber-700",
    },
    {
      key: "outstanding",
      title: "Outstanding",
      value: loading ? "…" : formatPurchaseMoney(summary.outstanding),
      footer: "Unpaid / partial",
      footerTone: "warn",
      icon: Wallet,
      iconWrap: "bg-rose-100",
      iconColor: "text-rose-600",
    },
    {
      key: "active",
      title: "Active vendors",
      value: loading ? "…" : String(summary.active),
      footer: "Ready to purchase",
      footerTone: "up",
      icon: Building2,
      iconWrap: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
  ], [loading, summary]);

  const defaultKeys = useMemo(() => kpiCards.map((c) => c.key), [kpiCards]);

  const {
    order,
    isReordered,
    resetOrder,
    getCardDragProps,
  } = useReorderableKpis<string>({
    storageKey: "commerceos_vendors_kpi_order_v1",
    defaultOrder: defaultKeys,
  });

  const cardMap = useMemo(() => {
    const map = new Map<string, typeof kpiCards[0]>();
    for (const c of kpiCards) {
      map.set(c.key, c);
    }
    return map;
  }, [kpiCards]);

  return (
    <div className="mx-auto max-w-[1700px] space-y-4 px-4 py-4 xl:px-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-violet-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-950">
              Vendors
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage suppliers — purchase spend, expenses, and outstanding by
            vendor.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={15} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download size={15} />
            {selectedIds.size > 0 ? `Export (${selectedIds.size})` : "Export All"}
          </button>
          <button
            type="button"
            onClick={() => setBulkUploadOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3.5 text-sm font-semibold text-violet-700 hover:bg-violet-100"
          >
            <Upload size={15} />
            Bulk Upload
          </button>
          <button
            type="button"
            onClick={() => setNewVendorOpen(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-violet-600 px-3.5 text-sm font-semibold text-white hover:bg-violet-700 shadow-sm"
          >
            <Plus size={16} />
            Add vendor
          </button>
        </div>
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="space-y-1.5">
        {isReordered && (
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={resetOrder}
              className="text-[10px] font-extrabold text-violet-600 hover:text-violet-800 transition-colors cursor-pointer"
            >
              Reset Order
            </button>
          </div>
        )}

        <section className="grid grid-cols-2 gap-2 xl:grid-cols-5">
          {order.map((key, index) => {
            const card = cardMap.get(key);
            if (!card) return null;

            const Icon = card.icon;
            const dragProps = getCardDragProps(index);
            const { isDragging, isOver } = dragProps;

            return (
              <div
                key={card.key}
                {...dragProps}
                className={`group relative flex items-center gap-2.5 rounded-xl border bg-white px-3 py-2.5 shadow-xs transition-all duration-200 select-none cursor-grab active:cursor-grabbing ${
                  isDragging
                    ? "opacity-40 scale-95 border-dashed border-violet-400"
                    : isOver
                      ? "border-violet-500 ring-2 ring-violet-200 scale-102 shadow-md bg-violet-50/20"
                      : "border-slate-200 hover:border-slate-300"
                }`}
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 pointer-events-none">
                  <GripVertical className="h-3 w-3" />
                </div>
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.iconWrap}`}
                >
                  <Icon className={`h-4 w-4 ${card.iconColor}`} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-medium text-slate-500">
                    {card.title}
                  </p>
                  <p className="truncate text-base font-bold tracking-tight text-slate-900">
                    {card.value}
                  </p>
                  <p
                    className={`truncate text-[10px] font-semibold ${
                      card.footerTone === "up"
                        ? "text-emerald-600"
                        : card.footerTone === "warn"
                          ? "text-rose-600"
                          : "text-slate-400"
                    }`}
                  >
                    {card.footer}
                  </p>
                </div>
              </div>
            );
          })}
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                All vendors ({rows.length})
              </h2>
              <p className="mt-0.5 text-xs text-slate-400">
                Spend, outstanding balance & owner status control
              </p>
            </div>
            {/* STATUS FILTER TABS */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {(["all", "active", "blocked", "inactive"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg capitalize transition cursor-pointer ${
                    statusFilter === st
                      ? st === "blocked"
                        ? "bg-rose-600 text-white shadow-sm"
                        : st === "active"
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-white text-slate-900 shadow-sm"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* INLINE SELECTION ACTIONS (IN ORANGE HIGHLIGHTED AREA) */}
            {selectedIds.size > 0 ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200/90 px-3 py-1 animate-in fade-in zoom-in-95 duration-200">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[11px] shadow-xs">
                  {selectedIds.size}
                </span>
                <span className="text-xs font-bold text-emerald-900">selected</span>

                <div className="h-4 w-px bg-emerald-200 mx-0.5" />

                <button
                  type="button"
                  onClick={handleExport}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition cursor-pointer"
                >
                  <Download size={12} />
                  Export Selected
                </button>

                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => setConfirmDeleteOpen(true)}
                  className="inline-flex items-center gap-1 rounded-lg bg-rose-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer"
                >
                  <Trash2 size={12} />
                  Delete ({selectedIds.size})
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 hover:underline ml-1 cursor-pointer"
                >
                  Clear
                </button>
              </div>
            ) : null}
          </div>
          <label className="relative w-full max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search vendor name, code, GSTIN…"
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs focus:border-violet-500 focus:outline-none"
            />
          </label>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-12 animate-pulse rounded-xl bg-slate-100"
              />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-slate-500">
            {search.trim()
              ? "No vendors match this search."
              : "No vendors yet. Add a vendor to start purchasing."}
          </div>
        ) : (
          <div>
            <div className="overflow-x-auto max-h-[560px] overflow-y-auto border-b border-slate-100 shadow-inner">
              <table className="min-w-full text-left text-sm">
                <thead className="sticky top-0 z-20 bg-slate-50 shadow-[0_1px_0_#e2e8f0]">
                <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="w-8 px-3 py-3">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Select all vendors"
                    />
                  </th>
                  <th
                    onClick={() => handleSort("vendor")}
                    className="px-3 py-3 font-semibold cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                  >
                    <div className="flex items-center">
                      <span>Vendor</span>
                      {renderSortIcon("vendor")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("registration")}
                    className="px-3 py-3 font-semibold cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                  >
                    <div className="flex items-center">
                      <span>Registration</span>
                      {renderSortIcon("registration")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("bills")}
                    className="px-3 py-3 text-right font-semibold cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                  >
                    <div className="flex items-center justify-end">
                      <span>Bills</span>
                      {renderSortIcon("bills")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("totalSpend")}
                    className="px-3 py-3 text-right font-semibold cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                  >
                    <div className="flex items-center justify-end">
                      <span>Total spend</span>
                      {renderSortIcon("totalSpend")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("stock")}
                    className="px-3 py-3 text-right font-semibold cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                  >
                    <div className="flex items-center justify-end">
                      <span>Stock</span>
                      {renderSortIcon("stock")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("expense")}
                    className="px-3 py-3 text-right font-semibold cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                  >
                    <div className="flex items-center justify-end">
                      <span>Expense</span>
                      {renderSortIcon("expense")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("outstanding")}
                    className="px-3 py-3 text-right font-semibold cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                  >
                    <div className="flex items-center justify-end">
                      <span>Outstanding</span>
                      {renderSortIcon("outstanding")}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort("status")}
                    className="px-3 py-3 font-semibold cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                  >
                    <div className="flex items-center">
                      <span>Status</span>
                      {renderSortIcon("status")}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-center font-semibold">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedRows.map((row) => {
                  const isSelected = selectedIds.has(row.vendor.id);
                  return (
                    <tr
                      key={row.vendor.id}
                      className={`cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/70 transition-colors ${
                        isSelected ? "bg-emerald-50/60" : ""
                      }`}
                      onClick={() => setSelectedVendor(row.vendor)}
                    >
                      <td
                        className="px-3 py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleOne(row.vendor.id)}
                          aria-label={`Select ${row.vendor.name}`}
                        />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-slate-900">
                            {row.vendor.name}
                          </p>
                          <span className="font-mono text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.2 rounded">
                            {getVendorCode(row.vendor)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {[row.vendor.city, row.vendor.state]
                            .filter(Boolean)
                            .join(", ") || "—"}
                          {row.lastBillDate
                            ? ` · Last ${row.lastBillNumber} · ${row.lastBillDate}`
                            : ""}
                        </p>
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-slate-700">
                          {
                            VENDOR_REGISTRATION_TYPE_LABELS[
                              row.vendor.registrationType
                            ]
                          }
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {row.vendor.gstin || row.vendor.pan || "—"}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-right text-slate-700">
                        {row.billCount}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-slate-900">
                        {formatPurchaseMoney(row.totalSpend)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600">
                        {formatPurchaseMoney(row.stockSpend)}
                      </td>
                      <td className="px-3 py-3 text-right text-slate-600">
                        {formatPurchaseMoney(row.expenseSpend)}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-rose-700">
                        {formatPurchaseMoney(row.vendor.outstandingBalance)}
                      </td>
                      <td className="px-3 py-3">
                        {(() => {
                          const badge = getVendorStatusBadgeStyle(row.vendor.status);
                          return (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] border ${badge.className}`}
                            >
                              {row.vendor.status === "blocked" && <Ban size={10} />}
                              {row.vendor.status === "active" && <CheckCircle2 size={10} />}
                              {badge.label}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="relative inline-flex items-center justify-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setEditingVendor(row.vendor)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition cursor-pointer"
                          >
                            <Edit size={13} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedVendor(row.vendor)}
                            className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition cursor-pointer"
                          >
                            <Eye size={13} />
                            View
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionMenuVendorId((prev) => (prev === row.vendor.id ? null : row.vendor.id));
                            }}
                            className={`flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-2xs hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 transition cursor-pointer ${
                              actionMenuVendorId === row.vendor.id ? "bg-violet-50 text-violet-700 border-violet-300" : ""
                            }`}
                            aria-label="More options"
                          >
                            <MoreHorizontal size={15} />
                          </button>

                          {/* ACTION DROPDOWN MENU */}
                          {actionMenuVendorId === row.vendor.id && (
                            <div className="absolute right-0 top-9 z-30 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl animate-in fade-in zoom-in-95 duration-150 text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuVendorId(null);
                                  setSelectedVendor(row.vendor);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                              >
                                <Eye size={14} className="text-slate-400" />
                                View Details & Stats
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuVendorId(null);
                                  setEditingVendor(row.vendor);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                              >
                                <Edit size={14} className="text-slate-400" />
                                Edit Vendor Info
                              </button>

                              <div className="my-1 border-t border-slate-100" />

                              {row.vendor.status === "blocked" ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionMenuVendorId(null);
                                    setStatusModal({ vendor: row.vendor, targetStatus: "active" });
                                    setStatusReason("");
                                    setStatusError(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                                >
                                  <ShieldCheck size={14} className="text-emerald-600" />
                                  Unblock Vendor
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActionMenuVendorId(null);
                                    setStatusModal({ vendor: row.vendor, targetStatus: "blocked" });
                                    setStatusReason("");
                                    setStatusError(null);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                                >
                                  <ShieldAlert size={14} className="text-rose-600" />
                                  Block Vendor
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setActionMenuVendorId(null);
                                  setSelectedIds(new Set([row.vendor.id]));
                                  setConfirmDeleteOpen(true);
                                }}
                                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                              >
                                <Trash2 size={14} className="text-rose-600" />
                                Delete Vendor
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* PREMIUM PAGINATION & ROWS SELECTOR FOOTER */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/90 px-4 py-2.5 text-xs text-slate-600 backdrop-blur-xs select-none">
            <div className="flex items-center gap-2.5">
              <span className="font-semibold text-slate-600">Rows per page:</span>
              <CommerceSelect
                value={String(pageSize)}
                options={pageSizeOptions}
                onChange={(val) => {
                  setPageSize(Number(val));
                  setCurrentPage(1);
                }}
                searchable={false}
                size="sm"
                className="w-36"
              />
            </div>

            <div className="flex items-center gap-4">
              <span className="font-medium text-slate-600">
                Showing{" "}
                <span className="font-bold text-slate-900">
                  {totalRows === 0 ? 0 : (activePage - 1) * (pageSize || totalRows) + 1}
                </span>{" "}
                to{" "}
                <span className="font-bold text-slate-900">
                  {isAllRows ? totalRows : Math.min(activePage * pageSize, totalRows)}
                </span>{" "}
                of <span className="font-bold text-slate-900">{totalRows}</span> vendors
              </span>

              {!isAllRows && totalPages > 1 && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={activePage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                    Prev
                  </button>
                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        Math.abs(pageNum - activePage) <= 1
                      ) {
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => setCurrentPage(pageNum)}
                            className={`h-7.5 w-7.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                              activePage === pageNum
                                ? "bg-violet-600 text-white shadow-xs"
                                : "text-slate-600 hover:bg-slate-200/60"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      }
                      if (
                        (pageNum === 2 && activePage > 3) ||
                        (pageNum === totalPages - 1 && activePage < totalPages - 2)
                      ) {
                        return (
                          <span key={pageNum} className="text-slate-400 text-xs px-0.5">
                            …
                          </span>
                        );
                      }
                      return null;
                    })}
                  </div>
                  <button
                    type="button"
                    disabled={activePage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-bold text-slate-700 shadow-2xs hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40 disabled:pointer-events-none transition cursor-pointer"
                  >
                    Next
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        )}
      </section>

      <NewVendorDialog
        open={newVendorOpen}
        submitting={submitting}
        onClose={() => setNewVendorOpen(false)}
        onCreate={createVendor}
      />

      <EditVendorDialog
        vendor={editingVendor}
        submitting={submitting}
        onClose={() => setEditingVendor(null)}
        onUpdate={updateVendorDetails}
      />

      <BulkUploadVendorsDialog
        open={bulkUploadOpen}
        submitting={submitting}
        onClose={() => setBulkUploadOpen(false)}
        onBulkCreate={bulkCreateVendors}
      />

      <VendorInspectorDrawer
        vendor={selectedVendor}
        bills={bills}
        onClose={() => setSelectedVendor(null)}
        onOpenBill={(bill) => {
          setSelectedBill(bill);
        }}
        escapeEnabled={!selectedBill}
      />

      <BillInspectorDrawer
        bill={selectedBill}
        vendor={
          selectedBill
            ? vendors.find((row) => row.id === selectedBill.vendorId) ?? null
            : null
        }
        onClose={() => setSelectedBill(null)}
      />

      {/* BULK DELETE CONFIRMATION MODAL */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shadow-inner">
              <Trash2 size={28} className="animate-in bounce-in duration-200" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-extrabold text-slate-900">
                Delete {selectedIds.size} Vendor{selectedIds.size === 1 ? "" : "s"} Permanently?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                This action will permanently delete <strong className="text-slate-900 font-bold">{selectedIds.size}</strong> vendor record{selectedIds.size === 1 ? "" : "s"} from the CommerceOS database.
              </p>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-left space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-800 text-xs">
                <AlertTriangle size={14} className="shrink-0 text-rose-600" />
                <span>Database Removal Warning</span>
              </div>
              <p className="text-[11px] text-rose-700 leading-relaxed">
                ✓ Records will be permanently deleted from Vendor Master.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleDeleteSelected()}
                className="w-full rounded-xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 active:scale-95 transition disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Deleting..." : `Delete ${selectedIds.size} Vendor${selectedIds.size === 1 ? "" : "s"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

