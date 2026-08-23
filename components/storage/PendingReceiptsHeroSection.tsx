import { useState, useMemo } from "react";
import {
  Package,
  Truck,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Search,
  X,
  PackageCheck,
  CheckSquare,
  Square,
} from "lucide-react";
import type { PurchaseBill } from "@/lib/purchase/types";
import { receivingEngine } from "@/lib/storage/engine/receiving.engine";
import BulkReceivingWorkspaceModal from "./modals/BulkReceivingWorkspaceModal";

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
] as const;

/** Format ISO date `YYYY-MM-DD` as `DD-MMM` (e.g. 20-Aug). */
function formatDdMmm(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  const monthLabel = MONTH_SHORT[Number(month) - 1];
  if (!monthLabel || !day) return isoDate;
  return `${day}-${monthLabel}`;
}

interface PendingReceiptsHeroSectionProps {
  pendingBills: PurchaseBill[];
  onReceiveGoods: (bill: PurchaseBill) => void;
  onInspectBill?: (bill: PurchaseBill) => void;
  onSync?: () => void;
  isSyncing?: boolean;
  lastSyncedAt?: string;
}

type PageSizeOption = 10 | 25 | 50 | "All";
type SortField = "billDate" | "billNumber" | "vendorName" | "inventory" | "consumable" | "pendingQty";
type SortDirection = "asc" | "desc";

export default function PendingReceiptsHeroSection({
  pendingBills,
  onReceiveGoods,
  onInspectBill,
  onSync,
  isSyncing = false,
  lastSyncedAt = "Live",
}: PendingReceiptsHeroSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [pageSize, setPageSize] = useState<PageSizeOption>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [sortField, setSortField] = useState<SortField>("billDate");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  // Bulk Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  // Universal Search Filter (bill #, vendor, invoice #, item description, SKU, HSN)
  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return pendingBills;
    const q = searchQuery.toLowerCase().trim();
    return pendingBills.filter((bill) => {
      const matchBillNo = bill.billNumber.toLowerCase().includes(q);
      const matchVendor = bill.vendorName.toLowerCase().includes(q);
      const matchInvoice = (bill.vendorInvoiceNumber ?? "").toLowerCase().includes(q);
      const matchLines = (bill.lines ?? []).some(
        (line) =>
          (line.description ?? "").toLowerCase().includes(q) ||
          (line.sku ?? "").toLowerCase().includes(q) ||
          (line.hsn ?? "").toLowerCase().includes(q),
      );
      return matchBillNo || matchVendor || matchInvoice || matchLines;
    });
  }, [pendingBills, searchQuery]);

  // Multi-column sorting logic
  const sortedBills = useMemo(() => {
    return [...filteredBySearch].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      const linesA = receivingEngine.filterReceivableLines(a);
      const linesB = receivingEngine.filterReceivableLines(b);

      if (sortField === "billNumber") {
        valA = a.billNumber;
        valB = b.billNumber;
      } else if (sortField === "vendorName") {
        valA = a.vendorName.toLowerCase();
        valB = b.vendorName.toLowerCase();
      } else if (sortField === "billDate") {
        valA = a.billDate;
        valB = b.billDate;
      } else if (sortField === "inventory") {
        valA = linesA.filter(
          (l) => l.intent === "sellable" || a.purchaseType === "inventory_product"
        ).length;
        valB = linesB.filter(
          (l) => l.intent === "sellable" || b.purchaseType === "inventory_product"
        ).length;
      } else if (sortField === "consumable") {
        valA = linesA.filter(
          (l) => l.intent === "consumable" || a.purchaseType === "packaging_material"
        ).length;
        valB = linesB.filter(
          (l) => l.intent === "consumable" || b.purchaseType === "packaging_material"
        ).length;
      } else if (sortField === "pendingQty") {
        valA = linesA.reduce((sum, line) => {
          const received = line.qcRecord?.receivedQty ?? 0;
          return sum + Math.max(0, line.quantity - received);
        }, 0);
        valB = linesB.reduce((sum, line) => {
          const received = line.qcRecord?.receivedQty ?? 0;
          return sum + Math.max(0, line.quantity - received);
        }, 0);
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [pendingBills, sortField, sortDir]);

  // Calculate pagination variables
  const { paginatedBills, totalPages, startIndex, endIndex, validPage } = useMemo(() => {
    const total = sortedBills.length;
    if (total === 0) {
      return { paginatedBills: [], totalPages: 1, startIndex: 0, endIndex: 0, validPage: 1 };
    }

    if (pageSize === "All") {
      return {
        paginatedBills: sortedBills,
        totalPages: 1,
        startIndex: 1,
        endIndex: total,
        validPage: 1,
      };
    }

    const pages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, currentPage), pages);
    const startIdx = (safePage - 1) * pageSize;
    const endIdx = Math.min(startIdx + pageSize, total);
    const sliced = sortedBills.slice(startIdx, endIdx);

    return {
      paginatedBills: sliced,
      totalPages: pages,
      startIndex: startIdx + 1,
      endIndex: endIdx,
      validPage: safePage,
    };
  }, [sortedBills, pageSize, currentPage]);

  const handlePageSizeChange = (option: PageSizeOption) => {
    setPageSize(option);
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-violet-600 shrink-0 font-bold" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-violet-600 shrink-0 font-bold" />
    );
  };
  // Selection helpers
  const selectedBills = useMemo(() => {
    return pendingBills.filter((b) => selectedIds.has(b.id));
  }, [pendingBills, selectedIds]);

  const allSelected = useMemo(() => {
    return (
      sortedBills.length > 0 &&
      sortedBills.every((b) => selectedIds.has(b.id))
    );
  }, [sortedBills, selectedIds]);

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(sortedBills.map((b) => b.id)));
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (pendingBills.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-6 text-center space-y-2 shadow-sm">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
          <ShieldCheck className="h-6 w-6" />
        </div>
        <h3 className="text-base font-extrabold text-slate-900">All Purchases Received</h3>
        <p className="text-xs font-medium text-slate-500 max-w-md mx-auto">
          There are no pending purchase dispatches waiting to be received into your Storage Locations.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Banner & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50/80 via-white to-amber-50/40 p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-md shadow-amber-500/20">
            <Truck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Pending Warehouse Receipts
            </h2>
            <p className="text-xs font-medium text-slate-500">
              {pendingBills.length} purchase bills waiting to be received into physical bin locations.
            </p>
          </div>
        </div>

        {/* Realtime Auto-Sync Badge & Sync Now Button */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-extrabold text-emerald-700 border border-emerald-200/80 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            Auto-Sync: {lastSyncedAt}
          </span>

          {onSync && (
            <button
              type="button"
              onClick={onSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-extrabold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isSyncing ? "animate-spin text-violet-600" : ""}`} />
              <span>{isSyncing ? "Syncing..." : "Sync Now"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Single Line Search & Bulk Action Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xs">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search bill #, vendor name, item, SKU, HSN..."
            className="h-9.5 w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-8 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-violet-500 focus:bg-white focus:outline-none transition-all"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {selectedIds.size > 0 ? (
            <div className="flex items-center gap-2 animate-fadeIn">
              <span className="inline-flex items-center gap-1 rounded-lg bg-violet-50 border border-violet-200 px-2.5 py-1 text-xs font-extrabold text-violet-900 whitespace-nowrap">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[10px] font-black text-white">
                  {selectedIds.size}
                </span>
                <span>selected</span>
              </span>

              <button
                type="button"
                onClick={() => setBulkModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-xs font-black text-white hover:bg-violet-700 shadow-sm transition-all active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <PackageCheck className="h-4 w-4" />
                <span>⚡ Bulk Receive ({selectedIds.size})</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-xs font-bold text-slate-400 hover:text-slate-700 underline px-1 whitespace-nowrap cursor-pointer"
              >
                Clear
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Compact Table Container */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Fixed Header Table (Scrollbar starts below this) */}
        <table className="w-full text-left text-xs font-sans table-fixed">
          <thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr className="whitespace-nowrap">
              <th className="w-[5%] px-3 py-3 text-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 h-4 w-4 cursor-pointer"
                />
              </th>

              <th
                onClick={() => handleSort("billNumber")}
                className="w-[33%] px-3 py-3 cursor-pointer hover:bg-slate-100/70 transition-colors select-none group"
              >
                <div className="flex items-center gap-1">
                  <span>Purchase Bill & Supplier</span>
                  {renderSortIcon("billNumber")}
                </div>
              </th>

              <th
                onClick={() => handleSort("billDate")}
                className="w-[12%] px-2.5 py-3 text-center cursor-pointer hover:bg-slate-100/70 transition-colors select-none group"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Date</span>
                  {renderSortIcon("billDate")}
                </div>
              </th>

              <th
                onClick={() => handleSort("inventory")}
                className="w-[11%] px-2.5 py-3 text-center cursor-pointer hover:bg-slate-100/70 transition-colors select-none group"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Inventory</span>
                  {renderSortIcon("inventory")}
                </div>
              </th>

              <th
                onClick={() => handleSort("consumable")}
                className="w-[11%] px-2.5 py-3 text-center cursor-pointer hover:bg-slate-100/70 transition-colors select-none group"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Consumable</span>
                  {renderSortIcon("consumable")}
                </div>
              </th>

              <th
                onClick={() => handleSort("pendingQty")}
                className="w-[12%] px-2.5 py-3 text-center cursor-pointer hover:bg-slate-100/70 transition-colors select-none group"
              >
                <div className="flex items-center justify-center gap-1">
                  <span>Pending Qty</span>
                  {renderSortIcon("pendingQty")}
                </div>
              </th>

              <th className="w-[16%] px-3 py-3 text-right pr-4">Action</th>
            </tr>
          </thead>
        </table>

        {/* Scrollable Body Container (Scrollbar starts HERE below header) */}
        <div className="max-h-[440px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs font-sans table-fixed">
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {paginatedBills.map((bill) => {
                const receivableLines = receivingEngine.filterReceivableLines(bill);

                const inventoryCount = receivableLines.filter(
                  (l) => l.intent === "sellable" || bill.purchaseType === "inventory_product"
                ).length;

                const consumableCount = receivableLines.filter(
                  (l) => l.intent === "consumable" || bill.purchaseType === "packaging_material"
                ).length;

                const totalPendingQty = receivableLines.reduce((sum, line) => {
                  const received = line.qcRecord?.receivedQty ?? 0;
                  return sum + Math.max(0, line.quantity - received);
                }, 0);

                const isSelected = selectedIds.has(bill.id);

                return (
                  <tr key={bill.id} className={`cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50/80 transition-colors group ${isSelected ? "bg-violet-50/30" : ""}`}>
                    {/* Select Checkbox */}
                    <td className="w-[5%] px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOne(bill.id)}
                        className="rounded border-slate-300 text-violet-600 focus:ring-violet-500 h-4 w-4 cursor-pointer"
                      />
                    </td>

                    {/* Bill & Supplier — styled like purchase table */}
                    <td className="w-[33%] px-2.5 py-3">
                      <button
                        type="button"
                        onClick={() => onInspectBill?.(bill)}
                        className="truncate text-sm font-bold text-violet-700 hover:text-violet-900 hover:underline text-left cursor-pointer transition-colors block"
                      >
                        {bill.billNumber}
                      </button>
                      <p className="truncate text-xs text-slate-500 font-medium mt-0.5">
                        {bill.vendorName}
                      </p>
                      {bill.vendorInvoiceNumber ? (
                        <p className="truncate text-xs text-slate-400 font-mono mt-0.5">
                          Inv: {bill.vendorInvoiceNumber}
                        </p>
                      ) : null}
                    </td>

                    {/* Date — DD-Mon format like purchase table */}
                    <td className="w-[12%] px-2.5 py-3 text-center text-slate-700 font-semibold text-sm truncate">
                      {formatDdMmm(bill.billDate)}
                    </td>

                    {/* Inventory Items */}
                    <td className="w-[11%] px-2.5 py-3 text-center">
                      <span className="font-extrabold text-slate-900">{inventoryCount}</span>
                      <span className="text-xs font-semibold text-slate-400 ml-1">items</span>
                    </td>

                    {/* Consumable Items */}
                    <td className="w-[11%] px-2.5 py-3 text-center">
                      <span className="font-extrabold text-slate-900">{consumableCount}</span>
                      <span className="text-xs font-semibold text-slate-400 ml-1">items</span>
                    </td>

                    {/* Pending Quantity */}
                    <td className="w-[12%] px-2.5 py-3 text-center">
                      <span className="inline-block rounded-md bg-amber-50 px-2 py-0.5 text-xs font-black text-amber-700 border border-amber-200/60">
                        {totalPendingQty.toLocaleString()} units
                      </span>
                    </td>

                    {/* Action */}
                    <td className="w-[16%] px-3 py-3 text-right pr-4">
                      <button
                        type="button"
                        onClick={() => onReceiveGoods(bill)}
                        className="inline-flex items-center gap-1 rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-violet-600 active:scale-95 transition-all shadow-2xs cursor-pointer"
                      >
                        <Package className="h-3 w-3" />
                        <span>Receive</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer Bar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-100 bg-slate-50/50 px-4 py-3 text-xs font-semibold text-slate-500">
          {/* Status count */}
          <div>
            Showing <span className="font-extrabold text-slate-900">{startIndex}</span> to{" "}
            <span className="font-extrabold text-slate-900">{endIndex}</span> of{" "}
            <span className="font-extrabold text-slate-900">{pendingBills.length}</span> pending bills
          </div>

          {/* Controls Right */}
          <div className="flex items-center gap-4">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Show:</span>
              <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200 shadow-sm">
                {(
                  [
                    { label: "10", val: 10 },
                    { label: "25", val: 25 },
                    { label: "50", val: 50 },
                    { label: "All", val: "All" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => handlePageSizeChange(opt.val)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold transition-colors ${
                      pageSize === opt.val
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Previous / Next Page Nav */}
            {pageSize !== "All" && totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  disabled={validPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="px-2 text-xs font-bold text-slate-700">
                  {validPage} / {totalPages}
                </span>

                <button
                  type="button"
                  disabled={validPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-white transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Receiving Workspace Modal */}
      <BulkReceivingWorkspaceModal
        isOpen={bulkModalOpen}
        bills={selectedBills}
        onClose={() => setBulkModalOpen(false)}
        onBulkReceivingComplete={(count) => {
          setSelectedIds(new Set());
          onSync?.();
        }}
      />
    </div>
  );
}
