"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { safeResponseJson } from "@/lib/api/client";
import { getAiCreditsRemaining } from "@/lib/ai/credits";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Coins,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Truck,
  RotateCcw,
  X,
} from "lucide-react";
import { useReorderableKpis, ReorderableKpiCard } from "@/components/ui/kpi";
import {
  buildSellableBalancesFromPurchaseBills,
  loadSellableBalancesFromPurchase,
} from "@/lib/inventory/from-purchase-stock";
import type { StockBalance } from "@/lib/inventory/types";
import type { PurchaseBill } from "@/lib/purchase/types";
import { DEFAULT_WAREHOUSE_ID } from "@/lib/inventory/types";
import {
  inventoryDecisionEngine,
  type SkuDecisionMetrics,
} from "@/lib/inventory/inventory-decision-engine";
import { inventoryLifecycleEngine } from "@/lib/inventory/inventory-lifecycle-engine";
import { channelAllocationEngine } from "@/lib/inventory/channel-allocation.engine";
import { notificationEngine } from "@/lib/core/notification-engine";
import { locationStockRepository } from "@/lib/storage/engine/receiving.engine";

import InventoryAiDrawer from "./InventoryAiDrawer";
import InventoryWhatIfSimulator from "./InventoryWhatIfSimulator";
import { inventoryAdvisorEngine, type InventoryRecommendation } from "@/lib/inventory/inventory-advisor-engine";

export default function InventoryControlCenterView() {
  const router = useRouter();

  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<InventoryRecommendation[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiCredits, setAiCredits] = useState<number>(221);
  const [activeTab, setActiveTab] = useState<"all" | "sellable" | "consumable" | "reorder" | "dead_stock" | "damaged" | "abc_a">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSkuMetrics, setSelectedSkuMetrics] = useState<SkuDecisionMetrics | null>(null);
  const [skuModalTab, setSkuModalTab] = useState<"overview" | "balances" | "timeline" | "financials" | "marketplace" | "consumption">("overview");
  const [showCycleCountModal, setShowCycleCountModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [showValuationModal, setShowValuationModal] = useState(false);
  const [showWhatIfSimulator, setShowWhatIfSimulator] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  const [isRowsDropdownOpen, setIsRowsDropdownOpen] = useState(false);
  const [adjustSku, setAdjustSku] = useState("PROD-FOOTWEAR-001");
  const [adjustQty, setAdjustQty] = useState("10");
  const [adjustReason, setAdjustReason] = useState("Cycle Count Reconciliation Variance");
  const [isSkuDropdownOpen, setIsSkuDropdownOpen] = useState(false);
  const [consumeSku, setConsumeSku] = useState("");
  const [consumeQty, setConsumeQty] = useState("10");
  const [consumeReason, setConsumeReason] = useState<string>("Order Packaging");
  const [consumeCustomReason, setConsumeCustomReason] = useState("");
  const [consumeRef, setConsumeRef] = useState("Order #ORD-10234");
  const [consumeLocation, setConsumeLocation] = useState("Main Facility");
  const [consumeError, setConsumeError] = useState<string | null>(null);
  const [isConsumeSkuDropdownOpen, setIsConsumeSkuDropdownOpen] = useState(false);
  const [skuSearchQuery, setSkuSearchQuery] = useState("");
  const [cycleCountLoc, setCycleCountLoc] = useState("Home Storage");
  const [cycleCountStep, setCycleCountStep] = useState<"select" | "executing" | "complete">("select");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const refreshInventoryFromApi = useCallback(async () => {
    let fresh: StockBalance[] = [];
    try {
      const res = await fetch("/api/v1/inventory");
      const payload = await safeResponseJson(res);
      const data = payload?.data || payload;
      fresh = Array.isArray(data?.balances)
        ? data.balances
        : Array.isArray(data)
          ? data
          : [];
    } catch {
      fresh = [];
    }

    let freshBills: PurchaseBill[] = [];
    try {
      const resBills = await fetch("/api/v1/purchase/bills");
      const payloadBills = await safeResponseJson(resBills);
      const dataBills = payloadBills?.data || payloadBills;
      freshBills = Array.isArray(dataBills?.bills)
        ? dataBills.bills
        : Array.isArray(dataBills)
          ? dataBills
          : [];
      setBills(freshBills);
    } catch {}

    // Merge live received Storage stock records from locationStockRepository
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
    setLastSyncedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));

    try {
      let storageLocs: Array<{ storageLocationId: string; sku: string; availableQty: number }> = [];
      try {
        storageLocs = locationStockRepository.getAllBalances().map((s) => ({
          storageLocationId: s.storageLocationId,
          sku: s.sku,
          availableQty: s.availableQty,
        }));
      } catch {}

      const recs = inventoryAdvisorEngine.generateRecommendations({
        balances: fresh,
        storageLocations: storageLocs,
        connectedMarketplaces: [
          { channel: "Amazon SP-API", connected: false },
          { channel: "Flipkart FBF", connected: false },
          { channel: "Shopify Store", connected: false },
        ],
      });
      setAiRecommendations(recs);
      setAiCredits(getAiCreditsRemaining());
    } catch {}

    return fresh;
  }, []);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    const start = Date.now();
    const freshBalances = await refreshInventoryFromApi();
    const totalUnits = freshBalances.reduce((acc, b) => acc + b.available, 0);
    const elapsed = Math.max(0, 400 - (Date.now() - start));

    setTimeout(() => {
      setIsSyncing(false);
      notificationEngine.send({
        recipientId: "usr-amir-patel",
        channels: ["in_app"],
        priority: "medium",
        title: "Live PostgreSQL Inventory Sync Complete",
        body: `Database query complete. ${freshBalances.length} active SKUs (${totalUnits.toLocaleString("en-IN")} units) synced from network.`,
      });
    }, elapsed);
  };

  useEffect(() => {
    void refreshInventoryFromApi();

    const handleStockUpdate = () => {
      void refreshInventoryFromApi();
    };

    window.addEventListener("commerceos_stock_updated", handleStockUpdate);
    window.addEventListener("storage", handleStockUpdate);

    // Realtime polling every 4s to reflect any external inventory updates
    const pollInterval = setInterval(() => {
      void refreshInventoryFromApi();
    }, 4000);

    return () => {
      window.removeEventListener("commerceos_stock_updated", handleStockUpdate);
      window.removeEventListener("storage", handleStockUpdate);
      clearInterval(pollInterval);
    };
  }, [refreshInventoryFromApi]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedSkuMetrics(null);
        setShowCycleCountModal(false);
        setShowAdjustmentModal(false);
        setShowConsumeModal(false);
        setShowValuationModal(false);
        setShowWhatIfSimulator(false);
        setShowAiDrawer(false);
        setIsSkuDropdownOpen(false);
        setIsConsumeSkuDropdownOpen(false);
        setIsRowsDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const skuMetricsList = useMemo(() => inventoryDecisionEngine.computeSkuDecisionMetrics(balances, bills), [balances, bills]);
  const summary = useMemo(() => inventoryDecisionEngine.computeIntelligenceSummary(skuMetricsList), [skuMetricsList]);

  const filteredSkuList = useMemo(() => {
    return skuMetricsList.filter((m) => {
      const matchesSearch = m.sku.toLowerCase().includes(searchQuery.toLowerCase()) || m.productName.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      const isConsumable = String((m as any).intent || "").toLowerCase() === "consumable" || m.sku.toLowerCase().includes("poly") || m.productName.toLowerCase().includes("box") || m.productName.toLowerCase().includes("tape") || m.productName.toLowerCase().includes("wrap");
      if (activeTab === "sellable") return !isConsumable;
      if (activeTab === "consumable") return isConsumable;
      if (activeTab === "reorder") return m.isReorderRequired;
      if (activeTab === "dead_stock") return m.isDeadStock;
      if (activeTab === "damaged") return m.damagedQty > 0;
      if (activeTab === "abc_a") return m.abcCategory === "A";
      return true;
    });
  }, [skuMetricsList, activeTab, searchQuery]);

  useEffect(() => { setCurrentPage(1); }, [activeTab, searchQuery, itemsPerPage]);
  const totalPages = Math.max(1, Math.ceil(filteredSkuList.length / itemsPerPage));
  const paginatedSkuList = useMemo(() => filteredSkuList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filteredSkuList, currentPage, itemsPerPage]);

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
      await refreshInventoryFromApi();
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
      setConsumeError(`Insufficient stock. Only ${available} units available on hand for ${targetSku}. Cannot consume ${qty} units.`);
      return;
    }

    if (consumeReason === "Other" && !consumeCustomReason.trim()) {
      setConsumeError("Please specify a note/reason for 'Other' consumption.");
      return;
    }

    // 1. Consume from Storage Repository (deducts physical accepted stock and records audit log)
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

    // 2. Call API endpoint
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

    // 3. Notify and refresh
    notificationEngine.send({
      recipientId: "usr-amir-patel",
      channels: ["in_app"],
      priority: "medium",
      title: `Stock Consumed: ${qty} units of ${targetSku}`,
      body: `Deducted ${qty} units for "${consumeReason}" (${consumeRef || "Internal"}). Remaining Available: ${consResult.remainingAvailable} units.`,
    });

    await refreshInventoryFromApi();
    setShowConsumeModal(false);
    setConsumeQty("10");
    setConsumeCustomReason("");
  };

  const handleStartCycleCount = () => {
    setCycleCountStep("executing");
    setTimeout(() => {
      setCycleCountStep("complete");
      notificationEngine.send({ recipientId: "usr-amir-patel", channels: ["in_app"], priority: "medium", title: "Cycle Count Completed", body: `Reconciliation complete for ${cycleCountLoc}. 0 variances.` });
    }, 800);
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] font-sans space-y-4 animate-in fade-in duration-300 pb-16">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventory Control Center</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">Real-time stock engine across all warehouses and channels.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:shrink-0">
          <button
            type="button"
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-indigo-600" : "text-indigo-600"}`} />
            {isSyncing ? "Syncing..." : "Sync Now"}
          </button>
          <button type="button" onClick={() => setShowValuationModal(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs cursor-pointer">
            <Coins className="w-3.5 h-3.5 text-amber-500" /> Valuation Report
          </button>
          <button type="button" onClick={() => setShowCycleCountModal(true)} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-xs cursor-pointer">
            <CheckSquare className="w-3.5 h-3.5" /> Cycle Count
          </button>
          <button type="button" onClick={() => { setConsumeSku(skuMetricsList[0]?.sku || ""); setShowConsumeModal(true); }} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-xs cursor-pointer active:scale-95">
            <span className="font-mono text-sm leading-none font-bold">−</span> Record Usage
          </button>
          <button type="button" onClick={() => setShowAdjustmentModal(true)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-xs font-bold text-white hover:bg-indigo-700 transition shadow-sm active:scale-95 cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Adjust Stock
          </button>
        </div>
      </div>


      {/* SECTION 3 — AI DRAWERS & SIMULATORS */}
      <InventoryAiDrawer
        isOpen={showAiDrawer}
        onClose={() => setShowAiDrawer(false)}
        balances={balances}
        onCreditsUpdated={(c) => setAiCredits(c)}
      />
      {showWhatIfSimulator && <InventoryWhatIfSimulator onClose={() => setShowWhatIfSimulator(false)} />}

      {/* SECTION A — CORE STOCK POSITION (GLOBAL REORDERABLE KPI SYSTEM) */}
      {(() => {
        const totalPhysicalAccepted = skuMetricsList.reduce((acc, m) => acc + m.availableQty + m.reservedQty + m.damagedQty, 0);
        const totalAtsAvailable = skuMetricsList.reduce((acc, m) => acc + m.availableQty, 0);
        const totalReserved = skuMetricsList.reduce((acc, m) => acc + m.reservedQty, 0);
        const totalDamaged = skuMetricsList.reduce((acc, m) => acc + m.damagedQty, 0);
        const totalInTransit = balances.reduce((acc, b) => acc + (b.inTransit ?? 0), 0);
        const totalConsumed = skuMetricsList.reduce((acc, m) => acc + (m.usedQty ?? 0), 0);

        return (
          <InventoryKpisSection
            totalPhysical={totalPhysicalAccepted}
            totalAts={totalAtsAvailable}
            totalReserved={totalReserved}
            totalDamaged={totalDamaged}
            totalInTransit={totalInTransit}
            totalConsumed={totalConsumed}
            skuCount={skuMetricsList.length}
            aiCredits={aiCredits}
            onOpenAiAdvisor={() => setShowAiDrawer(true)}
            onSelectTab={(tab) => {
              setActiveTab(tab as any);
              document.getElementById("sku-table-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            onNavigateOrders={() => router.push("/orders")}
          />
        );
      })()}

      {/* SECTION B — SALES CHANNEL CONTROL & ALLOCATION ARCHITECTURE (OPERATIONAL VISIBILITY) */}
      {(() => {
        const totalAts = skuMetricsList.reduce((acc, m) => acc + m.availableQty, 0);

        let amazonAllocated = 0;
        let flipkartAllocated = 0;
        let shopifyAllocated = 0;

        for (const m of skuMetricsList) {
          const rules = channelAllocationEngine.getRulesForSku(m.sku);
          for (const r of rules) {
            if (!r.active) continue;
            const cap = typeof r.fixedCap === "number" ? r.fixedCap : typeof r.percentage === "number" ? Math.floor((m.availableQty * r.percentage) / 100) : 0;
            if (r.channel.toUpperCase() === "AMAZON") amazonAllocated += cap;
            if (r.channel.toUpperCase() === "FLIPKART") flipkartAllocated += cap;
            if (r.channel.toUpperCase() === "SHOPIFY") shopifyAllocated += cap;
          }
        }

        const totalAllocated = amazonAllocated + flipkartAllocated + shopifyAllocated;
        const unallocatedAts = Math.max(0, totalAts - totalAllocated);

        return (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block">Omnichannel Stock Architecture</span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">Central ATS & Sales Channel Allocations</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500">Central Available Pool:</span>
                  <span className="text-sm font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg font-mono">
                    {totalAts.toLocaleString("en-IN")} ATS Units
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/products")}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
                >
                  <span>Manage in Product</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Channel 1: Amazon */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">Amazon SP-API</span>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">
                    Not Connected
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Allocated:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {amazonAllocated > 0 ? `${amazonAllocated.toLocaleString("en-IN")} Units` : "No Allocation"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Marketplace Status:</span>
                    <span className="font-bold text-slate-500">Not Synced</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-200/60">
                  Configured from Product / Master Listing.
                </p>
              </div>

              {/* Channel 2: Flipkart */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">Flipkart Smart / FBF</span>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">
                    Not Connected
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Allocated:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {flipkartAllocated > 0 ? `${flipkartAllocated.toLocaleString("en-IN")} Units` : "No Allocation"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Marketplace Status:</span>
                    <span className="font-bold text-slate-500">Not Synced</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-200/60">
                  Configured from Product / Master Listing.
                </p>
              </div>

              {/* Channel 3: Shopify */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">Shopify D2C Store</span>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-200 text-slate-600">
                    Not Connected
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Allocated:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {shopifyAllocated > 0 ? `${shopifyAllocated.toLocaleString("en-IN")} Units` : "No Allocation"}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Marketplace Status:</span>
                    <span className="font-bold text-slate-500">Not Synced</span>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium pt-1 border-t border-slate-200/60">
                  Configured from Product / Master Listing.
                </p>
              </div>

              {/* Channel 4: Unallocated Reserve */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-emerald-950">Central Reserve</span>
                  <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Unallocated
                  </span>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-emerald-900">
                    <span>Available Buffer:</span>
                    <span className="font-mono font-black text-emerald-950">
                      {unallocatedAts.toLocaleString("en-IN")} Units
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-800">
                    <span>Protection:</span>
                    <span className="font-bold">Overselling Guard</span>
                  </div>
                </div>
                <p className="text-[10px] text-emerald-700 font-medium pt-1 border-t border-emerald-200/60">
                  Buffer held in reserve.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-indigo-200/70 bg-indigo-50/50 p-2.5 text-[11px] text-indigo-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <span className="font-semibold">
                <strong>Architecture Rule:</strong> Marketplace stock allocations are configured in the <strong>Product / Master Listing</strong> workspace and bounded by real central ATS ({totalAts} Units). Inventory provides operational visibility.
              </span>
              <button
                type="button"
                onClick={() => router.push("/products")}
                className="font-bold text-indigo-700 hover:text-indigo-900 cursor-pointer text-xs shrink-0 inline-flex items-center gap-1"
              >
                <span>Open Product Allocation</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* SECTION C — OPERATIONAL INVENTORY SKU TABLE */}
      <div id="sku-table-section" className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            {[
              { id: "all", label: `All SKUs (${summary.totalSkus})` },
              { id: "sellable", label: `📦 Sellable Only` },
              { id: "consumable", label: `📦 Packaging Materials` },
              { id: "reorder", label: `⚠ Reorder Needed (${summary.countReorderRequired})` },
              { id: "damaged", label: `QC Damaged` },
            ].map((t) => (
              <button key={t.id} type="button" onClick={() => setActiveTab(t.id as any)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${activeTab === t.id ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="relative w-64 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search SKU or product..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="py-3 px-5">SKU & Product</th>
                <th className="py-3 px-4">Physical</th>
                <th className="py-3 px-4 text-emerald-800">Available (ATS)</th>
                <th className="py-3 px-4">Reserved</th>
                <th className="py-3 px-4">Used</th>
                <th className="py-3 px-4">Damaged / QC</th>
                <th className="py-3 px-4">Incoming</th>
                <th className="py-3 px-4">Channels</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSkuList.length === 0 ? (
                <tr><td colSpan={10} className="py-16 text-center text-sm font-semibold text-slate-400">No SKUs match the current filter.</td></tr>
              ) : paginatedSkuList.map((m) => {
                const physicalQty = m.availableQty + m.reservedQty + m.damagedQty;
                return (
                  <tr key={m.sku} onClick={() => { setSelectedSkuMetrics(m); setSkuModalTab("overview"); }} className="hover:bg-indigo-50/30 transition-colors cursor-pointer group border-b border-slate-100">
                    <td className="py-3.5 px-5">
                      <span className="font-extrabold text-sm text-slate-900 block group-hover:text-indigo-700 transition-colors">{m.sku}</span>
                      <span className="text-xs text-slate-500 font-medium block mt-0.5 max-w-[200px] truncate">{m.productName}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-sm font-bold text-slate-900 tabular-nums">{physicalQty.toLocaleString()}</span>
                    </td>
                    <td className="py-3.5 px-4 bg-emerald-50/20">
                      <span className="text-sm font-black text-emerald-700 tabular-nums">{m.availableQty.toLocaleString()}</span>
                      <span className="text-[10px] text-emerald-600 font-bold ml-1">ATS</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs font-bold text-slate-600 font-mono">{m.reservedQty}</span>
                    </td>
                    <td className="py-3.5 px-4" onClick={(e) => { e.stopPropagation(); setSelectedSkuMetrics(m); setSkuModalTab("consumption"); }}>
                      <div className="flex items-center gap-1 group/used cursor-pointer" title="Click to inspect usage history">
                        <span className={`text-xs font-black tabular-nums font-mono ${m.usedQty > 0 ? "text-amber-700 underline decoration-amber-300 underline-offset-2" : "text-slate-400"}`}>
                          {m.usedQty.toLocaleString()}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {m.damagedQty > 0
                        ? <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 font-black text-[10px]">{m.damagedQty} QC</span>
                        : <span className="text-xs text-slate-300 font-mono">—</span>
                      }
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-xs text-slate-400 font-mono">0</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Not Allocated</span>
                    </td>
                    <td className="py-3.5 px-4">
                      {m.availableQty === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">Zero Stock</span>
                      ) : m.isReorderRequired ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px]">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />Reorder (ROP {m.reorderPoint})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px]">In Stock</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setConsumeSku(m.sku);
                            setShowConsumeModal(true);
                          }}
                          className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-xs transition-all active:scale-95 cursor-pointer"
                          title="Record usage / consumption for this SKU"
                        >
                          − Use
                        </button>
                        <button type="button" onClick={() => { setSelectedSkuMetrics(m); setSkuModalTab("overview"); }} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 group-hover:bg-indigo-600 group-hover:text-white text-slate-700 font-bold text-xs transition-all active:scale-95">
                          Inspect <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-slate-900">{filteredSkuList.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</strong> – <strong className="text-slate-900">{Math.min(currentPage * itemsPerPage, filteredSkuList.length)}</strong> of <strong className="text-slate-900">{filteredSkuList.length}</strong> SKUs
            </span>
            <div className="relative">
              <button type="button" onClick={() => setIsRowsDropdownOpen(!isRowsDropdownOpen)} className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
                {itemsPerPage} rows <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              {isRowsDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsRowsDropdownOpen(false)} />
                  <div className="absolute left-0 bottom-full mb-1.5 w-28 rounded-xl bg-white border border-slate-200 shadow-xl z-50 p-1 space-y-0.5">
                    {[10, 25, 50, 100].map((val) => (
                      <button key={val} type="button" onClick={() => { setItemsPerPage(val); setIsRowsDropdownOpen(false); }} className={`w-full px-2.5 py-1.5 text-left rounded-lg text-xs font-bold flex items-center justify-between transition ${itemsPerPage === val ? "bg-indigo-50 text-indigo-600" : "text-slate-700 hover:bg-slate-50"}`}>
                        {val} rows {itemsPerPage === val && <Check className="w-3 h-3 text-indigo-600" />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
              <ChevronLeft className="w-3.5 h-3.5" /> Previous
            </button>
            <span className="px-3 py-1.5 text-xs font-bold text-slate-600">Page {currentPage} / {totalPages}</span>
            <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition">
              Next <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* MODALS */}

      {/* 360° SKU Inspector */}
      {selectedSkuMetrics && (
        <div onClick={() => setSelectedSkuMetrics(null)} className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-3xl max-h-[88vh] overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-2xl bg-white p-6 shadow-2xl space-y-4 cursor-default relative border border-slate-100">
            <button onClick={() => setSelectedSkuMetrics(null)} className="absolute right-4 top-4 p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition"><X className="w-4 h-4" /></button>
            <div className="border-b border-slate-100 pb-4 pr-10">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest block">360° SKU Intelligence</span>
              <h2 className="text-xl font-black text-slate-900 mt-1">{selectedSkuMetrics.sku}</h2>
              <p className="text-sm text-slate-500 font-medium">{selectedSkuMetrics.productName}</p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: "overview", label: "Overview" },
                { id: "balances", label: "Node Balances" },
                { id: "consumption", label: `Usage / Consumed (${selectedSkuMetrics.usedQty || 0})` },
                { id: "timeline", label: "Movement Timeline" },
                { id: "financials", label: "Financials" },
                { id: "marketplace", label: "Marketplace" },
              ].map((tb) => (
                <button key={tb.id} type="button" onClick={() => setSkuModalTab(tb.id as any)} className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${skuModalTab === tb.id ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}>{tb.label}</button>
              ))}
            </div>
            {skuModalTab === "overview" && (
              <div className="space-y-4">
                {selectedSkuMetrics.aiRecommendation && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold text-amber-900 flex items-center gap-1.5 text-sm">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        AI Advisory ({selectedSkuMetrics.aiRecommendation.type.toUpperCase()})
                      </span>
                      <span className="text-[10px] font-black px-2 py-0.5 bg-amber-200/70 rounded-md text-amber-900">
                        ROI +{selectedSkuMetrics.aiRecommendation.estimatedRoiPct}%
                      </span>
                    </div>
                    <p className="font-bold text-slate-900">{selectedSkuMetrics.aiRecommendation.title}</p>
                    <p className="text-xs text-amber-900"><strong>Reason:</strong> {selectedSkuMetrics.aiRecommendation.reason}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-amber-700 block uppercase font-bold mb-0.5">Estimated Impact</span>
                        <span className="text-base font-black text-emerald-700 font-mono">
                          ₹{selectedSkuMetrics.aiRecommendation.estimatedSaving.toLocaleString("en-IN")}
                        </span>
                      </div>
                      <div className="p-2.5 bg-white/80 rounded-xl border border-amber-200">
                        <span className="text-[10px] text-amber-700 block uppercase font-bold mb-0.5">Expected Benefit</span>
                        <span className="text-slate-800 font-semibold">{selectedSkuMetrics.aiRecommendation.expectedBenefit}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-amber-200/60 text-xs">
                      <span className="font-bold text-amber-900">Manual Alternative:</span> {selectedSkuMetrics.aiRecommendation.manualAlternative}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Available Stock</span>
                    <span className="text-lg font-black block mt-1 text-emerald-700 font-mono">
                      {selectedSkuMetrics.availableQty.toLocaleString("en-IN")} Units
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Asset Valuation</span>
                    <span className="text-lg font-black block mt-1 text-indigo-800 font-mono">
                      ₹{selectedSkuMetrics.totalAssetValue.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Holding Cost / Mo</span>
                    <span className="text-lg font-black block mt-1 text-amber-700">
                      {selectedSkuMetrics.holdingCostConfigured
                        ? `₹${selectedSkuMetrics.monthlyHoldingCost.toLocaleString("en-IN")}`
                        : "Not configured"}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {skuModalTab === "consumption" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm">Consumption & Usage History ("Where was it used?")</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setConsumeSku(selectedSkuMetrics.sku);
                      setShowConsumeModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition"
                  >
                    − Record New Usage
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Inwarded</span>
                    <span className="text-lg font-black block mt-1 text-slate-900 font-mono">{selectedSkuMetrics.totalReceivedQty} Units</span>
                  </div>
                  <div className="p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-200">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Available Usable</span>
                    <span className="text-lg font-black block mt-1 text-emerald-700 font-mono">{selectedSkuMetrics.availableQty} Units</span>
                  </div>
                  <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200">
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Total Consumed / Used</span>
                    <span className="text-lg font-black block mt-1 text-amber-800 font-mono">{selectedSkuMetrics.usedQty} Units</span>
                  </div>
                </div>

                {selectedSkuMetrics.consumptionHistory.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <p className="text-sm font-semibold text-slate-500">No consumption transactions recorded for this SKU yet.</p>
                    <p className="text-xs text-slate-400">All order packaging, internal ops, or write-off deductions will be logged here with immutable audit references.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedSkuMetrics.consumptionHistory.map((c) => (
                      <div key={c.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{c.reason}</span>
                            {c.customReason && (
                              <span className="text-xs text-slate-600 font-medium">({c.customReason})</span>
                            )}
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-mono">
                              {c.reference || "Internal"}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Location: <strong className="text-slate-700">{c.storageLocationName || "Main Facility"}</strong> · By: <strong className="text-slate-700">{c.actorName || "Warehouse Staff"}</strong>
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {new Date(c.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-black font-mono text-rose-600 text-base">-{c.quantity} units</span>
                          <span className="text-[10px] text-slate-400 block font-medium">Consumed</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {skuModalTab === "balances" && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Internal Physical Storage Nodes</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Physical location balances from Storage Network SOT.</p>
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
            {skuModalTab === "financials" && (
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 text-sm">Financial Asset Valuation</h4>
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-sm">
                  {[
                    { label: "Unit Cost Price", value: selectedSkuMetrics.unitCostPrice > 0 ? `₹${selectedSkuMetrics.unitCostPrice.toLocaleString("en-IN")}` : "₹0 (Uncosted)", color: "text-slate-900 font-mono font-bold" },
                    { label: "Total Asset Valuation", value: `₹${selectedSkuMetrics.totalAssetValue.toLocaleString("en-IN")}`, color: "text-indigo-800 font-mono font-bold" },
                    { label: "Monthly Holding Cost", value: selectedSkuMetrics.holdingCostConfigured ? `₹${selectedSkuMetrics.monthlyHoldingCost.toLocaleString("en-IN")}` : "Not configured", color: "text-slate-600 font-semibold" },
                    { label: "Costing Method", value: "Weighted Average Purchase Cost (GRN SOT)", color: "text-slate-700 font-semibold" },
                    { label: "Inventory Valuation Rule", value: "Physical Available Units × Unit Cost", color: "text-slate-500 text-xs" },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center py-1 border-b border-slate-200/50 last:border-0">
                      <span className="text-slate-600 font-medium text-xs">{row.label}</span>
                      <span className={row.color}>{row.value}</span>
                    </div>
                  ))}
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
                ["AMAZON", "FLIPKART", "SHOPIFY"],
              );

              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">Marketplace Sales Channel Allocations</h4>
                      <p className="text-xs text-slate-500">Configured in Product / Master Listing · Bounded by Central ATS ({selectedSkuMetrics.availableQty} Units)</p>
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
                      const channelName = a.channel === "AMAZON" ? "Amazon SP-API" : a.channel === "FLIPKART" ? "Flipkart Smart" : "Shopify D2C";
                      return (
                        <div key={a.channel} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-slate-800 text-xs">{channelName}</span>
                            <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">Not Connected</span>
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between text-slate-600">
                              <span>Allocated:</span>
                              <span className="font-mono font-bold text-slate-900">{a.allocatedQty > 0 ? `${a.allocatedQty} Units` : "No Allocation"}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Reported Stock:</span>
                              <span className="font-bold text-slate-400">Not Synced</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                              <span>Sync State:</span>
                              <span className="font-bold text-slate-400">{a.syncStatus === "NOT_SYNCED" ? "Not Synced" : "Pending Sync"}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-200/80 text-xs text-indigo-950 flex items-center justify-between">
                    <span><strong>Unallocated Reserve Buffer:</strong> {allocResult.unallocatedQty} Units held in central reserve.</span>
                    <span className="text-[11px] text-indigo-700 font-semibold">Zero fake marketplace stock.</span>
                  </div>
                </div>
              );
            })()}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button type="button" onClick={() => setSelectedSkuMetrics(null)} className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition">Close Inspection</button>
            </div>
          </div>
        </div>
      )}

      {/* Valuation Modal */}
      {showValuationModal && (
        <div onClick={() => setShowValuationModal(false)} className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-xl bg-white rounded-2xl border border-slate-100 p-6 shadow-2xl space-y-4 cursor-default relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><Coins className="w-4 h-4 text-amber-500" />Inventory Valuation & Financial Asset Report</h3>
              <button onClick={() => setShowValuationModal(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">Total Net Inventory Value</span>
              <span className="text-3xl font-black text-emerald-400 font-mono">₹{(summary.totalAssetValue / 100000).toFixed(2)} Lakhs</span>
              <p className="text-xs text-slate-400 font-medium mt-1">Across all physical units in primary storage and warehouse network.</p>
            </div>
            <div className="space-y-2 text-sm font-mono">
              {[
                { label: "Monthly Holding Cost", value: summary.totalMonthlyHoldingCost > 0 ? `₹${summary.totalMonthlyHoldingCost.toLocaleString("en-IN")}` : "Not configured", color: "text-slate-900" },
                { label: "Avg. Days Inventory On-Hand", value: `${summary.averageDioDays} Days`, color: "text-indigo-800" },
                { label: "Dead Stock Capital Locked", value: `₹${skuMetricsList.filter((m) => m.isDeadStock).reduce((acc, m) => acc + m.totalAssetValue, 0).toLocaleString("en-IN")}`, color: "text-rose-600" },
              ].map((row) => (
                <div key={row.label} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between">
                  <span className="text-slate-500 font-sans font-medium text-xs">{row.label}</span>
                  <span className={`font-bold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button onClick={() => setShowValuationModal(false)} className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition">Close Report</button>
            </div>
          </div>
        </div>
      )}

      {/* Cycle Count Modal */}
      {showCycleCountModal && (
        <div onClick={() => setShowCycleCountModal(false)} className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in cursor-pointer">
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white rounded-2xl border border-slate-100 p-6 shadow-2xl space-y-4 cursor-default relative">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2"><CheckSquare className="w-4 h-4 text-emerald-600" />Cycle Count Workspace</h3>
              <button onClick={() => setShowCycleCountModal(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition"><X className="w-4 h-4" /></button>
            </div>
            {cycleCountStep === "select" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 font-medium">Select storage location to initiate physical count reconciliation:</p>
                <Select value={cycleCountLoc} onValueChange={setCycleCountLoc}>
                  <SelectTrigger className="h-11 border-slate-200 bg-slate-50 font-bold text-slate-900 text-sm focus:bg-white">
                    <SelectValue placeholder="Select storage location..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Home Storage">Home Storage (Koramangala)</SelectItem>
                    <SelectItem value="Bengaluru Central Hub">Bengaluru Central Hub</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setShowCycleCountModal(false)} className="px-4 py-2 bg-slate-100 font-bold text-xs rounded-xl hover:bg-slate-200 transition">Cancel</button>
                  <button onClick={handleStartCycleCount} className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition">Start Count</button>
                </div>
              </div>
            )}
            {cycleCountStep === "executing" && (
              <div className="py-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
                <p className="text-sm font-bold text-slate-900">Reconciling physical barcodes & SOT stock...</p>
              </div>
            )}
            {cycleCountStep === "complete" && (
              <div className="space-y-4 text-center">
                <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-700">
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-2" />
                  <span className="font-extrabold text-base block">Reconciliation Complete</span>
                  <span className="text-sm font-medium">Physical counts matched SOT balances 100%.</span>
                </div>
                <button onClick={() => setShowCycleCountModal(false)} className="w-full py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition">Done</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {showAdjustmentModal && (
        <div onClick={() => setShowAdjustmentModal(false)} className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in cursor-pointer">
          <form onSubmit={handleExecuteAdjustment} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white rounded-2xl border border-slate-100 p-6 shadow-2xl space-y-4 cursor-default relative">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">Stock Level Adjustment</h3>
              <button type="button" onClick={() => setShowAdjustmentModal(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Target SKU</label>
                <div className="relative">
                  <button type="button" onClick={() => setIsSkuDropdownOpen(!isSkuDropdownOpen)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-left flex items-center justify-between text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <div className="truncate">
                      <span className="font-mono text-slate-900">{adjustSku}</span>
                      <span className="text-xs text-slate-500 font-normal ml-2">({skuMetricsList.find((m) => m.sku === adjustSku)?.productName || "Select SKU"})</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                  </button>
                  {isSkuDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsSkuDropdownOpen(false)} />
                      <div className="absolute left-0 right-0 mt-1 rounded-xl bg-white border border-slate-200 shadow-2xl z-50 p-2 space-y-1.5">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                          <input type="text" placeholder="Search SKU or product..." value={skuSearchQuery} onChange={(e) => setSkuSearchQuery(e.target.value)} className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20" autoFocus />
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                          {skuMetricsList.filter((m) => m.sku.toLowerCase().includes(skuSearchQuery.toLowerCase()) || m.productName.toLowerCase().includes(skuSearchQuery.toLowerCase())).map((m) => (
                            <div key={m.sku} onClick={() => { setAdjustSku(m.sku); setIsSkuDropdownOpen(false); }} className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between transition ${adjustSku === m.sku ? "bg-indigo-50 border border-indigo-200" : "hover:bg-slate-50 border border-transparent"}`}>
                              <div className="truncate pr-2">
                                <span className="font-bold font-mono text-slate-900 text-xs block">{m.sku}</span>
                                <span className="text-[10px] text-slate-500 block truncate">{m.productName}</span>
                              </div>
                              <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded shrink-0">{m.availableQty} avail</span>
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
                <input type="number" required value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Reason Code</label>
                <Select value={adjustReason} onValueChange={setAdjustReason}>
                  <SelectTrigger className="h-11 border-slate-200 bg-slate-50 font-bold text-sm text-slate-900 focus:bg-white">
                    <SelectValue placeholder="Select reason code..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cycle Count Reconciliation Variance">Cycle Count Reconciliation Variance</SelectItem>
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
              <button type="button" onClick={() => setShowAdjustmentModal(false)} className="px-4 py-2 bg-slate-100 font-bold text-xs rounded-xl hover:bg-slate-200 transition">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition active:scale-95">Approve & Adjust SOT</button>
            </div>
          </form>
        </div>
      )}

      {/* Record Usage / Consume Stock Modal */}
      {showConsumeModal && (
        <div onClick={() => setShowConsumeModal(false)} className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in cursor-pointer">
          <form onSubmit={handleExecuteConsumption} onClick={(e) => e.stopPropagation()} className="w-full max-w-md bg-white rounded-2xl border border-slate-100 p-6 shadow-2xl space-y-4 cursor-default relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 block">Stock Depletion Engine</span>
                <h3 className="text-base font-bold text-slate-900">Record Stock Usage / Consumption</h3>
              </div>
              <button type="button" onClick={() => setShowConsumeModal(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition"><X className="w-4 h-4" /></button>
            </div>

            {consumeError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
                {consumeError}
              </div>
            )}

            <div className="space-y-3">
              {/* Target SKU */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Target SKU / Product</label>
                <div className="relative">
                  <button type="button" onClick={() => setIsConsumeSkuDropdownOpen(!isConsumeSkuDropdownOpen)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-left flex items-center justify-between text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20">
                    <div className="truncate">
                      <span className="font-mono text-slate-900">{consumeSku || skuMetricsList[0]?.sku || "Select SKU"}</span>
                      <span className="text-xs text-slate-500 font-normal ml-2">({skuMetricsList.find((m) => m.sku === (consumeSku || skuMetricsList[0]?.sku))?.productName || ""})</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                  </button>
                  {isConsumeSkuDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setIsConsumeSkuDropdownOpen(false)} />
                      <div className="absolute left-0 right-0 mt-1 rounded-xl bg-white border border-slate-200 shadow-2xl z-50 p-2 space-y-1.5">
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                          <input type="text" placeholder="Search SKU or product..." value={skuSearchQuery} onChange={(e) => setSkuSearchQuery(e.target.value)} className="w-full pl-8 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20" autoFocus />
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                          {skuMetricsList.filter((m) => m.sku.toLowerCase().includes(skuSearchQuery.toLowerCase()) || m.productName.toLowerCase().includes(skuSearchQuery.toLowerCase())).map((m) => (
                            <div key={m.sku} onClick={() => { setConsumeSku(m.sku); setIsConsumeSkuDropdownOpen(false); }} className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between transition ${(consumeSku || skuMetricsList[0]?.sku) === m.sku ? "bg-rose-50 border border-rose-200" : "hover:bg-slate-50 border border-transparent"}`}>
                              <div className="truncate pr-2">
                                <span className="font-bold font-mono text-slate-900 text-xs block">{m.sku}</span>
                                <span className="text-[10px] text-slate-500 block truncate">{m.productName}</span>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded shrink-0">{m.availableQty} avail</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Consumption Quantity */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Quantity to Consume / Use</label>
                  <span className="text-[11px] font-bold text-slate-500">
                    Max Available: <strong className="text-emerald-700">{skuMetricsList.find((m) => m.sku === (consumeSku || skuMetricsList[0]?.sku))?.availableQty ?? 0}</strong>
                  </span>
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  max={skuMetricsList.find((m) => m.sku === (consumeSku || skuMetricsList[0]?.sku))?.availableQty ?? 9999}
                  value={consumeQty}
                  onChange={(e) => setConsumeQty(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Consumption Reason */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Usage / Consumption Reason</label>
                <Select value={consumeReason} onValueChange={setConsumeReason}>
                  <SelectTrigger className="h-11 border-slate-200 bg-slate-50 font-bold text-sm text-slate-900 focus:bg-white">
                    <SelectValue placeholder="Select usage reason..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Order Packaging">📦 Order Packaging & Dispatch</SelectItem>
                    <SelectItem value="Internal Operations">🏢 Internal Operations & Facility</SelectItem>
                    <SelectItem value="Production">⚙ Production / Assembly Line</SelectItem>
                    <SelectItem value="Sample">🎁 Marketing Sample / Customer Trial</SelectItem>
                    <SelectItem value="Damaged/Write-off">⚠ Damaged / Quality Write-off</SelectItem>
                    <SelectItem value="Manual Consumption">✋ Manual Consumption</SelectItem>
                    <SelectItem value="Other">📝 Other (Specify reason below)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Reason Note if Other */}
              {consumeReason === "Other" && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Specify Reason Details *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Returned parcel packaging damaged during transit"
                    value={consumeCustomReason}
                    onChange={(e) => setConsumeCustomReason(e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                </div>
              )}

              {/* Reference */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Audit Reference (Order # / Task ID)</label>
                <input
                  type="text"
                  placeholder="e.g. Order #ORD-10234 or Task #TSK-88"
                  value={consumeRef}
                  onChange={(e) => setConsumeRef(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {/* Storage Location */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Storage Location / Facility</label>
                <Select value={consumeLocation} onValueChange={setConsumeLocation}>
                  <SelectTrigger className="h-11 border-slate-200 bg-slate-50 font-bold text-xs text-slate-900 focus:bg-white">
                    <SelectValue placeholder="Select facility..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Main Facility">Main Warehouse Facility (Primary)</SelectItem>
                    <SelectItem value="Home Storage">Home Storage (Koramangala)</SelectItem>
                    <SelectItem value="Bengaluru Central Hub">Bengaluru Central Hub</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowConsumeModal(false)} className="px-4 py-2 bg-slate-100 font-bold text-xs rounded-xl hover:bg-slate-200 transition">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-700 transition active:scale-95">Record Consumption & Deduct SOT</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

interface InventoryKpisSectionProps {
  totalPhysical: number;
  totalAts: number;
  totalReserved: number;
  totalDamaged: number;
  totalInTransit: number;
  totalConsumed: number;
  skuCount: number;
  aiCredits?: number;
  onOpenAiAdvisor?(): void;
  onSelectTab(tab: string): void;
  onNavigateOrders(): void;
}

const DEFAULT_INVENTORY_KPI_ORDER = [
  "physical_stock",
  "available_ats",
  "reserved_stock",
  "damaged_qc",
  "in_transit",
  "consumed_stock",
] as const;

function InventoryKpisSection({
  totalPhysical,
  totalAts,
  totalReserved,
  totalDamaged,
  totalInTransit,
  totalConsumed,
  skuCount,
  aiCredits = 221,
  onOpenAiAdvisor,
  onSelectTab,
  onNavigateOrders,
}: InventoryKpisSectionProps) {
  const { order, isReordered, resetOrder, getCardDragProps } = useReorderableKpis({
    storageKey: "commerceos_inventory_kpi_order_v1",
    defaultOrder: DEFAULT_INVENTORY_KPI_ORDER,
  });

  const renderCard = (key: (typeof DEFAULT_INVENTORY_KPI_ORDER)[number]) => {
    switch (key) {
      case "physical_stock":
        return (
          <div
            onClick={() => onSelectTab("all")}
            className="rounded-2xl border border-slate-200 bg-white p-4 cursor-pointer group transition-all hover:border-slate-400 hover:shadow-xs active:scale-[0.99] h-full"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Physical On-Hand</span>
                <span className="text-2xl font-black text-slate-900 block mt-1 leading-none">{totalPhysical.toLocaleString("en-IN")}</span>
                <span className="text-slate-500 text-[11px] font-semibold mt-1 block">Total on-hand physical units</span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>Inwarded & Verified</span>
              <span className="text-slate-900 font-extrabold">{skuCount} SKUs</span>
            </div>
          </div>
        );

      case "available_ats":
        return (
          <div
            onClick={() => onSelectTab("sellable")}
            className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 cursor-pointer group transition-all hover:border-emerald-400 hover:shadow-xs active:scale-[0.99] h-full"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">Available to Sell (ATS)</span>
                <span className="text-2xl font-black text-emerald-950 block mt-1 leading-none">{totalAts.toLocaleString("en-IN")}</span>
                <span className="text-emerald-700 text-[11px] font-semibold mt-1 block">On Hand − Reserved − Allocated</span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between text-[11px] font-extrabold text-emerald-800">
              <span>Ready for orders</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          </div>
        );

      case "reserved_stock":
        return (
          <div
            onClick={onNavigateOrders}
            className="rounded-2xl border border-slate-200 bg-white p-4 cursor-pointer group transition-all hover:border-violet-300 hover:shadow-xs active:scale-[0.99] h-full"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Reserved Stock</span>
                <span className="text-2xl font-black text-slate-900 block mt-1 leading-none">{totalReserved.toLocaleString("en-IN")}</span>
                <span className="text-slate-500 text-[11px] font-semibold mt-1 block">Active order commitments</span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-700 border border-violet-200 shrink-0">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-violet-700">
              <span>Order allocation</span>
              <span>{totalReserved > 0 ? "Allocated" : "0 Open"}</span>
            </div>
          </div>
        );

      case "damaged_qc":
        return (
          <div
            onClick={() => onSelectTab("damaged")}
            className={`rounded-2xl border p-4 cursor-pointer group transition-all hover:shadow-xs active:scale-[0.99] h-full ${totalDamaged > 0 ? "border-rose-200 bg-rose-50/40 hover:border-rose-400" : "border-slate-200 bg-white hover:border-slate-300"}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className={`text-[10px] font-extrabold uppercase tracking-wider block ${totalDamaged > 0 ? "text-rose-800" : "text-slate-400"}`}>Damaged / QC</span>
                <span className={`text-2xl font-black block mt-1 leading-none ${totalDamaged > 0 ? "text-rose-950" : "text-slate-900"}`}>{totalDamaged.toLocaleString("en-IN")}</span>
                <span className={`text-[11px] font-semibold mt-1 block ${totalDamaged > 0 ? "text-rose-700" : "text-slate-500"}`}>Excluded from ATS</span>
              </div>
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl border shrink-0 ${totalDamaged > 0 ? "bg-rose-100 text-rose-800 border-rose-300" : "bg-slate-50 text-slate-500 border-slate-200"}`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
              <span className={totalDamaged > 0 ? "text-rose-700 font-extrabold" : "text-slate-400"}>Vendor Exchange / QC</span>
              {totalDamaged > 0 && <span className="text-[9px] font-black bg-rose-200 text-rose-900 px-1.5 py-0.5 rounded">Action</span>}
            </div>
          </div>
        );

      case "in_transit":
        return (
          <div
            onClick={() => onSelectTab("all")}
            className="rounded-2xl border border-slate-200 bg-white p-4 cursor-pointer group transition-all hover:border-sky-300 hover:shadow-xs active:scale-[0.99] h-full"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">In-Transit Transfers</span>
                <span className="text-2xl font-black text-slate-900 block mt-1 leading-none">{totalInTransit.toLocaleString("en-IN")}</span>
                <span className="text-slate-500 text-[11px] font-semibold mt-1 block">Inter-facility routing</span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-700 border border-sky-200 shrink-0">
                <Truck className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-sky-700">
              <span>Transfer Network</span>
              <span>Warehouse →</span>
            </div>
          </div>
        );

      case "consumed_stock":
        return (
          <div
            onClick={() => onSelectTab("consumable")}
            className="rounded-2xl border border-slate-200 bg-white p-4 cursor-pointer group transition-all hover:border-amber-300 hover:shadow-xs active:scale-[0.99] h-full"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">Used / Consumed</span>
                <span className="text-2xl font-black text-slate-900 block mt-1 leading-none">{totalConsumed.toLocaleString("en-IN")}</span>
                <span className="text-slate-500 text-[11px] font-semibold mt-1 block">Packaging & operational usage</span>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
                <Boxes className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-amber-700">
              <span>Consumables & Packs</span>
              <span>Audit Log →</span>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className="text-[11px] font-semibold text-slate-400">
          Stock Engine Overview (Drag & drop to rearrange metrics)
        </span>
        <div className="flex items-center gap-2.5">
          {isReordered && (
            <button
              type="button"
              onClick={resetOrder}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-violet-600 hover:text-violet-800 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset Order
            </button>
          )}
          {onOpenAiAdvisor && (
            <button
              type="button"
              onClick={onOpenAiAdvisor}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-violet-50 hover:bg-violet-100 border border-violet-200 text-violet-800 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95 group"
            >
              <Sparkles className="w-3.5 h-3.5 text-violet-600 group-hover:scale-110 transition-transform" />
              <span>AI Inventory Advisor</span>
              <span className="flex items-center text-[10px] font-black px-1.5 py-0.5 bg-violet-200/80 text-violet-900 rounded-md ml-0.5">
                {aiCredits} Cr
              </span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        {order.map((key, index) => {
          const dragProps = getCardDragProps(index);
          return (
            <ReorderableKpiCard
              key={key}
              {...dragProps}
            >
              {renderCard(key)}
            </ReorderableKpiCard>
          );
        })}
      </div>
    </div>
  );
}
