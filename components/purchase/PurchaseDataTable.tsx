"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Box,
  ChevronDown,
  Eye,
  FileSpreadsheet,
  FileText,
  Laptop,
  Megaphone,
  MoreHorizontal,
  Package,
  Search,
  Truck,
  RotateCcw,
  Trash2,
  AlertCircle,
} from "lucide-react";

import ProductPagination from "@/components/shared/pagination/ProductPagination";
import CommerceSelect from "@/components/ui/CommerceSelect";
import {
  ALL_PURCHASE_TYPES,
  PURCHASE_STATUS_LABELS,
  PURCHASE_TYPE_LABELS,
  billPendingAmount,
  formatPurchaseMoney,
  nextStatuses,
  type PurchaseBill,
  type PurchaseStatus,
  type PurchaseType,
  type VendorWithStats,
} from "@/lib/purchase";

import {
  DEFAULT_PURCHASE_CAPABILITIES,
  PURCHASE_TABS,
  PURCHASE_TYPE_SHORT_LABELS,
  businessImpact,
  matchesTab,
  nextPurchaseAction,
  paymentLabel,
  typeBadgeClass,
  workflowLabel,
  type PurchaseCapabilities,
  type PurchaseTab,
} from "./purchase-ops";

const TYPE_ICON: Record<PurchaseType, LucideIcon> = {
  inventory_product: Package,
  packaging_material: Box,
  office_expense: FileText,
  asset: Package,
  marketing: Megaphone,
  software: Laptop,
  courier: Truck,
  rent: FileText,
  utilities: FileText,
  service: FileText,
  travel: Truck,
  professional_fees: FileText,
  other: FileText,
};

const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Format ISO date `YYYY-MM-DD` as `DD-MMM` (e.g. 26-Jul). */
function formatDdMmm(isoDate: string): string {
  const [year, month, day] = isoDate.split("-");
  const monthLabel = MONTH_SHORT[Number(month) - 1];
  if (!year || !monthLabel || !day) return isoDate;
  return `${day}-${monthLabel}`;
}

const NEXT_ACTION_STYLE: Record<string, string> = {
  neutral: "bg-slate-100 text-slate-700",
  warn: "bg-amber-50 text-amber-800",
  ok: "bg-emerald-50 text-emerald-700",
  violet: "bg-violet-50 text-violet-800",
  slate: "bg-slate-100 text-slate-500",
};

const WORKFLOW_STYLE: Record<string, string> = {
  Draft: "bg-slate-100 text-slate-700",
  Ordered: "bg-blue-50 text-blue-700",
  Received: "bg-sky-50 text-sky-700",
  QC: "bg-amber-50 text-amber-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Void: "bg-rose-50 text-rose-700",
};

const PAY_STYLE: Record<string, string> = {
  Paid: "bg-emerald-50 text-emerald-700",
  "Partially Paid": "bg-amber-50 text-amber-700",
  Pending: "bg-rose-50 text-rose-700",
};

const PAGE_SIZES = [10, 25, 50];

type PurchaseDataTableProps = {
  tab: PurchaseTab;
  bills: PurchaseBill[];
  vendors: VendorWithStats[];
  capabilities?: PurchaseCapabilities;
  /** Show payment date / ID / pending columns (Bills workspace). */
  showPaymentDetails?: boolean;
  onTabChange(tab: PurchaseTab): void;
  onNewBill(): void;
  onSelectVendor(vendor: VendorWithStats): void;
  onViewBill?(bill: PurchaseBill): void;
  onEditBill?(bill: PurchaseBill): void;
  onDeleteBill?(billId: string): void;
  onRestoreBill?(billId: string): void;
  onPermanentDeleteBill?(billId: string): void;
  onPayBill?(bill: PurchaseBill): void;
  onExport(rows: PurchaseBill[]): void;
  onTransition(billId: string, status: PurchaseStatus): Promise<void>;
  onBulkVoid?(ids: string[]): Promise<void>;
  onBulkDelete?(ids: string[]): Promise<void>;
};

function formatTwoLineLabel(label: string | undefined) {
  if (!label) return null;
  if (label === "Increases Available Stock") {
    return (
      <>
        Increases Available
        <br />
        Stock
      </>
    );
  }
  if (label === "Packaging Inventory Updated") {
    return (
      <>
        Packaging Inventory
        <br />
        Updated
      </>
    );
  }
  if (label === "Ready for Inventory") {
    return (
      <>
        Ready for
        <br />
        Inventory
      </>
    );
  }
  return label;
}

export default function PurchaseDataTable({
  tab,
  bills,
  vendors,
  capabilities = DEFAULT_PURCHASE_CAPABILITIES,
  showPaymentDetails,
  onTabChange,
  onNewBill,
  onSelectVendor,
  onViewBill,
  onEditBill,
  onDeleteBill,
  onRestoreBill,
  onPermanentDeleteBill,
  onPayBill,
  onExport,
  onTransition,
  onBulkVoid,
  onBulkDelete,
}: PurchaseDataTableProps) {
  const bulkRef = useRef<HTMLDivElement>(null);
  const bulkButtonRef = useRef<HTMLButtonElement>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkStyle, setBulkStyle] = useState<CSSProperties>({});
  const [rowMenu, setRowMenu] = useState<string | null>(null);
  const mounted = typeof document !== "undefined";

  const [tabOrder, setTabOrder] = useState<Array<[PurchaseTab, string]>>(PURCHASE_TABS);
  const [draggedTab, setDraggedTab] = useState<PurchaseTab | null>(null);
  const [dragOverTab, setDragOverTab] = useState<PurchaseTab | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("commerceos_purchase_tab_order_v2");
      if (saved) {
        const ids: PurchaseTab[] = JSON.parse(saved);
        if (Array.isArray(ids) && ids.length > 0) {
          const ordered: Array<[PurchaseTab, string]> = [];
          for (const id of ids) {
            const found = PURCHASE_TABS.find(([tId]) => tId === id);
            if (found) ordered.push(found);
          }
          for (const tabPair of PURCHASE_TABS) {
            if (!ordered.some(([tId]) => tId === tabPair[0])) {
              ordered.push(tabPair);
            }
          }
          setTabOrder(ordered);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleTabDrop = (targetId: PurchaseTab) => {
    if (!draggedTab || draggedTab === targetId) return;
    const nextOrder = [...tabOrder];
    const fromIdx = nextOrder.findIndex(([id]) => id === draggedTab);
    const toIdx = nextOrder.findIndex(([id]) => id === targetId);

    if (fromIdx >= 0 && toIdx >= 0) {
      const [movedItem] = nextOrder.splice(fromIdx, 1);
      nextOrder.splice(toIdx, 0, movedItem!);
      setTabOrder(nextOrder);
      try {
        localStorage.setItem(
          "commerceos_purchase_tab_order_v2",
          JSON.stringify(nextOrder.map(([id]) => id))
        );
      } catch {
        // ignore
      }
    }
    setDraggedTab(null);
    setDragOverTab(null);
  };

  type PurchaseSortField =
    | "billNumber"
    | "billDate"
    | "purchaseType"
    | "vendorName"
    | "totalAmount"
    | "taxAmount"
    | "status"
    | "paymentStatus"
    | "payRef"
    | "pendingAmount"
    | "businessImpact";
  type SortDirection = "asc" | "desc";

  const [sortField, setSortField] = useState<PurchaseSortField>("billDate");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const handleSort = (field: PurchaseSortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const renderSortIcon = (field: PurchaseSortField) => {
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

  const filtered = useMemo(() => {
    return bills.filter((bill) => {
      if (!matchesTab(bill, tab)) return false;
      if (typeFilter !== "all" && bill.purchaseType !== typeFilter) return false;
      if (statusFilter !== "all" && bill.status !== statusFilter) return false;
      if (vendorFilter !== "all" && bill.vendorId !== vendorFilter) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = [
          bill.billNumber,
          bill.vendorName,
          bill.vendorInvoiceNumber ?? "",
          bill.paymentId ?? "",
          PURCHASE_TYPE_LABELS[bill.purchaseType],
          ...bill.lines.flatMap((line) => [
            line.description,
            line.sku ?? "",
            line.hsn ?? "",
          ]),
        ]
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [bills, tab, typeFilter, statusFilter, vendorFilter, search]);

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      if (sortField === "billNumber") {
        valA = a.billNumber;
        valB = b.billNumber;
      } else if (sortField === "billDate") {
        valA = a.billDate;
        valB = b.billDate;
      } else if (sortField === "purchaseType") {
        valA = a.purchaseType;
        valB = b.purchaseType;
      } else if (sortField === "vendorName") {
        valA = a.vendorName.toLowerCase();
        valB = b.vendorName.toLowerCase();
      } else if (sortField === "totalAmount") {
        valA = a.totalAmount;
        valB = b.totalAmount;
      } else if (sortField === "taxAmount") {
        valA = a.taxAmount;
        valB = b.taxAmount;
      } else if (sortField === "status") {
        valA = a.status;
        valB = b.status;
      } else if (sortField === "paymentStatus") {
        valA = a.paymentStatus;
        valB = b.paymentStatus;
      } else if (sortField === "payRef") {
        valA = a.paymentId ?? a.paymentMethod ?? "";
        valB = b.paymentId ?? b.paymentMethod ?? "";
      } else if (sortField === "pendingAmount") {
        valA = billPendingAmount(a);
        valB = billPendingAmount(b);
      } else if (sortField === "businessImpact") {
        const toneRank: Record<string, number> = {
          warn: 4,
          violet: 3,
          ok: 2,
          neutral: 1,
          slate: 0,
        };
        valA = toneRank[businessImpact(a, capabilities).tone] ?? 0;
        valB = toneRank[businessImpact(b, capabilities).tone] ?? 0;
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortField, sortDir, capabilities]);

  const pageCount = Math.max(1, Math.ceil(sortedFiltered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = sortedFiltered.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize,
  );

  const allSelected =
    pageRows.length > 0 && pageRows.every((row) => selectedIds.has(row.id));
  const selectedCount = selectedIds.size;

  useLayoutEffect(() => {
    if (!bulkOpen) return;
    const button = bulkButtonRef.current;
    if (!button) return;

    const place = () => {
      const rect = button.getBoundingClientRect();
      const width = 224;
      let left = rect.right - width;
      if (left < 8) left = 8;
      const estimatedHeight = 160;
      const openBelow = rect.bottom + 8 + estimatedHeight <= window.innerHeight;
      setBulkStyle(
        openBelow
          ? {
              position: "fixed",
              top: rect.bottom + 6,
              left,
              width,
              zIndex: 9999,
            }
          : {
              position: "fixed",
              bottom: window.innerHeight - rect.top + 6,
              left,
              width,
              zIndex: 9999,
            },
      );
    };

    place();
    window.addEventListener("resize", place);
    document.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      document.removeEventListener("scroll", place, true);
    };
  }, [bulkOpen]);

  useEffect(() => {
    if (!bulkOpen && !rowMenu) return;

    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (bulkOpen) {
        const panel = document.getElementById("purchase-bulk-menu");
        if (
          !bulkRef.current?.contains(target) &&
          !panel?.contains(target)
        ) {
          setBulkOpen(false);
        }
      }
      if (rowMenu) {
        const menu = document.getElementById(`row-menu-${rowMenu}`);
        if (!menu?.contains(target)) setRowMenu(null);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setBulkOpen(false);
        setRowMenu(null);
      }
    };

    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [bulkOpen, rowMenu]);

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const row of pageRows) next.delete(row.id);
      } else {
        for (const row of pageRows) next.add(row.id);
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const runBulkExport = () => {
    if (selectedCount === 0) {
      setBulkError("Select at least one bill first.");
      return;
    }
    setBulkError(null);
    onExport(filtered.filter((bill) => selectedIds.has(bill.id)));
    setBulkOpen(false);
  };

  const runBulkVoid = async () => {
    if (selectedCount === 0) {
      setBulkError("Select at least one bill first.");
      return;
    }
    if (!onBulkVoid) return;
    setBulkBusy(true);
    setBulkError(null);
    try {
      await onBulkVoid(Array.from(selectedIds));
      setSelectedIds(new Set());
      setBulkOpen(false);
    } catch (error) {
      setBulkError(
        error instanceof Error ? error.message : "Bulk void failed.",
      );
    } finally {
      setBulkBusy(false);
    }
  };

  const runBulkDelete = async () => {
    if (selectedCount === 0) {
      setBulkError("Select at least one bill first.");
      return;
    }
    if (!onBulkDelete) return;
    
    if (!confirm(`Are you sure you want to permanently delete ${selectedCount} selected bills? This cannot be undone.`)) {
      return;
    }

    setBulkBusy(true);
    setBulkError(null);
    try {
      await onBulkDelete(Array.from(selectedIds));
      setSelectedIds(new Set());
      setBulkOpen(false);
    } catch (error) {
      setBulkError(
        error instanceof Error ? error.message : "Bulk delete failed.",
      );
    } finally {
      setBulkBusy(false);
    }
  };

  if (tab === "vendors") {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Vendors</h2>
          <button
            type="button"
            onClick={() => onTabChange("all")}
            className="text-xs font-semibold text-violet-700"
          >
            Back to purchases
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-white">
              <tr className="border-b border-slate-100 text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-semibold">Vendor</th>
                <th className="px-3 py-3 font-semibold">GSTIN / PAN/TAN</th>
                <th className="px-3 py-3 font-semibold">Open</th>
                <th className="px-3 py-3 text-right font-semibold">
                  Outstanding
                </th>
                <th className="px-4 py-3 text-right font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {vendors.map((vendor) => (
                <tr
                  key={vendor.id}
                  className="cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50/70"
                  onClick={() => onSelectVendor(vendor)}
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-900">{vendor.name}</p>
                    <p className="text-xs text-slate-500">
                      {[vendor.city, vendor.state].filter(Boolean).join(", ") ||
                        "—"}
                    </p>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs text-slate-600">
                    <p>{vendor.gstin || "—"}</p>
                    <p>{vendor.pan || ""}</p>
                  </td>
                  <td className="px-3 py-3 text-slate-700">
                    {vendor.openPurchaseCount}
                  </td>
                  <td className="px-3 py-3 text-right font-semibold text-rose-600">
                    {formatPurchaseMoney(vendor.outstandingBalance)}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-semibold capitalize text-emerald-700">
                    {vendor.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  }

  return (
    <section id="purchase-data-table" className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto border-b border-slate-100 px-2">
        <div className="inline-flex min-w-full gap-1 items-center">
          {tabOrder.map(([id, label]) => {
            const selected = tab === id;
            const isDragging = draggedTab === id;
            const isOver = dragOverTab === id;

            return (
              <button
                key={id}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/plain", id);
                  setDraggedTab(id);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverTab(id);
                }}
                onDragLeave={() => {
                  if (dragOverTab === id) setDragOverTab(null);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleTabDrop(id);
                }}
                onDragEnd={() => {
                  setDraggedTab(null);
                  setDragOverTab(null);
                }}
                onClick={() => {
                  onTabChange(id);
                  setPage(1);
                  setTypeFilter("all");
                  setStatusFilter("all");
                  setVendorFilter("all");
                }}
                title="Drag to re-order tabs"
                className={`group relative whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition cursor-grab active:cursor-grabbing select-none ${
                  selected
                    ? "border-violet-600 text-violet-700 font-extrabold"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                } ${isDragging ? "opacity-30 scale-95" : ""} ${
                  isOver ? "border-dashed border-violet-400 bg-violet-50/60" : ""
                }`}
              >
                <span className="flex items-center gap-1">
                  <span className="opacity-0 group-hover:opacity-40 transition-opacity font-mono text-xs">⋮⋮</span>
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex h-14 flex-nowrap items-center gap-2 overflow-x-auto border-b border-slate-100 px-4">
        <label className="relative min-w-[160px] flex-1 basis-0">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search Bill No., Vendor, Invoice No., SKU, HSN…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm focus:border-violet-500 focus:outline-none"
          />
        </label>
        <div className="w-[132px] shrink-0">
          <CommerceSelect
            size="sm"
            value={typeFilter}
            onChange={(value) => {
              setTypeFilter(value);
              setPage(1);
            }}
            options={[
              { value: "all", label: "All types" },
              ...ALL_PURCHASE_TYPES.map((type) => ({
                value: type,
                label: PURCHASE_TYPE_LABELS[type],
              })),
            ]}
            searchable={false}
            placeholder="Type"
          />
        </div>
        <div className="w-[120px] shrink-0">
          <CommerceSelect
            size="sm"
            value={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setPage(1);
            }}
            options={[
              { value: "all", label: "All status" },
              ...(
                Object.keys(PURCHASE_STATUS_LABELS) as PurchaseStatus[]
              ).map((status) => ({
                value: status,
                label: PURCHASE_STATUS_LABELS[status],
              })),
            ]}
            searchable={false}
            placeholder="Status"
          />
        </div>
        <div className="w-[150px] shrink-0">
          <CommerceSelect
            size="sm"
            value={vendorFilter}
            onChange={(value) => {
              setVendorFilter(value);
              setPage(1);
            }}
            options={[
              { value: "all", label: "All vendors" },
              ...vendors.map((vendor) => ({
                value: vendor.id,
                label: vendor.name,
              })),
            ]}
            searchable
            placeholder="Vendor"
          />
        </div>
        <button
          type="button"
          onClick={() => onExport(filtered)}
          className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <FileSpreadsheet size={15} />
          Export
        </button>
        <div className="relative shrink-0" ref={bulkRef}>
          <button
            ref={bulkButtonRef}
            type="button"
            onClick={() => {
              setBulkError(null);
              setBulkOpen((open) => !open);
            }}
            className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold transition ${
              bulkOpen
                ? "border-violet-500 bg-violet-50 text-violet-800 ring-2 ring-violet-100"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Bulk Actions
            {selectedCount > 0 ? (
              <span className="rounded-md bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {selectedCount}
              </span>
            ) : null}
            <ChevronDown
              size={14}
              className={`transition ${bulkOpen ? "rotate-180" : ""}`}
            />
          </button>
          {mounted && bulkOpen
            ? createPortal(
                <div
                  id="purchase-bulk-menu"
                  style={bulkStyle}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
                >
                  <p className="px-2.5 py-1.5 text-[11px] font-medium text-slate-400">
                    {selectedCount > 0
                      ? `${selectedCount} bill${selectedCount === 1 ? "" : "s"} selected`
                      : "Select bills with checkboxes first"}
                  </p>
                  <button
                    type="button"
                    disabled={selectedCount === 0 || bulkBusy}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={runBulkExport}
                  >
                    Export selected
                  </button>
                  <button
                    type="button"
                    disabled={selectedCount === 0 || bulkBusy}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => void runBulkVoid()}
                  >
                    {bulkBusy ? "Voiding…" : "Void selected"}
                  </button>
                  {bulkError ? (
                    <p className="px-2.5 py-1.5 text-[11px] font-medium text-rose-600">
                      {bulkError}
                    </p>
                  ) : null}
                </div>,
                document.body,
              )
            : null}
        </div>
      </div>

      {tab === "deleted" && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 font-medium">
          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>
            <strong>Trash Retention (30 Days):</strong> Soft-deleted bills are retained for 30 days before permanent deletion. Click <strong>Restore</strong> on any bill to move it back to active purchases.
          </span>
        </div>
      )}

      {selectedCount > 0 ? (
        <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-4 py-2 text-sm text-emerald-950 border border-emerald-200 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200 mb-2">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-xs shadow-xs">
              {selectedCount}
            </span>
            <p className="font-bold text-emerald-900">
              bill{selectedCount === 1 ? "" : "s"} selected
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={runBulkExport}
              disabled={bulkBusy}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50"
            >
              Export Selected
            </button>
            {onBulkVoid && (
              <button
                type="button"
                disabled={bulkBusy}
                onClick={() => void runBulkVoid()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 transition cursor-pointer"
              >
                {bulkBusy ? "Voiding…" : `Void Selected (${selectedCount})`}
              </button>
            )}
            {onBulkDelete && (
              <button
                type="button"
                disabled={bulkBusy}
                onClick={() => void runBulkDelete()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-red-700 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-red-800 disabled:opacity-50 transition cursor-pointer"
              >
                {bulkBusy ? "Deleting…" : `Delete Selected (${selectedCount})`}
              </button>
            )}
            <button
              type="button"
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 hover:underline"
              onClick={() => {
                setSelectedIds(new Set());
                setBulkError(null);
              }}
            >
              Clear selection
            </button>
          </div>
        </div>
      ) : null}

      {/* Fixed Header Table */}
      <div className="overflow-hidden rounded-t-2xl border-x border-t border-slate-200 bg-slate-50">
        <table className="w-full text-left text-xs font-sans table-fixed min-w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-xs font-extrabold uppercase tracking-wider text-slate-500 whitespace-nowrap">
              <th className="w-7 px-2.5 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  aria-label="Select all"
                />
              </th>
              <th
                onClick={() => handleSort("billNumber")}
                className={`${showPaymentDetails ? "w-[13%] px-2.5" : "w-[12%] px-2.5"} py-3 font-bold cursor-pointer hover:bg-slate-100/70 transition-colors group select-none`}
              >
                <div className="flex items-center">
                  <span>{showPaymentDetails ? "Bill" : "Purchase No."}</span>
                  {renderSortIcon("billNumber")}
                </div>
              </th>
              <th
                onClick={() => handleSort("billDate")}
                className={`${showPaymentDetails ? "w-[8%] px-2.5" : "w-[7%] px-2.5"} py-3 font-bold cursor-pointer hover:bg-slate-100/70 transition-colors group select-none`}
              >
                <div className="flex items-center">
                  <span>Date</span>
                  {renderSortIcon("billDate")}
                </div>
              </th>
              <th
                onClick={() => handleSort("purchaseType")}
                className={`${showPaymentDetails ? "w-[10%] px-2.5" : "w-[9%] px-2.5"} py-3 font-bold cursor-pointer hover:bg-slate-100/70 transition-colors group select-none`}
              >
                <div className="flex items-center">
                  <span>Type</span>
                  {renderSortIcon("purchaseType")}
                </div>
              </th>
              <th
                onClick={() => handleSort("vendorName")}
                className={`${showPaymentDetails ? "w-[23%] px-2.5" : "w-[18%] px-2.5"} py-3 font-bold cursor-pointer hover:bg-slate-100/70 transition-colors group select-none`}
              >
                <div className="flex items-center">
                  <span>Vendor</span>
                  {renderSortIcon("vendorName")}
                </div>
              </th>
              <th
                onClick={() => handleSort("totalAmount")}
                className={`${showPaymentDetails ? "w-[12%] px-2.5" : "w-[9%] px-2.5"} py-3 text-right font-bold cursor-pointer hover:bg-slate-100/70 transition-colors group select-none`}
              >
                <div className="flex items-center justify-end">
                  <span>Amount</span>
                  {renderSortIcon("totalAmount")}
                </div>
              </th>
              {!showPaymentDetails ? (
                <th
                  onClick={() => handleSort("taxAmount")}
                  className="w-[6%] px-2.5 py-3 text-right font-bold cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                >
                  <div className="flex items-center justify-end">
                    <span>Tax</span>
                    {renderSortIcon("taxAmount")}
                  </div>
                </th>
              ) : null}
              <th
                onClick={() => handleSort("status")}
                className={`${showPaymentDetails ? "w-[11%] px-2.5" : "w-[9%] px-2.5"} py-3 font-bold cursor-pointer hover:bg-slate-100/70 transition-colors group select-none`}
              >
                <div className="flex items-center">
                  <span>Status</span>
                  {renderSortIcon("status")}
                </div>
              </th>
              <th
                onClick={() => handleSort("paymentStatus")}
                className={`${showPaymentDetails ? "w-[13%] px-2.5" : "w-[11%] px-2.5"} py-3 font-bold cursor-pointer hover:bg-slate-100/70 transition-colors group select-none`}
              >
                <div className="flex items-center">
                  <span>Payment Status</span>
                  {renderSortIcon("paymentStatus")}
                </div>
              </th>
              {showPaymentDetails ? (
                <th
                  onClick={() => handleSort("pendingAmount")}
                  className="w-[10%] px-2.5 py-3 text-right font-bold cursor-pointer hover:bg-slate-100/70 transition-colors group select-none"
                >
                  <div className="flex items-center justify-end">
                    <span>Pending</span>
                    {renderSortIcon("pendingAmount")}
                  </div>
                </th>
              ) : null}

              {!showPaymentDetails ? (
                <th className="w-[12%] px-2.5 py-3 font-bold whitespace-nowrap">Next action</th>
              ) : null}
              <th
                className={`${showPaymentDetails ? "w-[6%] px-2.5" : "w-[5%] px-2.5"} py-3 text-center font-bold whitespace-nowrap`}
              >
                Action
              </th>
            </tr>
          </thead>
        </table>
      </div>

      {/* Scrollable Data Table Body (Scrollbar starts HERE below header) */}
      <div className="overflow-x-auto max-h-[520px] overflow-y-auto custom-scrollbar rounded-b-2xl border-x border-b border-slate-200 bg-white">
        <table className="w-full text-left text-xs font-sans table-fixed min-w-full">
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    showPaymentDetails
                      ? 9 + (capabilities.inventory ? 1 : 0)
                      : 10 + (capabilities.inventory ? 1 : 0)
                  }
                  className="px-4 py-12 text-center text-sm text-slate-500"
                >
                  <p>No records in this view yet.</p>
                  <button
                    type="button"
                    onClick={onNewBill}
                    className="mt-2 text-sm font-semibold text-violet-700"
                  >
                    + New Purchase
                  </button>
                </td>
              </tr>
            ) : (
              pageRows.map((bill) => {
                const workflow = workflowLabel(bill.status);
                const payment = paymentLabel(bill.paymentStatus);
                const nextAction = showPaymentDetails
                  ? null
                  : nextPurchaseAction(bill, capabilities);
                const impact = businessImpact(bill, capabilities);
                const pendingDue = billPendingAmount(bill);
                const TypeIcon = TYPE_ICON[bill.purchaseType];
                const transitions = nextStatuses(bill.purchaseType, bill.status);
                return (
                  <tr
                    key={bill.id}
                    role="button"
                    tabIndex={0}
                    className={`cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors ${
                      selectedIds.has(bill.id) ? "bg-emerald-50/60" : ""
                    }`}
                    onClick={() => onViewBill?.(bill)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onViewBill?.(bill);
                      }
                    }}
                  >
                    <td
                      className="w-7 px-2.5 py-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(bill.id)}
                        onChange={() => toggleOne(bill.id)}
                        aria-label={`Select ${bill.billNumber}`}
                      />
                    </td>
                    <td className={`${showPaymentDetails ? "w-[13%] px-2.5" : "w-[12%] px-2.5"} py-3`}>
                      <p className="truncate text-sm font-bold text-violet-700">
                        {bill.billNumber}
                      </p>
                      {bill.createdByName || bill.createdBy ? (
                        <p className="truncate text-xs text-slate-500 font-medium mt-0.5">
                          By {bill.createdByName || bill.createdBy}
                        </p>
                      ) : null}
                      {bill.vendorInvoiceNumber ? (
                        <p className="truncate text-xs text-slate-400 font-mono mt-0.5">
                          Inv: {bill.vendorInvoiceNumber}
                        </p>
                      ) : null}
                      {bill.isDeleted && bill.deletedAt ? (
                        <span className="mt-1 inline-block rounded-md bg-rose-50 px-1.5 py-0.5 text-[10px] font-extrabold text-rose-700 border border-rose-200">
                          Purges in {Math.max(0, 30 - Math.floor((Date.now() - new Date(bill.deletedAt).getTime()) / (1000 * 60 * 60 * 24)))}d
                        </span>
                      ) : null}
                    </td>
                    <td
                      className={`whitespace-nowrap ${showPaymentDetails ? "w-[8%] px-2.5" : "w-[7%] px-2.5"} py-3 text-xs font-semibold text-slate-700`}
                    >
                      {formatDdMmm(bill.billDate)}
                    </td>
                    <td className={`${showPaymentDetails ? "w-[10%] px-2.5" : "w-[9%] px-2.5"} py-3`}>
                      <span
                        className={`inline-flex max-w-full items-center gap-1.5 truncate rounded-lg px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ring-black/5 ${typeBadgeClass(bill.purchaseType)}`}
                        title={PURCHASE_TYPE_LABELS[bill.purchaseType]}
                      >
                        <TypeIcon size={14} className="shrink-0 opacity-80" />
                        <span className="truncate">
                          {PURCHASE_TYPE_SHORT_LABELS[bill.purchaseType]}
                        </span>
                      </span>
                    </td>
                    <td
                      className={`${showPaymentDetails ? "w-[23%] px-2.5" : "w-[18%] px-2.5"} py-2 align-middle text-sm font-bold text-slate-800`}
                    >
                      <p className="line-clamp-2 leading-[1.3] break-words" title={bill.vendorName}>
                        {bill.vendorName}
                      </p>
                    </td>
                    <td
                      className={`whitespace-nowrap ${showPaymentDetails ? "w-[12%] px-2.5" : "w-[9%] px-2.5"} py-3 text-right text-sm font-bold text-slate-900 [font-variant-numeric:tabular-nums] tracking-tight`}
                    >
                      {formatPurchaseMoney(bill.totalAmount)}
                    </td>
                    {!showPaymentDetails ? (
                      <td className="whitespace-nowrap w-[6%] px-2.5 py-3 text-right text-xs font-semibold text-slate-600 [font-variant-numeric:tabular-nums] tracking-tight">
                        {formatPurchaseMoney(bill.taxAmount)}
                      </td>
                    ) : null}
                    <td className={`${showPaymentDetails ? "w-[11%] px-2.5" : "w-[9%] px-2.5"} py-3`}>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${WORKFLOW_STYLE[workflow] ?? "bg-slate-100 text-slate-700"}`}
                      >
                        {workflow}
                      </span>
                    </td>
                    <td className={`${showPaymentDetails ? "w-[13%] px-2.5" : "w-[11%] px-2.5"} py-3`}>
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${PAY_STYLE[payment] ?? "bg-slate-100 text-slate-600"}`}
                      >
                        {showPaymentDetails && payment === "Partially Paid"
                          ? "Partial"
                          : payment}
                      </span>
                    </td>
                    {showPaymentDetails ? (
                      <td
                        className="w-[10%] px-2.5 py-3 text-right tracking-tight [font-variant-numeric:tabular-nums]"
                        onClick={(event) => event.stopPropagation()}
                      >
                        {pendingDue > 0 ? (
                          <span className="text-sm font-bold text-amber-700 [font-variant-numeric:tabular-nums] tracking-tight">
                            {formatPurchaseMoney(pendingDue)}
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-emerald-700">
                            {"\u20B9\u20090"}
                          </span>
                        )}
                      </td>
                    ) : null}

                    {!showPaymentDetails ? (
                      <td className="w-[12%] px-2.5 py-2 align-middle">
                        <span
                          className={`inline-block rounded-md px-2.5 py-1 text-xs font-semibold leading-[1.2] text-left ${NEXT_ACTION_STYLE[nextAction?.tone ?? "slate"]}`}
                          title={nextAction?.label}
                        >
                          {formatTwoLineLabel(nextAction?.label)}
                        </span>
                      </td>
                    ) : null}
                    <td
                      className={`relative ${showPaymentDetails ? "w-[6%] px-2.5" : "w-[5%] px-2.5"} py-3 text-center`}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          aria-label="View bill"
                          title="View bill"
                          onClick={() => onViewBill?.(bill)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          aria-label="More"
                          onClick={() =>
                            setRowMenu((id) =>
                              id === bill.id ? null : bill.id,
                            )
                          }
                        >
                          <MoreHorizontal size={16} />
                        </button>
                      </div>
                      {rowMenu === bill.id ? (
                        <div
                          id={`row-menu-${bill.id}`}
                          className="absolute right-4 z-20 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
                          onMouseDown={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-700"
                            onClick={() => {
                              onViewBill?.(bill);
                              setRowMenu(null);
                            }}
                          >
                            View bill
                          </button>
                          {onEditBill ? (
                            <button
                              type="button"
                              className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-amber-700 hover:bg-amber-50"
                              onClick={() => {
                                onEditBill(bill);
                                setRowMenu(null);
                              }}
                            >
                              Edit bill
                            </button>
                          ) : null}
                          {transitions.map((status) => (
                            <button
                              key={status}
                              type="button"
                              className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:bg-violet-50 hover:text-violet-700"
                              onClick={() => {
                                void onTransition(bill.id, status);
                                setRowMenu(null);
                              }}
                            >
                              → {PURCHASE_STATUS_LABELS[status]}
                            </button>
                          ))}
                          {bill.isDeleted ? (
                            <>
                              {onRestoreBill ? (
                                <button
                                  type="button"
                                  className="block w-full rounded-lg px-3 py-2 text-left text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                                  onClick={() => {
                                    onRestoreBill(bill.id);
                                    setRowMenu(null);
                                  }}
                                >
                                  ↩ Restore bill
                                </button>
                              ) : null}
                              {onPermanentDeleteBill ? (
                                <button
                                  type="button"
                                  className="block w-full border-t border-slate-100 px-3 py-2 text-left text-xs font-bold text-rose-600 hover:bg-rose-50"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        `PERMANENTLY delete bill ${bill.billNumber}? This cannot be undone.`,
                                      )
                                    ) {
                                      onPermanentDeleteBill(bill.id);
                                    }
                                    setRowMenu(null);
                                  }}
                                >
                                  ❌ Delete permanently
                                </button>
                              ) : null}
                            </>
                          ) : onDeleteBill ? (
                            <button
                              type="button"
                              className="block w-full border-t border-slate-100 px-3 py-2 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50"
                              onClick={() => {
                                if (
                                  confirm(
                                    `Move bill ${bill.billNumber} to Trash (30-day retention)?`,
                                  )
                                ) {
                                  onDeleteBill(bill.id);
                                }
                                setRowMenu(null);
                              }}
                            >
                              Move to Trash
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100 px-3 py-1 bg-slate-50/50">
        <ProductPagination
          page={safePage}
          pageSize={pageSize}
          totalItems={filtered.length}
          pageSizeOptions={PAGE_SIZES}
          itemLabel="bills"
          variant="compact"
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      </div>
    </section>
  );
}
