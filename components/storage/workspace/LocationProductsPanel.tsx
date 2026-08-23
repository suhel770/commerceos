import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Package,
  Receipt,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  Layers,
} from "lucide-react";
import type { StockBalance } from "@/lib/inventory/types";

type SortField = "productName" | "type" | "sku" | "billNumber" | "available" | "reserved" | "damaged";
type SortDirection = "asc" | "desc";

interface LocationProductsPanelProps {

  balances: StockBalance[];
  onSelectSku?: (skuItem: StockBalance) => void;
}

interface GroupedSkuBalance {
  key: string;
  productName: string;
  sku: string;
  intent?: string; // "sellable" | "consumable" | "asset"
  primaryBillNumber?: string;
  available: number;
  reserved: number;
  damaged: number;
  batches: StockBalance[];
  rawItem: StockBalance;
}

export function detectItemClassification(item: { sku?: string; productName?: string; intent?: string }): {
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


function SearchableBillDropdown({
  uniqueBills,
  selectedBill,
  onSelectBill,
}: {
  uniqueBills: string[];
  selectedBill: string;
  onSelectBill: (billNo: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [billSearch, setBillSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredBills = useMemo(() => {
    if (!billSearch.trim()) return uniqueBills;
    const q = billSearch.toLowerCase().trim();
    return uniqueBills.filter((b) => b.toLowerCase().includes(q));
  }, [uniqueBills, billSearch]);

  const selectedLabel =
    selectedBill === "all"
      ? `All Bills (${uniqueBills.length})`
      : selectedBill;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center justify-between gap-1.5 w-36 sm:w-44 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-800 hover:border-violet-400 focus:border-violet-600 focus:outline-none transition-all cursor-pointer shadow-2xs"
      >
        <div className="flex items-center gap-1.5 truncate">
          <Receipt className="h-3.5 w-3.5 text-violet-600 shrink-0" />
          <span className="truncate">{selectedLabel}</span>
        </div>
        <ChevronDown className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform ${isOpen ? "rotate-180 text-violet-600" : ""}`} />
      </button>

      {/* Floating Searchable Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 z-50 mt-1.5 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl animate-fadeIn space-y-1.5">
          {/* Inner Search Field */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={billSearch}
              onChange={(e) => setBillSearch(e.target.value)}
              placeholder="Filter bill #..."
              autoFocus
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-7 pr-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-violet-600 focus:bg-white focus:outline-none transition-all"
            />
          </div>

          {/* Bill List */}
          <div className="max-h-52 overflow-y-auto custom-scrollbar space-y-0.5 pr-0.5">
            <button
              type="button"
              onClick={() => {
                onSelectBill("all");
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold transition-colors ${
                selectedBill === "all"
                  ? "bg-violet-600 text-white font-extrabold shadow-xs"
                  : "text-slate-700 hover:bg-violet-50 hover:text-violet-900"
              }`}
            >
              <span>All Purchase Bills</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${selectedBill === "all" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                {uniqueBills.length}
              </span>
            </button>

            {filteredBills.length === 0 ? (
              <div className="p-3 text-center text-xs font-semibold text-slate-400">
                No matching bill found
              </div>
            ) : (
              filteredBills.map((billNo) => {
                const isSelected = selectedBill === billNo;
                return (
                  <button
                    key={billNo}
                    type="button"
                    onClick={() => {
                      onSelectBill(billNo);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-bold transition-colors ${
                      isSelected
                        ? "bg-violet-600 text-white font-extrabold shadow-xs"
                        : "text-slate-700 hover:bg-violet-50 hover:text-violet-900"
                    }`}
                  >
                    <Receipt className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-white" : "text-violet-600"}`} />
                    <span className="truncate">{billNo}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LocationProductsPanel({ balances, onSelectSku }: LocationProductsPanelProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "in_stock" | "low_stock">("all");
  const [selectedBillFilter, setSelectedBillFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("productName");
  const [sortDir, setSortDir] = useState<SortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => new Set());

  // Extract unique bill numbers for filter dropdown
  const uniqueBills = useMemo(() => {
    const set = new Set<string>();
    for (const b of balances) {
      if (b.billNumber) set.add(b.billNumber);
    }
    return Array.from(set).sort();
  }, [balances]);

  // Helper to format clean display SKU code
  const getCleanSku = (rawSku: string, productName: string) => {
    if (!rawSku || rawSku.includes("-ln-") || rawSku.toLowerCase().startsWith("bill-")) {
      const cleanName = productName
        .toUpperCase()
        .replace(/[^A-Z0-9\s]/g, "")
        .trim()
        .split(/\s+/)
        .slice(0, 4)
        .join("-");
      return cleanName ? `SKU-${cleanName}` : "SKU-ITEM";
    }
    return rawSku;
  };

  // Group balances by Product Name so multi-bill receipts aggregate into 1 single consolidated row
  const groupedBalances = useMemo(() => {
    const map = new Map<string, GroupedSkuBalance>();

    for (const b of balances) {
      const cleanSku = getCleanSku(b.sku, b.productName);
      const groupKey = b.productName.toLowerCase().trim();
      const existing = map.get(groupKey);

      if (existing) {
        existing.available += b.available;
        existing.reserved += b.reserved;
        existing.damaged += b.damaged;
        existing.batches.push({ ...b, sku: cleanSku });
      } else {
        map.set(groupKey, {
          key: groupKey,
          productName: b.productName,
          sku: cleanSku,
          intent: b.intent,
          primaryBillNumber: b.billNumber,
          available: b.available,
          reserved: b.reserved,
          damaged: b.damaged,
          batches: [{ ...b, sku: cleanSku }],
          rawItem: { ...b, sku: cleanSku },
        });
      }

    }

    return Array.from(map.values());
  }, [balances]);

  // Filter grouped balances
  const filteredBalances = useMemo(() => {
    return groupedBalances.filter((item) => {
      // Bill Filter
      if (selectedBillFilter !== "all") {
        const matchesBill = item.batches.some(
          (b) => (b.billNumber || "").toLowerCase() === selectedBillFilter.toLowerCase()
        );
        if (!matchesBill) return false;
      }

      // Search Filter
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchName = item.productName.toLowerCase().includes(q);
        const matchBill = item.batches.some((b) => (b.billNumber || "").toLowerCase().includes(q));
        if (!matchSku && !matchName && !matchBill) return false;
      }

      // Stock Status Filter
      if (statusFilter === "in_stock" && item.available <= 5) return false;
      if (statusFilter === "low_stock" && (item.available > 5 || item.available === 0)) return false;

      return true;
    });
  }, [groupedBalances, selectedBillFilter, search, statusFilter]);

  // Sort grouped balances
  const sortedBalances = useMemo(() => {
    return [...filteredBalances].sort((a, b) => {
      let valA: string | number = "";
      let valB: string | number = "";

      switch (sortField) {
        case "productName":
          valA = a.productName.toLowerCase();
          valB = b.productName.toLowerCase();
          break;
        case "type":
          valA = detectItemClassification(a).label.toLowerCase();
          valB = detectItemClassification(b).label.toLowerCase();
          break;
        case "sku":
          valA = a.sku.toLowerCase();
          valB = b.sku.toLowerCase();
          break;

        case "billNumber":
          valA = (a.primaryBillNumber || "").toLowerCase();
          valB = (b.primaryBillNumber || "").toLowerCase();
          break;
        case "available":
          valA = a.available;
          valB = b.available;
          break;
        case "reserved":
          valA = a.reserved;
          valB = b.reserved;
          break;
        case "damaged":
          valA = a.damaged;
          valB = b.damaged;
          break;
      }

      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredBalances, sortField, sortDir]);

  const itemsPerPage = pageSize === 0 ? Math.max(1, sortedBalances.length) : pageSize;
  const totalPages = Math.ceil(sortedBalances.length / itemsPerPage) || 1;

  const paginatedBalances = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedBalances.slice(start, start + itemsPerPage);
  }, [sortedBalances, currentPage, itemsPerPage]);

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
      return <ArrowUpDown className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />;
    }
    return sortDir === "asc" ? (
      <ArrowUp className="h-3.5 w-3.5 text-violet-600 shrink-0 font-bold" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-violet-600 shrink-0 font-bold" />
    );
  };

  const toggleExpand = (key: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4 font-sans">
      {/* Header & Controls in Single Line */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="shrink-0">
          <h3 className="text-sm font-extrabold text-slate-900">
            Stored Products ({sortedBalances.length})
          </h3>
          <p className="text-xs font-medium text-slate-400">
            Physical SKUs & inflow history in this facility.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search SKU or Name..."
              className="w-36 sm:w-40 rounded-xl border border-slate-200 pl-7 pr-2.5 py-1.5 text-xs font-semibold text-slate-900 focus:border-violet-600 focus:outline-none"
            />
          </div>

          {/* Searchable Bill Dropdown Filter */}
          <SearchableBillDropdown
            uniqueBills={uniqueBills}
            selectedBill={selectedBillFilter}
            onSelectBill={(billNo) => {
              setSelectedBillFilter(billNo);
              setCurrentPage(1);
            }}
          />

          {/* Filter Pills */}
          <div className="flex items-center gap-0.5 rounded-xl bg-slate-100 p-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                statusFilter === "all" ? "bg-white text-slate-900 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("in_stock");
                setCurrentPage(1);
              }}
              className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                statusFilter === "in_stock" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              In Stock
            </button>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("low_stock");
                setCurrentPage(1);
              }}
              className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-all ${
                statusFilter === "low_stock" ? "bg-white text-amber-800 shadow-xs" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Low Stock
            </button>
          </div>
        </div>
      </div>

      {/* Table Outer Container */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-xs">
        {/* Fixed Table Header Row Outside Scrollbar Area */}
        <div className="bg-slate-50 border-b border-slate-200 select-none">
          <table className="w-full text-left text-xs font-medium border-collapse table-fixed">
            <thead className="text-xs font-extrabold uppercase text-slate-400">
              <tr>
                <th
                  onClick={() => handleSort("productName")}
                  className="p-3 w-[28%] cursor-pointer hover:text-violet-700 transition-colors group"
                >
                  <div className="flex items-center gap-1">
                    <span>Product Name</span>
                    {renderSortIcon("productName")}
                  </div>
                </th>

                <th
                  onClick={() => handleSort("type")}
                  className="p-3 w-[15%] cursor-pointer hover:text-violet-700 transition-colors group"
                >
                  <div className="flex items-center gap-1">
                    <span>Item Type</span>
                    {renderSortIcon("type")}
                  </div>
                </th>

                <th
                  onClick={() => handleSort("sku")}
                  className="p-3 w-[17%] cursor-pointer hover:text-violet-700 transition-colors group"
                >
                  <div className="flex items-center gap-1">
                    <span>SKU</span>
                    {renderSortIcon("sku")}
                  </div>
                </th>

                <th
                  onClick={() => handleSort("billNumber")}
                  className="p-3 w-[18%] cursor-pointer hover:text-violet-700 transition-colors group"
                >
                  <div className="flex items-center gap-1">
                    <span>Source Bill & Batches</span>
                    {renderSortIcon("billNumber")}
                  </div>
                </th>

                <th
                  onClick={() => handleSort("available")}
                  className="p-3 w-[7.5%] text-center cursor-pointer hover:text-violet-700 transition-colors group"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Available</span>
                    {renderSortIcon("available")}
                  </div>
                </th>

                <th
                  onClick={() => handleSort("reserved")}
                  className="p-3 w-[7.5%] text-center cursor-pointer hover:text-violet-700 transition-colors group"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Reserved</span>
                    {renderSortIcon("reserved")}
                  </div>
                </th>

                <th
                  onClick={() => handleSort("damaged")}
                  className="p-3 w-[7%] text-center cursor-pointer hover:text-violet-700 transition-colors group"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Damaged</span>
                    {renderSortIcon("damaged")}
                  </div>
                </th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Scrollable Data Body ONLY — Vertical Scrollbar starts right below header! */}
        <div className="max-h-[480px] overflow-y-auto overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm font-medium border-collapse table-fixed">
            <tbody className="divide-y divide-slate-100 text-slate-800">
              {paginatedBalances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-10 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <Package className="h-5 w-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">No matching stock found</p>
                      <p className="text-[11px] font-medium text-slate-400 max-w-sm">
                        Try adjusting search filters or purchase bill selection.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBalances.map((item) => {
                  const isExpanded = expandedKeys.has(item.key);
                  const hasMultipleBatches = item.batches.length > 1;
                  const itemClassification = detectItemClassification(item);

                  return (
                    <Fragment key={item.key}>
                      <tr
                        onClick={() => onSelectSku?.(item.rawItem)}
                        className="hover:bg-violet-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="p-3 w-[28%] font-bold text-slate-900 group-hover:text-violet-700 transition-colors truncate">
                          {item.productName}
                        </td>

                        <td className="p-3 w-[15%]">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${itemClassification.badgeClass}`}
                          >
                            {itemClassification.label}
                          </span>
                        </td>

                        <td className="p-3 w-[17%] font-mono text-[11px] text-slate-500 group-hover:text-violet-700 truncate">
                          {item.sku}
                        </td>

                        <td className="p-3 w-[18%]">
                          {hasMultipleBatches ? (
                            <button
                              type="button"
                              onClick={(e) => toggleExpand(item.key, e)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1 text-[10px] font-extrabold text-indigo-900 border border-indigo-200 hover:bg-indigo-100 transition-colors"
                            >
                              <Layers className="h-3 w-3 text-indigo-600" />
                              <span>{item.batches.length} Inflow Batches</span>
                              {isExpanded ? <ChevronUp className="h-3 w-3 text-indigo-500" /> : <ChevronDown className="h-3 w-3 text-indigo-500" />}
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-extrabold text-violet-800 border border-violet-200/80">
                              <Receipt className="h-3 w-3 text-violet-600" />
                              {item.primaryBillNumber || "BILL-1101"}
                            </span>
                          )}
                        </td>

                        <td className="p-3 w-[7.5%] text-center font-black text-slate-900">{item.available}</td>
                        <td className="p-3 w-[7.5%] text-center font-semibold text-amber-600">{item.reserved}</td>
                        <td className="p-3 w-[7%] text-center font-semibold text-rose-600">{item.damaged}</td>
                      </tr>

                      {/* Multi-Bill Batch Accordion Sub-Rows */}
                      {hasMultipleBatches && isExpanded && (
                        <tr className="bg-slate-50/80 border-t border-slate-100">
                          <td colSpan={7} className="p-3 pl-8">
                            <div className="rounded-xl border border-indigo-100 bg-white p-3 space-y-2 shadow-xs">
                              <div className="flex items-center justify-between text-[10px] font-black uppercase text-indigo-900 border-b border-slate-100 pb-1.5">
                                <span>Inflow Batch Breakdown ({item.batches.length} Purchase Bills)</span>
                                <span className="text-slate-400 font-bold">Total Stock: {item.available} Units</span>
                              </div>

                              <div className="space-y-1.5">
                                {item.batches.map((batch, idx) => (
                                  <div
                                    key={batch.id || idx}
                                    className="flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-50 hover:bg-violet-50/60 transition-colors"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="font-extrabold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-md text-[11px]">
                                        {batch.billNumber || "BILL-1101"}
                                      </span>
                                      <span className="text-slate-600 font-semibold">{batch.productName}</span>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs">
                                      <span className="font-black text-slate-900">
                                        Available: <span className="text-violet-700">{batch.available}</span>
                                      </span>
                                      {batch.damaged > 0 && (
                                        <span className="font-extrabold text-rose-600">
                                          Damaged: {batch.damaged}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}

                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400">
            Page {currentPage} of {totalPages} ({sortedBalances.length} total SKUs)
          </span>

          {/* Page Size Selector */}
          <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mr-1">
              Show:
            </span>
            {[10, 25, 50, 0].map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => {
                  setPageSize(size);
                  setCurrentPage(1);
                }}
                className={`rounded-lg px-2.5 py-0.5 text-xs font-extrabold transition-all border ${
                  pageSize === size
                    ? "border-violet-600 bg-violet-50 text-violet-900 shadow-xs"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {size === 0 ? "All" : size}
              </button>
            ))}
          </div>
        </div>

        {/* Page Nav Buttons */}
        <div className="flex items-center gap-1 self-end sm:self-auto">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-lg border border-slate-200 p-1.5 text-slate-600 disabled:opacity-40 hover:bg-slate-50 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
