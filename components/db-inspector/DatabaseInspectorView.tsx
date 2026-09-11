"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Database,
  Server,
  HardDrive,
  Users,
  Truck,
  Package,
  RefreshCw,
  Search,
  Table as TableIcon,
  ArrowRight,
  ExternalLink,
  Layers,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Copy,
  Check,
  Box,
  Trash2,
  Ban,
  Unlock,
  ShieldAlert,
  Sparkles,
  Command,
  Cpu,
  Terminal,
  Download,
  FileText,
  Clock,
  Info,
  ArrowUpCircle,
  HelpCircle,
  FileCode2,
  Play,
  RotateCcw,
  CheckCircle,
  FolderArchive,
  BookOpen,
} from "lucide-react";
import CommerceSelect, {
  CommerceSelectOption,
} from "@/components/ui/CommerceSelect";

interface EngineMigration {
  id: string;
  migrationName: string;
  finishedAt: string;
  appliedStepsCount: number;
}

interface BackupFile {
  filename: string;
  sizeFormatted: string;
  sizeBytes: number;
  createdAt: string;
}

interface EngineInfo {
  fullVersion: string;
  serverVersion: string;
  serverVersionNum: number;
  majorVersion: number;
  status: string;
  releaseSupport: string;
  isUpToDate: boolean;
  installPath: string;
  pgDumpAvailable: boolean;
  serverEncoding: string;
  clientEncoding: string;
  maxConnections: number;
  activeConnections: number;
  sharedBuffers: string;
  workMem: string;
  startTime: string;
  uptimeFormatted: string;
  installedExtensions: Array<{ extname: string; extversion: string }>;
  availableExtensionsCount: number;
  migrations: EngineMigration[];
  backupsList: BackupFile[];
}

interface TableMetadata {
  name: string;
  rowCount: number;
  size: string;
  sizeBytes: number;
  category: string;
  description: string;
}

interface UserOwnership {
  userId: string;
  name: string;
  email: string;
  role: string;
  organizationName: string;
  billsCreatedCount: number;
  billsTotalAmount: number;
  auditActionsCount: number;
  storageOpsCount: number;
  status: string;
  isRegisteredUser: boolean;
}

interface ProductItem {
  id: string;
  sku: string;
  name: string;
  brand?: string | null;
  category: string;
  status: string;
  costPrice: number;
  sellingPrice: number;
  mrp: number;
  intent: string;
  productType: string;
  workspaceId: string;
  createdAt: string;
}

interface VendorMatrixItem {
  id: string;
  name: string;
  gstin: string;
  registrationType: string;
  phone: string;
  email: string;
  location: string;
  status: string;
  workspaceId: string;
  billsCount: number;
  purchaseOrdersCount: number;
  totalSpend: number;
  totalProductsSupplied: number;
  recentBills: Array<{
    id: string;
    billNumber: string;
    totalAmount: number;
    status: string;
    paymentStatus: string;
    billDate: string;
    createdBy: string;
    itemsCount: number;
  }>;
}

interface InspectorData {
  database: {
    name: string;
    totalSize: string;
    totalSizeBytes: number;
    tableCount: number;
    totalRowCount: number;
    checkedAt: string;
  };
  tables: TableMetadata[];
  userOwnership: UserOwnership[];
  vendorMatrix: VendorMatrixItem[];
  productsByWorkspace: Array<{ workspaceId: string; _count: { id: number } }>;
  products: ProductItem[];
  workspaces: Array<{
    id: string;
    name: string;
    code: string;
    organization: { name: string; slug: string };
  }>;
  engineInfo?: EngineInfo;
}

interface ExplorerData {
  table: string;
  total: number;
  limit: number;
  offset: number;
  columns: Array<{
    column_name: string;
    data_type: string;
    is_nullable: string;
    column_default: string | null;
  }>;
  rows: any[];
}

const CATEGORIES = [
  "All Categories",
  "Procurement & Purchase",
  "Catalog & Products",
  "Inventory & Storage",
  "Orders & Customers",
  "Tenants & RBAC",
  "System & Logs",
];

export default function DatabaseInspectorView() {
  const [data, setData] = useState<InspectorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const [activeTab, setActiveTab] = useState<
    "tables" | "items" | "users" | "vendors" | "explorer" | "engine"
  >("tables");

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [tableSearch, setTableSearch] = useState<string>("");
  const [itemSearch, setItemSearch] = useState<string>("");

  // Explorer tab state
  const [explorerTable, setExplorerTable] = useState<string>("");
  const [explorerData, setExplorerData] = useState<ExplorerData | null>(null);
  const [explorerLoading, setExplorerLoading] = useState(false);
  const [explorerPage, setExplorerPage] = useState(0);
  const [pageSize, setPageSize] = useState("25");

  // Selected vendor modal / detail state
  const [selectedVendor, setSelectedVendor] = useState<VendorMatrixItem | null>(null);

  // Deletion Confirmation Modal State
  const [pendingDelete, setPendingDelete] = useState<{
    type: "user" | "product" | "row" | "table";
    id?: string;
    tableName?: string;
    primaryKey?: Record<string, any>;
    title: string;
    details: string;
  } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Engine & Backup state
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);
  const [activeEngineSubtab, setActiveEngineSubtab] = useState<
    "overview" | "guide" | "backups" | "migrations"
  >("overview");

  // Copied state indicator
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(label);
    showToast(`Copied ${label} to clipboard!`, "success");
    setTimeout(() => setCopiedCommand(null), 3000);
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    setBackupSuccess(null);
    try {
      const res = await fetch("/api/v1/db-inspector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-backup" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create database backup");
      setBackupSuccess(result.message);
      showToast(result.message, "success");
      fetchOverview();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`Are you sure you want to delete backup file "${filename}"?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/db-inspector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-backup", filename }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to delete backup file");
      showToast(result.message, "success");
      fetchOverview();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  const fetchOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/db-inspector", { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Failed to load database stats (${res.status} ${res.statusText})`);
      }
      const json = await res.json();
      setData(json);
      if (!explorerTable && json.tables?.length > 0) {
        const defaultTbl =
          json.tables.find((t: TableMetadata) => t.name === "Product")?.name ||
          json.tables[0].name;
        setExplorerTable(defaultTbl);
      }
    } catch (err: any) {
      setError(err.message || "Failed to inspect database");
    } finally {
      setLoading(false);
    }
  };

  const fetchTableRows = async (tableName: string, page = 0, limit = 25) => {
    if (!tableName) return;
    setExplorerLoading(true);
    try {
      const offset = page * limit;
      const res = await fetch(
        `/api/v1/db-inspector?table=${encodeURIComponent(tableName)}&limit=${limit}&offset=${offset}`,
        { cache: "no-store" }
      );
      if (!res.ok) {
        throw new Error(`Failed to fetch table "${tableName}" data`);
      }
      const json = await res.json();
      setExplorerData(json);
      setExplorerPage(page);
    } catch (err: any) {
      console.error(err);
    } finally {
      setExplorerLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  useEffect(() => {
    if (activeTab === "explorer" && explorerTable) {
      fetchTableRows(explorerTable, 0, parseInt(pageSize, 10));
    }
  }, [activeTab, explorerTable, pageSize]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Actions: User Block / Unblock
  const handleToggleUserStatus = async (userId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/db-inspector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-user-status", userId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update user status");
      showToast(result.message, "success");
      await fetchOverview();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Actions: Product Block / Unblock
  const handleToggleProductStatus = async (productId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch("/api/v1/db-inspector", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle-product-status", productId }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update item status");
      showToast(result.message, "success");
      await fetchOverview();
      if (activeTab === "explorer" && explorerTable === "Product") {
        fetchTableRows("Product", explorerPage, parseInt(pageSize, 10));
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm Delete Execution
  const handleExecuteDelete = async () => {
    if (!pendingDelete) return;
    setActionLoading(true);
    try {
      let res: Response;
      if (pendingDelete.type === "user") {
        res = await fetch("/api/v1/db-inspector", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete-user", userId: pendingDelete.id }),
        });
      } else if (pendingDelete.type === "product") {
        res = await fetch("/api/v1/db-inspector", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "delete-product", productId: pendingDelete.id }),
        });
      } else if (pendingDelete.type === "row") {
        res = await fetch("/api/v1/db-inspector", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "delete-row",
            tableName: pendingDelete.tableName,
            primaryKey: pendingDelete.primaryKey,
          }),
        });
      } else if (pendingDelete.type === "table") {
        res = await fetch("/api/v1/db-inspector", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "clear-table",
            tableName: pendingDelete.tableName,
          }),
        });
      } else {
        throw new Error("Invalid deletion operation");
      }

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to execute deletion");
      showToast(result.message, "success");
      setPendingDelete(null);
      await fetchOverview();
      if (activeTab === "explorer" && explorerTable) {
        fetchTableRows(explorerTable, 0, parseInt(pageSize, 10));
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered tables for Tab 1
  const filteredTables = useMemo(() => {
    if (!data?.tables) return [];
    return data.tables.filter((t) => {
      const matchesCat =
        selectedCategory === "All Categories" || t.category === selectedCategory;
      const matchesSearch =
        tableSearch.trim() === "" ||
        t.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
        t.description.toLowerCase().includes(tableSearch.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [data?.tables, selectedCategory, tableSearch]);

  // Filtered products for Tab 2
  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];
    return data.products.filter((p) => {
      const q = itemSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
      );
    });
  }, [data?.products, itemSearch]);

  // Options for CommerceSelect in Explorer
  const tableSelectOptions: CommerceSelectOption[] = useMemo(() => {
    if (!data?.tables) return [];
    return data.tables.map((t) => ({
      value: t.name,
      label: `${t.name} (${t.rowCount} rows - ${t.size})`,
      group: t.category,
      description: t.description,
    }));
  }, [data?.tables]);

  const pageSizeOptions: CommerceSelectOption[] = [
    { value: "10", label: "10 rows per page" },
    { value: "25", label: "25 rows per page" },
    { value: "50", label: "50 rows per page" },
    { value: "100", label: "100 rows per page" },
  ];

  return (
    <div className="min-h-screen bg-[#090b10] text-neutral-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold flex items-center gap-2.5 transition animate-in fade-in slide-in-from-top-3 ${
            toastMessage.type === "success"
              ? "bg-emerald-950/90 border-emerald-700 text-emerald-200"
              : "bg-rose-950/90 border-rose-700 text-rose-200"
          }`}
        >
          {toastMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header - CommerceOS Official Branding & Standalone Admin Shell */}
      <header className="border-b border-neutral-800/80 bg-[#0d1017]/90 backdrop-blur-xl sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Official CommerceOS Branding */}
          <div className="flex items-center space-x-3.5">
            <div className="relative group cursor-pointer">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-600/30 ring-1 ring-white/25">
                <Command className="w-5 h-5 text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#0d1017]"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center space-x-2.5">
                <span className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                  Commerce<span className="text-indigo-400">OS</span>
                </span>
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 tracking-wide uppercase">
                  Master Data Registry
                </span>
                <button
                  onClick={() => setActiveTab("engine")}
                  className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer flex items-center gap-1.5"
                  title="Click to view PostgreSQL Engine & Version Details"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>PostgreSQL {data?.engineInfo?.serverVersion || "18.4"}</span>
                </button>
              </div>
              <p className="text-xs text-neutral-400 flex items-center gap-2 mt-0.5">
                <span>Enterprise Relational Inspector</span>
                <span className="text-neutral-600">•</span>
                <span className="font-mono text-neutral-300">
                  {data?.database.name || "commerceos_dev"}
                </span>
                <span className="text-neutral-600">•</span>
                <span className="text-neutral-400">Port 5432 (Localhost)</span>
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center space-x-3 self-end md:self-auto">
            <button
              onClick={fetchOverview}
              disabled={loading || actionLoading}
              className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-neutral-200 border border-neutral-700 transition disabled:opacity-50 cursor-pointer shadow-sm"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 text-indigo-400 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              <span>{loading ? "Inspecting..." : "Refresh Live Metrics"}</span>
            </button>

            <Link
              href="/purchase"
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-950/50 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-700/50 transition shadow-sm"
              title="Return to CommerceOS Operational Modules"
            >
              <span>Back to CommerceOS</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Database Connection or Query Error</p>
              <p className="text-xs text-rose-400 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Executive KPI Summary Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Tables */}
          <div className="p-4 rounded-2xl bg-[#0f131c]/70 border border-neutral-800/80 shadow-sm hover:border-neutral-700 transition relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition" />
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-medium uppercase tracking-wider">
                Total Tables
              </span>
              <TableIcon className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="mt-2.5 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-white">
                {data ? data.database.tableCount : "—"}
              </span>
              <span className="text-xs text-neutral-400">public schema</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Active PostgreSQL relational models
            </p>
          </div>

          {/* Card 2: Total Stored Rows */}
          <div className="p-4 rounded-2xl bg-[#0f131c]/70 border border-neutral-800/80 shadow-sm hover:border-neutral-700 transition relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition" />
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-medium uppercase tracking-wider">
                Stored Records
              </span>
              <HardDrive className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="mt-2.5 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-white">
                {data ? data.database.totalRowCount.toLocaleString() : "—"}
              </span>
              <span className="text-xs text-neutral-400">total rows</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Ghost test data permanently purged</span>
            </p>
          </div>

          {/* Card 3: Storage Footprint */}
          <div className="p-4 rounded-2xl bg-[#0f131c]/70 border border-neutral-800/80 shadow-sm hover:border-neutral-700 transition relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition" />
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-medium uppercase tracking-wider">
                Database Footprint
              </span>
              <Server className="w-4 h-4 text-amber-400" />
            </div>
            <div className="mt-2.5 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-white">
                {data ? data.database.totalSize : "—"}
              </span>
              <span className="text-xs text-neutral-400">on disk</span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Relations + Indexes + System Catalogs
            </p>
          </div>

          {/* Card 4: Entities & Ownership */}
          <div className="p-4 rounded-2xl bg-[#0f131c]/70 border border-neutral-800/80 shadow-sm hover:border-neutral-700 transition relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full pointer-events-none group-hover:scale-110 transition" />
            <div className="flex items-center justify-between text-neutral-400">
              <span className="text-xs font-medium uppercase tracking-wider">
                Entities & Catalog
              </span>
              <Users className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="mt-2.5 flex items-baseline space-x-2">
              <span className="text-2xl font-bold font-mono text-white">
                {data ? data.userOwnership.length : "—"}
              </span>
              <span className="text-xs text-neutral-400">
                users / {data ? data.products.length : "—"} items
              </span>
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              {data ? data.vendorMatrix.length : 0} registered vendors
            </p>
          </div>
        </section>

        {/* 5-Tab Navigation Bar */}
        <section className="border-b border-neutral-800 flex items-center space-x-2 overflow-x-auto pb-px">
          <button
            onClick={() => setActiveTab("tables")}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-t border-x transition cursor-pointer ${
              activeTab === "tables"
                ? "bg-[#0f131c] border-neutral-700 text-white border-b-transparent shadow-sm"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#0f131c]/50"
            }`}
          >
            <TableIcon className="w-4 h-4 text-indigo-400" />
            <span>Tables & Storage Matrix</span>
            <span className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
              {data ? data.tables.length : 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("items")}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-t border-x transition cursor-pointer ${
              activeTab === "items"
                ? "bg-[#0f131c] border-neutral-700 text-white border-b-transparent shadow-sm"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#0f131c]/50"
            }`}
          >
            <Package className="w-4 h-4 text-purple-400" />
            <span>Item & Catalog Registry</span>
            <span className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/40">
              {data ? data.products.length : 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-t border-x transition cursor-pointer ${
              activeTab === "users"
                ? "bg-[#0f131c] border-neutral-700 text-white border-b-transparent shadow-sm"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#0f131c]/50"
            }`}
          >
            <Users className="w-4 h-4 text-emerald-400" />
            <span>User Ownership & Creators</span>
            <span className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
              {data ? data.userOwnership.length : 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("vendors")}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-t border-x transition cursor-pointer ${
              activeTab === "vendors"
                ? "bg-[#0f131c] border-neutral-700 text-white border-b-transparent shadow-sm"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#0f131c]/50"
            }`}
          >
            <Truck className="w-4 h-4 text-amber-400" />
            <span>Vendor Relationship Matrix</span>
            <span className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
              {data ? data.vendorMatrix.length : 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("explorer")}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-t border-x transition cursor-pointer ${
              activeTab === "explorer"
                ? "bg-[#0f131c] border-neutral-700 text-white border-b-transparent shadow-sm"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#0f131c]/50"
            }`}
          >
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Live Data Explorer</span>
            <span className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800/50">
              Query
            </span>
          </button>

          <button
            onClick={() => setActiveTab("engine")}
            className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl border-t border-x transition cursor-pointer ${
              activeTab === "engine"
                ? "bg-[#0f131c] border-neutral-700 text-white border-b-transparent shadow-sm"
                : "border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-[#0f131c]/50"
            }`}
          >
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>PostgreSQL Engine & Upgrades</span>
            <span className="ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/40">
              v{data?.engineInfo?.serverVersion || "18.4"}
            </span>
          </button>
        </section>

        {/* ================================================================= */}
        {/* TAB 1: TABLES & STORAGE MATRIX */}
        {/* ================================================================= */}
        {activeTab === "tables" && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0f131c]/80 p-3 rounded-xl border border-neutral-800">
              <div className="flex flex-wrap items-center gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                        : "bg-neutral-800/60 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="relative min-w-[240px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search tables..."
                  value={tableSearch}
                  onChange={(e) => setTableSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            <div className="bg-[#0f131c]/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800 font-medium">
                    <tr>
                      <th className="py-3 px-4">PostgreSQL Table</th>
                      <th className="py-3 px-4">Domain Category</th>
                      <th className="py-3 px-4 text-right">Live Rows</th>
                      <th className="py-3 px-4 text-right">On-Disk Size</th>
                      <th className="py-3 px-4">Description & Architecture Role</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                    {filteredTables.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="py-12 text-center text-neutral-500"
                        >
                          No tables match your filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredTables.map((t) => {
                        const isZero = t.rowCount === 0;
                        return (
                          <tr
                            key={t.name}
                            className="hover:bg-neutral-800/30 transition group"
                          >
                            <td className="py-3 px-4 font-mono font-medium text-white flex items-center gap-2">
                              <Box className="w-3.5 h-3.5 text-neutral-500 group-hover:text-indigo-400 transition" />
                              <span>{t.name}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium border ${
                                  t.category === "Procurement & Purchase"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                    : t.category === "Catalog & Products"
                                    ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20"
                                    : t.category === "Inventory & Storage"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : t.category === "Orders & Customers"
                                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                    : t.category === "Tenants & RBAC"
                                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                                    : "bg-neutral-800 text-neutral-400 border-neutral-700"
                                }`}
                              >
                                {t.category}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono">
                              <span
                                className={`px-2 py-0.5 rounded-full font-semibold ${
                                  isZero
                                    ? "bg-neutral-800/80 text-neutral-500"
                                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                }`}
                              >
                                {t.rowCount.toLocaleString()}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-neutral-400">
                              {t.size}
                            </td>
                            <td className="py-3 px-4 text-neutral-400 max-w-xs truncate text-[11px]">
                              {t.description}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  onClick={() => {
                                    setExplorerTable(t.name);
                                    setActiveTab("explorer");
                                  }}
                                  className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-neutral-800 hover:bg-indigo-600 hover:text-white text-neutral-300 transition text-[11px] font-medium cursor-pointer"
                                >
                                  <span>Inspect</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                                {t.name !== "_prisma_migrations" && (
                                  <button
                                    onClick={() =>
                                      setPendingDelete({
                                        type: "table",
                                        tableName: t.name,
                                        title: `Wipe Entire Table: "${t.name}"`,
                                        details: `Are you sure you want to permanently delete ALL ${t.rowCount} records from table "${t.name}"? This operation cannot be undone.`,
                                      })
                                    }
                                    disabled={t.rowCount === 0 || actionLoading}
                                    className="p-1 rounded bg-rose-950/40 hover:bg-rose-900 text-rose-400 hover:text-rose-100 border border-rose-800/50 transition disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer"
                                    title={
                                      t.rowCount === 0
                                        ? "Table is already empty (0 rows)"
                                        : `Wipe all ${t.rowCount} records from "${t.name}"`
                                    }
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: ITEM & CATALOG REGISTRY (BLOCK / UNBLOCK / DELETE ITEMS) */}
        {/* ================================================================= */}
        {activeTab === "items" && (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-[#0f131c]/80 p-3 rounded-xl border border-neutral-800">
              <div className="flex items-center space-x-2 text-xs">
                <Package className="w-4 h-4 text-purple-400" />
                <span className="font-semibold text-neutral-200">
                  Item Catalog Management:
                </span>
                <span className="text-neutral-400">
                  Block items from sale or permanently delete items from PostgreSQL.
                </span>
              </div>

              <div className="relative min-w-[260px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Filter items by SKU, name, category..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="p-16 text-center bg-[#0f131c]/60 border border-neutral-800 rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mx-auto">
                  <Package className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  No Catalog Items Found in Database
                </h3>
                <p className="text-xs text-neutral-400 max-w-md mx-auto">
                  The Product table currently has 0 items. New items created in CommerceOS or imported via Purchase bills will appear here with instant Block & Delete controls.
                </p>
              </div>
            ) : (
              <div className="bg-[#0f131c]/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800 font-medium">
                      <tr>
                        <th className="py-3 px-4">SKU / Item Name</th>
                        <th className="py-3 px-4">Category & Intent</th>
                        <th className="py-3 px-4 text-right">Cost / Selling (₹)</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4">Workspace</th>
                        <th className="py-3 px-4 text-center">Manage / Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                      {filteredProducts.map((p) => {
                        const isBlocked = p.status === "Blocked";
                        return (
                          <tr
                            key={p.id}
                            className="hover:bg-neutral-800/30 transition group"
                          >
                            <td className="py-3 px-4">
                              <div className="font-mono font-bold text-white flex items-center gap-1.5">
                                <span>{p.sku}</span>
                              </div>
                              <div className="text-neutral-400 text-[11px] truncate max-w-xs">
                                {p.name}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-[11px]">
                              <span className="font-medium text-neutral-200">
                                {p.category}
                              </span>
                              <span className="block text-neutral-500 uppercase text-[10px]">
                                {p.intent} • {p.productType}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right font-mono text-[11px]">
                              <span className="text-neutral-400">
                                ₹{p.costPrice.toFixed(2)}
                              </span>{" "}
                              /{" "}
                              <span className="text-emerald-400 font-semibold">
                                ₹{p.sellingPrice.toFixed(2)}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  isBlocked
                                    ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                    : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                }`}
                              >
                                {isBlocked ? (
                                  <>
                                    <Ban className="w-3 h-3" />
                                    <span>Blocked</span>
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Active</span>
                                  </>
                                )}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono text-[11px] text-neutral-400">
                              {p.workspaceId}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center space-x-2">
                                <button
                                  onClick={() => handleToggleProductStatus(p.id)}
                                  disabled={actionLoading}
                                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center space-x-1 ${
                                    isBlocked
                                      ? "bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/60"
                                      : "bg-amber-950/60 hover:bg-amber-900 text-amber-200 border border-amber-800/60"
                                  }`}
                                  title={isBlocked ? "Unblock Item" : "Block Item"}
                                >
                                  {isBlocked ? (
                                    <>
                                      <Unlock className="w-3 h-3" />
                                      <span>Unblock</span>
                                    </>
                                  ) : (
                                    <>
                                      <Ban className="w-3 h-3" />
                                      <span>Block</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() =>
                                    setPendingDelete({
                                      type: "product",
                                      id: p.id,
                                      title: `Delete Item: ${p.sku}`,
                                      details: `Are you sure you want to permanently delete product "${p.name}" (${p.sku})? Linked inventory balances and master listings will also be removed.`,
                                    })
                                  }
                                  disabled={actionLoading}
                                  className="px-2.5 py-1 rounded text-[11px] font-medium bg-rose-950/50 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition cursor-pointer flex items-center space-x-1"
                                  title="Permanently Delete Item"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Delete</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: USER OWNERSHIP & CREATORS (BLOCK / UNBLOCK / DELETE USERS) */}
        {/* ================================================================= */}
        {activeTab === "users" && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-[#0f131c]/80 border border-neutral-800 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <p className="font-semibold text-neutral-200">
                    User Ownership & Identity Control
                  </p>
                  <p className="text-neutral-400 mt-0.5">
                    Inspect user attribution, purchase bill creators, and manage access by blocking accounts or deleting obsolete users.
                  </p>
                </div>
              </div>
            </div>

            {/* User Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.userOwnership.map((u) => {
                const isBlocked = u.status === "Inactive" || u.status === "Blocked";
                return (
                  <div
                    key={u.userId}
                    className={`p-5 rounded-2xl bg-[#0f131c]/70 border transition flex flex-col justify-between space-y-4 ${
                      isBlocked
                        ? "border-rose-900/60 bg-rose-950/10"
                        : "border-neutral-800/80 hover:border-neutral-700"
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border ${
                              isBlocked
                                ? "bg-rose-950/60 border-rose-800 text-rose-300"
                                : "bg-gradient-to-tr from-neutral-800 to-neutral-700 border-neutral-700 text-neutral-200"
                            }`}
                          >
                            {u.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isBlocked && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                  BLOCKED
                                </span>
                              )}
                            </h3>
                            <p className="text-xs text-neutral-400">{u.email}</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          {u.role}
                        </span>
                      </div>

                      {/* User Stats */}
                      <div className="mt-4 pt-3 border-t border-neutral-800/80 grid grid-cols-2 gap-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-850">
                          <span className="text-[11px] text-neutral-500 block">
                            Purchase Bills
                          </span>
                          <span className="text-sm font-bold font-mono text-white mt-0.5 block">
                            {u.billsCreatedCount}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            ₹{u.billsTotalAmount.toLocaleString()}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-neutral-950/60 border border-neutral-850">
                          <span className="text-[11px] text-neutral-500 block">
                            Audit Actions
                          </span>
                          <span className="text-sm font-bold font-mono text-white mt-0.5 block">
                            {u.auditActionsCount}
                          </span>
                          <span className="text-[10px] text-neutral-400">
                            {u.storageOpsCount} warehouse ops
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons: Block / Delete */}
                    <div className="pt-2 border-t border-neutral-800/60 flex items-center justify-between gap-2">
                      {u.isRegisteredUser ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleUserStatus(u.userId)}
                            disabled={actionLoading}
                            className={`px-2.5 py-1 rounded text-[11px] font-medium transition cursor-pointer flex items-center space-x-1 ${
                              isBlocked
                                ? "bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60"
                                : "bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-800/60"
                            }`}
                          >
                            {isBlocked ? (
                              <>
                                <Unlock className="w-3 h-3" />
                                <span>Unblock</span>
                              </>
                            ) : (
                              <>
                                <Ban className="w-3 h-3" />
                                <span>Block User</span>
                              </>
                            )}
                          </button>

                          <button
                            onClick={() =>
                              setPendingDelete({
                                type: "user",
                                id: u.userId,
                                title: `Delete User: ${u.name}`,
                                details: `Are you sure you want to permanently delete user "${u.name}" (${u.email})? Their organization and workspace memberships will be deleted.`,
                              })
                            }
                            disabled={actionLoading}
                            className="px-2.5 py-1 rounded text-[11px] font-medium bg-rose-950/50 hover:bg-rose-900 text-rose-300 border border-rose-800/60 transition cursor-pointer flex items-center space-x-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Delete</span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-neutral-500 italic">
                          System Actor (Non-deletable)
                        </span>
                      )}

                      <button
                        onClick={() => handleCopy(u.userId, u.userId)}
                        className="text-neutral-400 hover:text-white flex items-center gap-1 text-[11px] ml-auto"
                      >
                        {copiedKey === u.userId ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>UUID</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Workspaces list */}
            <div className="p-5 rounded-2xl bg-[#0f131c]/60 border border-neutral-800 space-y-3">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Multi-Tenant Workspaces Registered</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data?.workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    className="p-3 rounded-xl bg-neutral-950/50 border border-neutral-800 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-medium text-white">{ws.name}</p>
                      <p className="text-[11px] font-mono text-neutral-400">
                        Code: {ws.code} • Org: {ws.organization.name}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono bg-neutral-800 text-neutral-300 px-2 py-1 rounded">
                      {ws.id}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: VENDOR RELATIONSHIP MATRIX */}
        {/* ================================================================= */}
        {activeTab === "vendors" && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-[#0f131c]/80 border border-neutral-800 flex items-start gap-3">
              <Truck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-neutral-200">
                  Vendor Directory & Procurement Relationships
                </p>
                <p className="text-neutral-400 mt-0.5">
                  Shows all vendors registered in the PostgreSQL database, their GSTIN compliance, total bills supplied, and cumulative procurement spend.
                </p>
              </div>
            </div>

            {data?.vendorMatrix.length === 0 ? (
              <div className="p-12 text-center bg-[#0f131c]/60 border border-neutral-800 rounded-2xl space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto">
                  <Truck className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-semibold text-white">
                  No Vendors in Database
                </h3>
                <p className="text-xs text-neutral-400 max-w-md mx-auto">
                  All test/ghost vendors have been cleaned. Any real vendor added through CommerceOS Purchase Bills or Vendor Onboarding will be mapped here in real-time.
                </p>
              </div>
            ) : (
              <div className="bg-[#0f131c]/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800 font-medium">
                      <tr>
                        <th className="py-3 px-4">Vendor Name</th>
                        <th className="py-3 px-4">GSTIN & Reg Type</th>
                        <th className="py-3 px-4">Contact & Location</th>
                        <th className="py-3 px-4 text-right">Bills Supplied</th>
                        <th className="py-3 px-4 text-right">Total Spend (₹)</th>
                        <th className="py-3 px-4 text-right">Units Supplied</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/60 text-neutral-300">
                      {data?.vendorMatrix.map((v) => (
                        <tr
                          key={v.id}
                          className="hover:bg-neutral-800/30 transition group"
                        >
                          <td className="py-3 px-4 font-semibold text-white">
                            {v.name}
                          </td>
                          <td className="py-3 px-4 font-mono text-[11px] text-neutral-300">
                            <div>{v.gstin}</div>
                            <span className="text-[10px] text-neutral-500 font-sans uppercase">
                              {v.registrationType}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-neutral-400 text-[11px]">
                            <div>{v.location}</div>
                            <div className="text-neutral-500">{v.phone}</div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-white">
                            {v.billsCount}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-semibold text-emerald-400">
                            ₹{v.totalSpend.toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-neutral-300">
                            {v.totalProductsSupplied}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                                v.status === "active"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-neutral-800 text-neutral-400"
                              }`}
                            >
                              {v.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setSelectedVendor(v)}
                              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition text-[11px] font-medium cursor-pointer"
                            >
                              View Bills
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Vendor Bills Detail Modal */}
            {selectedVendor && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-[#0f131c] border border-neutral-700 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        {selectedVendor.name}
                      </h3>
                      <p className="text-xs text-neutral-400">
                        GSTIN: {selectedVendor.gstin} • Total Spend: ₹
                        {selectedVendor.totalSpend.toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedVendor(null)}
                      className="text-neutral-400 hover:text-white text-xs px-2.5 py-1 rounded bg-neutral-800 cursor-pointer"
                    >
                      Close
                    </button>
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2 text-xs">
                    {selectedVendor.recentBills.length === 0 ? (
                      <p className="text-neutral-500 text-center py-6">
                        No purchase bills recorded for this vendor yet.
                      </p>
                    ) : (
                      selectedVendor.recentBills.map((b) => (
                        <div
                          key={b.id}
                          className="p-3 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-mono font-semibold text-white">
                              {b.billNumber}
                            </span>
                            <span className="text-[11px] text-neutral-400 ml-2">
                              Date: {b.billDate}
                            </span>
                            <p className="text-[11px] text-neutral-500">
                              Created By: {b.createdBy} • Items: {b.itemsCount}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-emerald-400">
                              ₹{b.totalAmount.toLocaleString()}
                            </span>
                            <span className="block text-[10px] uppercase text-neutral-400">
                              {b.paymentStatus}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 5: LIVE DATA EXPLORER & QUERY INSPECTOR */}
        {/* ================================================================= */}
        {activeTab === "explorer" && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-[#0f131c]/80 border border-neutral-800 flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="flex-1 max-w-md">
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Select PostgreSQL Table to Inspect:
                </label>
                <CommerceSelect
                  value={explorerTable}
                  onChange={(val) => {
                    setExplorerTable(val as string);
                    setExplorerPage(0);
                  }}
                  options={tableSelectOptions}
                  placeholder="Select table..."
                  searchable={true}
                  className="w-full text-xs"
                  triggerClassName="bg-[#0f131c] border-neutral-800 text-neutral-100 hover:border-neutral-700"
                  panelClassName="bg-[#0f131c] border-neutral-700 text-neutral-100 shadow-2xl"
                />
              </div>

              <div className="flex items-center space-x-3 self-end">
                <div className="w-44">
                  <label className="block text-[11px] text-neutral-400 mb-1">
                    Rows Per Page:
                  </label>
                  <CommerceSelect
                    value={pageSize}
                    onChange={(val) => {
                      setPageSize(val as string);
                      setExplorerPage(0);
                    }}
                    options={pageSizeOptions}
                    searchable={false}
                    className="w-full text-xs"
                    triggerClassName="bg-[#0f131c] border-neutral-800 text-neutral-100 hover:border-neutral-700"
                    panelClassName="bg-[#0f131c] border-neutral-700 text-neutral-100 shadow-2xl"
                  />
                </div>

                <button
                  onClick={() =>
                    fetchTableRows(explorerTable, explorerPage, parseInt(pageSize, 10))
                  }
                  disabled={explorerLoading}
                  className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 shadow-sm"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${
                      explorerLoading ? "animate-spin" : ""
                    }`}
                  />
                  <span>Query</span>
                </button>

                {explorerTable !== "_prisma_migrations" && (
                  <button
                    onClick={() =>
                      setPendingDelete({
                        type: "table",
                        tableName: explorerTable,
                        title: `Wipe Entire Table: "${explorerTable}"`,
                        details: `Are you sure you want to permanently delete ALL ${
                          explorerData?.total ?? 0
                        } records from table "${explorerTable}"? This action cannot be undone.`,
                      })
                    }
                    disabled={
                      explorerLoading ||
                      !explorerData ||
                      explorerData.total === 0 ||
                      actionLoading
                    }
                    className="px-3.5 py-2 rounded-lg bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 shadow-sm shadow-rose-600/20 disabled:opacity-40 disabled:cursor-not-allowed"
                    title={
                      explorerData?.total === 0
                        ? "Table is already empty (0 rows)"
                        : `Clear all records in ${explorerTable}`
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Table ({explorerData ? explorerData.total : 0})</span>
                  </button>
                )}
              </div>
            </div>

            {explorerLoading ? (
              <div className="py-20 text-center space-y-3 bg-[#0f131c]/60 rounded-2xl border border-neutral-800">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
                <p className="text-xs text-neutral-400">
                  Executing SELECT query on table &quot;{explorerTable}&quot;...
                </p>
              </div>
            ) : explorerData ? (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-[#0f131c]/60 border border-neutral-800">
                  <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                    <span className="font-semibold text-neutral-300">
                      Table Schema: &quot;{explorerData.table}&quot; ({explorerData.columns.length} columns)
                    </span>
                    <span className="font-mono text-[11px]">
                      Total Records: {explorerData.total}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {explorerData.columns.map((c) => (
                      <span
                        key={c.column_name}
                        className="px-2 py-0.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-neutral-300 flex items-center gap-1"
                      >
                        <span className="text-indigo-400 font-semibold">
                          {c.column_name}
                        </span>
                        <span className="text-neutral-500">: {c.data_type}</span>
                        {c.is_nullable === "NO" && (
                          <span className="text-amber-500">*</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0f131c]/60 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                  {explorerData.rows.length === 0 ? (
                    <div className="py-16 text-center space-y-2">
                      <p className="text-sm font-semibold text-neutral-300">
                        Table &quot;{explorerData.table}&quot; is Empty (0 Rows)
                      </p>
                      <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                        This table currently contains 0 records in the PostgreSQL database.
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-neutral-900/90 text-neutral-400 border-b border-neutral-800 font-medium">
                          <tr>
                            {/* Action column on all tables except system migrations */}
                            {explorerData.table !== "_prisma_migrations" && (
                              <th className="py-2.5 px-3 font-semibold text-neutral-300 text-center whitespace-nowrap">
                                Control
                              </th>
                            )}
                            {explorerData.columns.map((col) => (
                              <th
                                key={col.column_name}
                                className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px] text-neutral-300"
                              >
                                {col.column_name}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/60 font-mono text-[11px] text-neutral-300">
                          {explorerData.rows.map((row, idx) => (
                            <tr
                              key={idx}
                              className="hover:bg-neutral-800/30 transition"
                            >
                              {explorerData.table !== "_prisma_migrations" && (
                                <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-center space-x-1.5">
                                    {/* Product-specific Block / Unblock */}
                                    {explorerData.table === "Product" && (
                                      <button
                                        onClick={() => handleToggleProductStatus(row.id)}
                                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                                          row.status === "Blocked"
                                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                            : "bg-amber-950 text-amber-300 border border-amber-800"
                                        }`}
                                        title={row.status === "Blocked" ? "Unblock Item" : "Block Item"}
                                      >
                                        {row.status === "Blocked" ? "Unblock" : "Block"}
                                      </button>
                                    )}

                                    {/* User-specific Block / Unblock */}
                                    {explorerData.table === "User" && (
                                      <button
                                        onClick={() => handleToggleUserStatus(row.id)}
                                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                                          !row.active
                                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                                            : "bg-amber-950 text-amber-300 border border-amber-800"
                                        }`}
                                        title={!row.active ? "Unblock User" : "Block User"}
                                      >
                                        {!row.active ? "Unblock" : "Block"}
                                      </button>
                                    )}

                                    {/* Universal Delete Row for ANY table */}
                                    <button
                                      onClick={() => {
                                        const pkCol =
                                          explorerData.columns.find(
                                            (c) => c.column_name === "id"
                                          )?.column_name ||
                                          explorerData.columns[0]?.column_name ||
                                          "id";
                                        const rowKeyVal = row[pkCol];
                                        setPendingDelete({
                                          type: "row",
                                          tableName: explorerData.table,
                                          primaryKey: { [pkCol]: rowKeyVal },
                                          title: `Delete Record from "${explorerData.table}"`,
                                          details: `Are you sure you want to delete record where ${pkCol} = "${rowKeyVal}" from table "${explorerData.table}"?`,
                                        });
                                      }}
                                      className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/60 hover:border-rose-700 transition cursor-pointer"
                                      title="Delete this row from database"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              )}

                              {explorerData.columns.map((col) => {
                                const val = row[col.column_name];
                                const isNull = val === null || val === undefined;
                                const isObj = typeof val === "object" && !isNull;

                                return (
                                  <td
                                    key={col.column_name}
                                    className="py-2.5 px-3 max-w-xs truncate"
                                    title={
                                      isObj
                                        ? JSON.stringify(val, null, 2)
                                        : String(val)
                                    }
                                  >
                                    {isNull ? (
                                      <span className="text-neutral-600 italic">
                                        NULL
                                      </span>
                                    ) : isObj ? (
                                      <span className="text-indigo-400 bg-indigo-950/40 px-1.5 py-0.5 rounded text-[10px]">
                                        JSON ({Array.isArray(val) ? "array" : "obj"})
                                      </span>
                                    ) : (
                                      <span>{String(val)}</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Pagination Bar */}
                  {explorerData.total > 0 && (
                    <div className="p-3 bg-neutral-900/80 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                      <span>
                        Showing{" "}
                        <strong className="text-white">
                          {explorerData.offset + 1}
                        </strong>{" "}
                        to{" "}
                        <strong className="text-white">
                          {Math.min(
                            explorerData.offset + explorerData.rows.length,
                            explorerData.total
                          )}
                        </strong>{" "}
                        of{" "}
                        <strong className="text-white">
                          {explorerData.total}
                        </strong>{" "}
                        rows
                      </span>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() =>
                            fetchTableRows(
                              explorerTable,
                              explorerPage - 1,
                              parseInt(pageSize, 10)
                            )
                          }
                          disabled={explorerPage === 0}
                          className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition cursor-pointer"
                        >
                          Previous
                        </button>
                        <span className="font-mono text-xs">
                          Page {explorerPage + 1} of{" "}
                          {Math.ceil(explorerData.total / parseInt(pageSize, 10)) || 1}
                        </span>
                        <button
                          onClick={() =>
                            fetchTableRows(
                              explorerTable,
                              explorerPage + 1,
                              parseInt(pageSize, 10)
                            )
                          }
                          disabled={
                            (explorerPage + 1) * parseInt(pageSize, 10) >=
                            explorerData.total
                          }
                          className="px-3 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition cursor-pointer"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 6: POSTGRESQL ENGINE & UPGRADE ADVISORY */}
        {/* ================================================================= */}
        {activeTab === "engine" && (
          <div className="space-y-6">
            {/* Top Engine Architecture & Health Card */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-[#0f131c] via-[#121722] to-[#0f131c] border border-neutral-800 relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-600/40 flex items-center justify-center text-emerald-400 shrink-0 shadow-inner">
                    <Cpu className="w-7 h-7" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-xl font-bold text-white tracking-tight">
                        PostgreSQL Database Engine
                      </h2>
                      <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        Online & Ready (v{data?.engineInfo?.serverVersion || "18.4"})
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {data?.engineInfo?.releaseSupport || "Active Generation — Supported through 2029"}
                      </span>
                    </div>

                    <p className="text-xs font-mono text-neutral-400 mt-1.5 break-all">
                      {data?.engineInfo?.fullVersion || "PostgreSQL 18.4 on x86_64-windows, compiled by msvc-19.44.35227, 64-bit"}
                    </p>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-neutral-400">
                      <span className="flex items-center gap-1.5">
                        <FolderArchive className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="text-neutral-500">Path:</span>
                        <code className="text-neutral-200 bg-neutral-900 px-1.5 py-0.5 rounded text-[11px]">
                          {data?.engineInfo?.installPath || "C:\\Program Files\\PostgreSQL\\18"}
                        </code>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="text-neutral-500">Process Uptime:</span>
                        <span className="text-emerald-400 font-semibold font-mono">
                          {data?.engineInfo?.uptimeFormatted || "Active"}
                        </span>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="text-neutral-500">Database:</span>
                        <span className="text-white font-mono font-medium">
                          {data?.database.name || "commerceos_dev"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Button: Instant Backup */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto shrink-0">
                  <button
                    onClick={handleCreateBackup}
                    disabled={creatingBackup}
                    className="inline-flex items-center justify-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition cursor-pointer shadow-lg shadow-emerald-950/50 disabled:opacity-50"
                    title="Generate an instant SQL dump snapshot of database before any upgrade"
                  >
                    {creatingBackup ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{creatingBackup ? "Generating Snapshot..." : "Create Safety Backup (.sql)"}</span>
                  </button>
                </div>
              </div>

              {/* Subtabs within Engine View */}
              <div className="flex items-center space-x-2 border-t border-neutral-800/80 pt-4 mt-6 overflow-x-auto">
                <button
                  onClick={() => setActiveEngineSubtab("overview")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    activeEngineSubtab === "overview"
                      ? "bg-neutral-800 text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                  }`}
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Server Telemetry & Resources</span>
                </button>

                <button
                  onClick={() => setActiveEngineSubtab("guide")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    activeEngineSubtab === "guide"
                      ? "bg-neutral-800 text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                  <span>How to Update PostgreSQL (Guide)</span>
                </button>

                <button
                  onClick={() => setActiveEngineSubtab("backups")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    activeEngineSubtab === "backups"
                      ? "bg-neutral-800 text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                  }`}
                >
                  <FolderArchive className="w-3.5 h-3.5 text-amber-400" />
                  <span>Backup Snapshots</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-neutral-900 text-amber-300">
                    {data?.engineInfo?.backupsList?.length || 0}
                  </span>
                </button>

                <button
                  onClick={() => setActiveEngineSubtab("migrations")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    activeEngineSubtab === "migrations"
                      ? "bg-neutral-800 text-white shadow-sm"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-purple-400" />
                  <span>Prisma Migrations Log</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-neutral-900 text-purple-300">
                    {data?.engineInfo?.migrations?.length || 0}
                  </span>
                </button>
              </div>
            </div>

            {/* SUBTAB 1: SERVER TELEMETRY & RESOURCES */}
            {activeEngineSubtab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Metric Card 1: Connections */}
                  <div className="p-5 rounded-2xl bg-[#0f131c] border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Connection Pool
                      </span>
                      <Activity className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-white">
                        {data?.engineInfo?.activeConnections ?? 1}
                      </span>
                      <span className="text-xs text-neutral-400">
                        active / {data?.engineInfo?.maxConnections ?? 100} max configured
                      </span>
                    </div>
                    <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(
                            4,
                            Math.min(
                              100,
                              ((data?.engineInfo?.activeConnections || 1) /
                                (data?.engineInfo?.maxConnections || 100)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Safe connection headroom available for concurrent CommerceOS workloads
                    </p>
                  </div>

                  {/* Metric Card 2: Memory Buffers */}
                  <div className="p-5 rounded-2xl bg-[#0f131c] border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Engine Memory Allocations
                      </span>
                      <HardDrive className="w-4 h-4 text-indigo-400" />
                    </div>
                    <div className="flex items-baseline gap-3">
                      <div>
                        <span className="text-xs text-neutral-500 block">Shared Buffers</span>
                        <span className="text-xl font-bold font-mono text-white">
                          {data?.engineInfo?.sharedBuffers || "128MB"}
                        </span>
                      </div>
                      <div className="border-l border-neutral-800 pl-3">
                        <span className="text-xs text-neutral-500 block">Work Mem</span>
                        <span className="text-xl font-bold font-mono text-white">
                          {data?.engineInfo?.workMem || "4MB"}
                        </span>
                      </div>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      In-memory query execution cache configured in postgresql.conf
                    </p>
                  </div>

                  {/* Metric Card 3: Encoding & Collation */}
                  <div className="p-5 rounded-2xl bg-[#0f131c] border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Character Encoding
                      </span>
                      <FileCode2 className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-white">
                        {data?.engineInfo?.serverEncoding || "UTF8"}
                      </span>
                      <span className="text-xs text-neutral-400">
                        (Client: {data?.engineInfo?.clientEncoding || "UTF8"})
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Full multi-lingual Unicode character support across all CommerceOS catalogs
                    </p>
                  </div>

                  {/* Metric Card 4: Database Storage Footprint */}
                  <div className="p-5 rounded-2xl bg-[#0f131c] border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Total Database Size
                      </span>
                      <Database className="w-4 h-4 text-purple-400" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-white">
                        {data?.database.totalSize || "12 MB"}
                      </span>
                      <span className="text-xs text-neutral-400">
                        across {data?.database.tableCount || 0} relational tables
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Includes table data heap, B-Tree indexes, and Toast table storage
                    </p>
                  </div>

                  {/* Metric Card 5: Installed Extensions */}
                  <div className="p-5 rounded-2xl bg-[#0f131c] border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        PostgreSQL Extensions
                      </span>
                      <Package className="w-4 h-4 text-amber-400" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-white">
                        {data?.engineInfo?.installedExtensions?.length || 1} Active
                      </span>
                      <span className="text-xs text-neutral-400">
                        ({data?.engineInfo?.availableExtensionsCount || 62} system extensions available)
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {data?.engineInfo?.installedExtensions?.map((e) => (
                        <span
                          key={e.extname}
                          className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px] font-mono"
                        >
                          {e.extname} (v{e.extversion})
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Metric Card 6: Uptime & Postmaster */}
                  <div className="p-5 rounded-2xl bg-[#0f131c] border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between text-neutral-400">
                      <span className="text-xs font-semibold uppercase tracking-wider">
                        Postmaster Service
                      </span>
                      <Clock className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-emerald-400">
                        {data?.engineInfo?.uptimeFormatted || "Running"}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Started:{" "}
                      {data?.engineInfo?.startTime
                        ? new Date(data.engineInfo.startTime).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Active"}
                    </p>
                  </div>
                </div>

                {/* Advisory Callout Card */}
                <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-800/40 text-indigo-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        PostgreSQL 18 is currently up-to-date and in healthy standing
                      </h4>
                      <p className="text-xs text-indigo-300 mt-1 max-w-3xl leading-relaxed">
                        Your system is running PostgreSQL 18.4, which is the latest major release family of PostgreSQL with active official security and maintenance support until late 2029. Before attempting engine or schema modifications, review the step-by-step upgrade guide or create a backup snapshot.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveEngineSubtab("guide")}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer shrink-0 shadow-sm"
                  >
                    View Upgrade Guide
                  </button>
                </div>
              </div>
            )}

            {/* SUBTAB 2: HOW TO UPDATE POSTGRESQL (STEP-BY-STEP ADVISORY GUIDE) */}
            {activeEngineSubtab === "guide" && (
              <div className="space-y-6">
                {/* FAQ / Direct Answer */}
                <div className="p-6 rounded-2xl bg-[#0f131c] border border-neutral-800 space-y-4">
                  <div className="flex items-center gap-2.5 text-white">
                    <HelpCircle className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-base font-bold">
                      Can PostgreSQL be updated directly from inside the browser?
                    </h3>
                  </div>

                  <div className="text-xs text-neutral-300 space-y-2.5 leading-relaxed">
                    <p>
                      <strong>Short Answer:</strong> <span className="text-amber-300">No</span> — the web browser and Next.js connect to PostgreSQL as network clients over TCP port 5432. The PostgreSQL engine itself runs at the Windows Operating System level as a protected system service (<code className="text-indigo-300 bg-neutral-900 px-1 py-0.5 rounded">postgres.exe</code>).
                    </p>
                    <p>
                      A web application cannot directly rewrite or overwrite running Windows OS service binaries because:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-neutral-400">
                      <li>Database storage files are locked by the Windows OS kernel while the service is active.</li>
                      <li>Overwriting binaries during active connections risks data corruption.</li>
                      <li>Updating requires Windows Administrator privileges to safely stop the service, replace binaries, and restart.</li>
                    </ul>
                    <p className="text-emerald-400">
                      However, CommerceOS provides all pre-flight safety tools: 1-click database snapshots, verified commands, and the exact step-by-step instructions below.
                    </p>
                  </div>
                </div>

                {/* 4-Step Upgrade Workflow */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span>Official Step-by-Step Update Procedure (Windows)</span>
                  </h3>

                  {/* Step 1: Pre-Upgrade Safety Backup */}
                  <div className="p-5 rounded-2xl bg-[#0f131c] border border-neutral-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-[10px] text-emerald-300">
                          1
                        </span>
                        Step 1: Take Mandatory Pre-Upgrade Backup Snapshot
                      </span>
                      <button
                        onClick={handleCreateBackup}
                        disabled={creatingBackup}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition cursor-pointer"
                      >
                        {creatingBackup ? "Creating..." : "Create Snapshot Now"}
                      </button>
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      Always create a full SQL snapshot before updating the engine. You can click the button above to create a snapshot into the local <code className="text-neutral-200">./backups</code> directory, or run this PowerShell command:
                    </p>
                    <div className="relative group">
                      <pre className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
{`& "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe" -U postgres -h localhost -p 5432 -d commerceos_dev -f "$HOME\\Desktop\\commerceos_pre_upgrade.sql"`}
                      </pre>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `& "C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe" -U postgres -h localhost -p 5432 -d commerceos_dev -f "$HOME\\Desktop\\commerceos_pre_upgrade.sql"`,
                            "Backup Command"
                          )
                        }
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition cursor-pointer opacity-80 group-hover:opacity-100 flex items-center gap-1"
                      >
                        {copiedCommand === "Backup Command" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedCommand === "Backup Command" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Step 2: Determine Upgrade Type */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Minor Updates */}
                    <div className="p-5 rounded-2xl bg-[#0f131c] border border-neutral-800 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-700 flex items-center justify-center text-[10px] text-indigo-300 font-bold">
                          2A
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          Minor Updates (e.g. 18.4 to 18.5)
                        </h4>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Minor versions are 100% binary-compatible. The data directory format does not change.
                      </p>
                      <ol className="list-decimal pl-5 text-xs text-neutral-300 space-y-1">
                        <li>Download the latest PostgreSQL 18 installer from EnterpriseDB.</li>
                        <li>Run installer — it detects <code className="text-indigo-300">C:\Program Files\PostgreSQL\18</code> and updates in-place.</li>
                        <li>No data export or migration needed.</li>
                      </ol>
                    </div>

                    {/* Major Upgrades */}
                    <div className="p-5 rounded-2xl bg-[#0f131c] border border-neutral-800 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-purple-950 border border-purple-700 flex items-center justify-center text-[10px] text-purple-300 font-bold">
                          2B
                        </span>
                        <h4 className="text-sm font-bold text-white">
                          Major Upgrades (e.g. PG 18 to PG 19)
                        </h4>
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Major versions change internal storage catalog layouts.
                      </p>
                      <ol className="list-decimal pl-5 text-xs text-neutral-300 space-y-1">
                        <li>Install the new major PostgreSQL version on an adjacent port.</li>
                        <li>Restore the backup snapshot with <code className="text-purple-300">psql</code> or run <code className="text-purple-300">pg_upgrade.exe</code>.</li>
                        <li>Update <code className="text-purple-300">.env</code> port if required.</li>
                      </ol>
                    </div>
                  </div>

                  {/* Step 3: Managing Windows Services */}
                  <div className="p-5 rounded-2xl bg-[#0f131c] border border-neutral-800 space-y-3">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-700 flex items-center justify-center text-[10px] text-indigo-300">
                        3
                      </span>
                      Step 3: Managing Windows PostgreSQL Service
                    </span>
                    <p className="text-xs text-neutral-400">
                      Useful administrative commands to inspect or restart the PostgreSQL Windows service via PowerShell (Run as Administrator):
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="relative group">
                        <div className="text-[11px] text-neutral-400 mb-1 font-semibold">Check Service Status:</div>
                        <pre className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
Get-Service -Name "postgresql*"
                        </pre>
                      </div>
                      <div className="relative group">
                        <div className="text-[11px] text-neutral-400 mb-1 font-semibold">Restart Service:</div>
                        <pre className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-cyan-300 overflow-x-auto">
Restart-Service -Name "postgresql-x64-18"
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Application Schema Updates (Prisma) */}
                  <div className="p-5 rounded-2xl bg-[#0f131c] border border-neutral-800 space-y-3">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wide flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-full bg-purple-950 border border-purple-700 flex items-center justify-center text-[10px] text-purple-300">
                        4
                      </span>
                      Step 4: CommerceOS Schema Updates (Prisma)
                    </span>
                    <p className="text-xs text-neutral-400 leading-relaxed">
                      When CommerceOS code is updated with new features, tables, or columns, update the application database schema with:
                    </p>
                    <div className="relative group">
                      <pre className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] font-mono text-purple-300 overflow-x-auto">
{`npx prisma migrate deploy\nnpx prisma generate`}
                      </pre>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            `npx prisma migrate deploy\nnpx prisma generate`,
                            "Prisma Deploy Command"
                          )
                        }
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs transition cursor-pointer opacity-80 group-hover:opacity-100 flex items-center gap-1"
                      >
                        {copiedCommand === "Prisma Deploy Command" ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedCommand === "Prisma Deploy Command" ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 3: BACKUP SNAPSHOTS & RECOVERY */}
            {activeEngineSubtab === "backups" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0f131c] border border-neutral-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FolderArchive className="w-5 h-5 text-amber-400" />
                      <span>Local PostgreSQL Backup Snapshots</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Snapshots generated directly from PostgreSQL via pg_dump and saved to <code className="text-neutral-200">./backups</code>
                    </p>
                  </div>

                  <button
                    onClick={handleCreateBackup}
                    disabled={creatingBackup}
                    className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white transition cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {creatingBackup ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{creatingBackup ? "Creating..." : "Create Backup (.sql)"}</span>
                  </button>
                </div>

                {backupSuccess && (
                  <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/60 text-emerald-300 text-xs flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{backupSuccess}</span>
                  </div>
                )}

                {/* Backups Table */}
                <div className="bg-[#0f131c] border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                  {data?.engineInfo?.backupsList && data.engineInfo.backupsList.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-neutral-800 bg-neutral-900/60 text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                            <th className="py-3 px-4">Backup File</th>
                            <th className="py-3 px-4">Size</th>
                            <th className="py-3 px-4">Created Timestamp</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/60 font-mono">
                          {data.engineInfo.backupsList.map((b) => (
                            <tr key={b.filename} className="hover:bg-neutral-800/30 transition">
                              <td className="py-3 px-4 font-semibold text-white flex items-center gap-2">
                                <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                                <span>{b.filename}</span>
                              </td>
                              <td className="py-3 px-4 text-neutral-300">{b.sizeFormatted}</td>
                              <td className="py-3 px-4 text-neutral-400 font-sans">
                                {new Date(b.createdAt).toLocaleString("en-US", {
                                  dateStyle: "medium",
                                  timeStyle: "medium",
                                })}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="inline-flex items-center space-x-2">
                                  <button
                                    onClick={() =>
                                      copyToClipboard(
                                        `psql -U postgres -h localhost -p 5432 -d commerceos_dev -f "backups/${b.filename}"`,
                                        `Restore Command for ${b.filename}`
                                      )
                                    }
                                    className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-sans transition cursor-pointer flex items-center gap-1"
                                    title="Copy PowerShell restore command"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>Copy Restore Command</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteBackup(b.filename)}
                                    disabled={actionLoading}
                                    className="p-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/50 transition cursor-pointer"
                                    title="Delete backup snapshot"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-12 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-neutral-800/50 border border-neutral-700 flex items-center justify-center text-neutral-400 mx-auto">
                        <FolderArchive className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-white">No Local Backups Found</h4>
                      <p className="text-xs text-neutral-400 max-w-md mx-auto">
                        No pre-upgrade SQL snapshots have been created yet. Click the "Create Backup (.sql)" button above to generate your first full database backup snapshot.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUBTAB 4: PRISMA SCHEMA MIGRATIONS LOG */}
            {activeEngineSubtab === "migrations" && (
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-[#0f131c] border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Layers className="w-5 h-5 text-purple-400" />
                      <span>Prisma Schema Migrations History</span>
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Record of all applied database schema versions recorded in <code className="text-neutral-200">_prisma_migrations</code>
                    </p>
                  </div>

                  <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>All Migrations Applied & Healthy</span>
                  </div>
                </div>

                <div className="bg-[#0f131c] border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
                  {data?.engineInfo?.migrations && data.engineInfo.migrations.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-neutral-800 bg-neutral-900/60 text-neutral-400 font-semibold uppercase tracking-wider text-[11px]">
                            <th className="py-3 px-4">Migration Name</th>
                            <th className="py-3 px-4">Applied At</th>
                            <th className="py-3 px-4">Steps</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800/60 font-mono">
                          {data.engineInfo.migrations.map((m) => (
                            <tr key={m.id} className="hover:bg-neutral-800/30 transition">
                              <td className="py-3 px-4 font-semibold text-white">
                                {m.migrationName}
                              </td>
                              <td className="py-3 px-4 text-neutral-400 font-sans">
                                {new Date(m.finishedAt).toLocaleString("en-US", {
                                  dateStyle: "medium",
                                  timeStyle: "medium",
                                })}
                              </td>
                              <td className="py-3 px-4 text-neutral-300">
                                {m.appliedStepsCount} step(s)
                              </td>
                              <td className="py-3 px-4 font-sans">
                                <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Applied
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-xs text-neutral-400">
                      No Prisma migrations logged yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirmation Modal for Permanent Delete */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0f131c] border border-rose-900/70 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  {pendingDelete.title}
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {pendingDelete.details}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/40 text-[11px] text-rose-300">
              <span className="font-bold uppercase block text-rose-400 mb-0.5">
                Warning: Irreversible Action
              </span>
              {pendingDelete.type === "table"
                ? `ALL records from table "${pendingDelete.tableName}" will be permanently wiped (0 rows remaining).`
                : "This record will be permanently deleted from the PostgreSQL database table."}
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setPendingDelete(null)}
                disabled={actionLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-300 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteDelete}
                disabled={actionLoading}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition cursor-pointer flex items-center space-x-1.5 shadow-sm shadow-rose-600/30"
              >
                {actionLoading ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>
                  {pendingDelete.type === "table"
                    ? "Confirm & Wipe Table"
                    : "Confirm Permanent Delete"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
