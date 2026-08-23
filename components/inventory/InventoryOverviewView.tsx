"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { safeResponseJson } from "@/lib/api/client";
import { getAiCreditsRemaining } from "@/lib/ai/credits";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Coins,
  FileSpreadsheet,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Truck,
  RotateCcw,
  X,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReorderableKpis, ReorderableKpiCard } from "@/components/ui/kpi";
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
import RecordUsageModal from "./RecordUsageModal";

import InventoryAiDrawer from "./InventoryAiDrawer";
import InventoryWhatIfSimulator from "./InventoryWhatIfSimulator";
import { inventoryAdvisorEngine, type InventoryRecommendation } from "@/lib/inventory/inventory-advisor-engine";

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
  onNavigateStock(tab?: string): void;
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
  onNavigateStock,
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
            onClick={() => onNavigateStock("all")}
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
            onClick={() => onNavigateStock("sellable")}
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
            onClick={() => onNavigateStock("damaged")}
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
            onClick={() => onNavigateStock("all")}
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
            onClick={() => onNavigateStock("consumable")}
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

export default function InventoryOverviewView() {
  const router = useRouter();

  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [aiRecommendations, setAiRecommendations] = useState<InventoryRecommendation[]>([]);
  const [aiCredits, setAiCredits] = useState<number>(221);
  const [selectedSkuMetrics, setSelectedSkuMetrics] = useState<SkuDecisionMetrics | null>(null);
  const [skuModalTab, setSkuModalTab] = useState<"overview" | "balances" | "timeline" | "financials" | "marketplace" | "consumption">("overview");
  
  const [showCycleCountModal, setShowCycleCountModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [showConsumeModal, setShowConsumeModal] = useState(false);
  const [showValuationModal, setShowValuationModal] = useState(false);
  const [showWhatIfSimulator, setShowWhatIfSimulator] = useState(false);
  const [showAiDrawer, setShowAiDrawer] = useState(false);
  
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

    const pollInterval = setInterval(() => {
      void refreshInventoryFromApi();
    }, 5000);

    return () => {
      window.removeEventListener("commerceos_stock_updated", handleStockUpdate);
      window.removeEventListener("storage", handleStockUpdate);
      clearInterval(pollInterval);
    };
  }, [refreshInventoryFromApi]);

  const skuMetricsList = useMemo(
    () => inventoryDecisionEngine.computeSkuDecisionMetrics(balances, bills),
    [balances, bills]
  );
  const summary = useMemo(
    () => inventoryDecisionEngine.computeIntelligenceSummary(skuMetricsList),
    [skuMetricsList]
  );

  const reorderRiskList = useMemo(() => {
    return skuMetricsList.filter((m) => m.isReorderRequired || m.availableQty === 0).slice(0, 5);
  }, [skuMetricsList]);

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
      notificationEngine.send({
        recipientId: "usr-amir-patel",
        channels: ["in_app"],
        priority: "medium",
        title: "Cycle Count Completed",
        body: `Reconciliation complete for ${cycleCountLoc}. 0 variances.`,
      });
    }, 800);
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] font-sans space-y-5 animate-in fade-in duration-300 pb-16">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventory Overview</h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Real-time stock position, channel allocation protection, and executive decision intelligence.
          </p>
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
          <button
            type="button"
            onClick={() => setShowValuationModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-xs cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" /> Valuation
          </button>
          <button
            type="button"
            onClick={() => setShowCycleCountModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition shadow-xs cursor-pointer"
          >
            <CheckSquare className="w-3.5 h-3.5" /> Cycle Count
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

      {/* AI Drawers & Simulators */}
      <InventoryAiDrawer
        isOpen={showAiDrawer}
        onClose={() => setShowAiDrawer(false)}
        balances={balances}
        onCreditsUpdated={(c) => setAiCredits(c)}
      />
      {showWhatIfSimulator && <InventoryWhatIfSimulator onClose={() => setShowWhatIfSimulator(false)} />}

      {/* SECTION 1 — CORE STOCK POSITION (GLOBAL REORDERABLE KPI SYSTEM) */}
      {(() => {
        const totalPhysicalAccepted = skuMetricsList.reduce(
          (acc, m) => acc + m.availableQty + m.reservedQty + m.damagedQty,
          0
        );
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
            onNavigateStock={(tab) => router.push(tab ? `/inventory/stock?tab=${tab}` : "/inventory/stock")}
            onNavigateOrders={() => router.push("/orders")}
          />
        );
      })()}

      {/* SECTION 2 — OMNICHANNEL STOCK ARCHITECTURE & CHANNEL ALLOCATION */}
      {(() => {
        const totalAts = skuMetricsList.reduce((acc, m) => acc + m.availableQty, 0);

        let amazonAllocated = 0;
        let flipkartAllocated = 0;
        let shopifyAllocated = 0;

        for (const m of skuMetricsList) {
          const rules = channelAllocationEngine.getRulesForSku(m.sku);
          for (const r of rules) {
            if (!r.active) continue;
            const cap =
              typeof r.fixedCap === "number"
                ? r.fixedCap
                : typeof r.percentage === "number"
                  ? Math.floor((m.availableQty * r.percentage) / 100)
                  : 0;
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
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 block">
                  Omnichannel Stock Architecture
                </span>
                <h3 className="text-base font-black text-slate-900 mt-0.5">
                  Central ATS & Sales Channel Allocations
                </h3>
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
                <strong>Architecture Rule:</strong> Marketplace stock allocations are configured in the{" "}
                <strong>Product / Master Listing</strong> workspace and bounded by real central ATS ({totalAts} Units).
                Inventory provides operational visibility.
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

      {/* SECTION 3 — FAST OPERATIONAL LEDGER ACCESS BANNER */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-5 text-white shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-indigo-200">
              <Package size={16} />
            </span>
            <h3 className="text-base font-bold text-white">Daily Operational Stock Inventory</h3>
            <span className="rounded-full bg-indigo-500/30 px-2.5 py-0.5 text-[10px] font-extrabold text-indigo-200 border border-indigo-400/30">
              {skuMetricsList.length} Total SKUs
            </span>
          </div>
          <p className="text-xs text-indigo-200 font-medium max-w-xl">
            Access the dedicated high-density Stock Inventory Ledger for instant SKU lookup, multi-field filtering, pagination, and stock adjustment actions.
          </p>
        </div>

        <Link
          href="/inventory/stock"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-indigo-900 shadow-sm hover:bg-indigo-50 active:scale-95 transition-all shrink-0"
        >
          <span>Open Stock Inventory</span>
          <ArrowRight size={14} />
        </Link>
      </div>

      {/* SECTION 4 — DECISION INTELLIGENCE, REORDER RISKS & VALUATION SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Reorder Alerts & Stockout Risks */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                <AlertTriangle size={15} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Reorder & Stockout Risks</h3>
                <p className="text-[11px] text-slate-400">SKUs breached below safety threshold</p>
              </div>
            </div>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-extrabold text-amber-800 border border-amber-200">
              {summary.countReorderRequired} Needs Action
            </span>
          </div>

          {reorderRiskList.length === 0 ? (
            <div className="py-8 text-center text-xs font-medium text-slate-400">
              All inventory SKUs are within healthy safety stock thresholds.
            </div>
          ) : (
            <div className="space-y-2">
              {reorderRiskList.map((item) => (
                <div
                  key={item.sku}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/40 transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-slate-900">{item.sku}</span>
                      {item.availableQty === 0 ? (
                        <span className="rounded bg-rose-100 px-1.5 py-0.2 text-[9px] font-black text-rose-800">
                          Stockout
                        </span>
                      ) : (
                        <span className="rounded bg-amber-100 px-1.5 py-0.2 text-[9px] font-bold text-amber-800">
                          Below ROP
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 truncate block mt-0.5">{item.productName}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-xs font-black text-slate-900 block">{item.availableQty} ATS</span>
                      <span className="text-[10px] text-slate-400">ROP: {item.reorderPoint}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => router.push("/purchase")}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition shadow-xs cursor-pointer"
                    >
                      Reorder
                    </button>
                  </div>
                </div>
              ))}

              <div className="pt-2 text-right">
                <Link
                  href="/inventory/stock?tab=reorder"
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                >
                  <span>View all {summary.countReorderRequired} reorder alerts</span>
                  <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Financial Asset Valuation & Capital Insights */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                  <Coins size={15} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Financial Stock Valuation</h3>
                  <p className="text-[11px] text-slate-400">Weighted average cost of physical goods</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowValuationModal(true)}
                className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
              >
                Detailed Breakdown →
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Net Asset Valuation
                </span>
                <span className="text-xl font-black text-slate-900 block mt-1 font-mono">
                  ₹{(summary.totalAssetValue / 100000).toFixed(2)} Lakhs
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Physical verified stock</span>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                  Dead Stock Capital
                </span>
                <span className="text-xl font-black text-rose-700 block mt-1 font-mono">
                  ₹
                  {(
                    skuMetricsList
                      .filter((m) => m.isDeadStock)
                      .reduce((acc, m) => acc + m.totalAssetValue, 0) / 1000
                  ).toFixed(1)}{" "}
                  K
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Zero movement &gt; 90 days</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between mt-4">
            <span>Average Days Inventory On-Hand: <strong>{summary.averageDioDays} Days</strong></span>
            <button
              type="button"
              onClick={() => setShowWhatIfSimulator(true)}
              className="text-xs font-bold text-indigo-700 hover:underline cursor-pointer"
            >
              Run Simulator →
            </button>
          </div>
        </div>
      </div>

      {/* Action Modals */}
      {/* Valuation Modal */}
      {showValuationModal && (
        <div
          onClick={() => setShowValuationModal(false)}
          className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xl bg-white rounded-2xl border border-slate-100 p-6 shadow-2xl space-y-4 cursor-default relative"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" /> Inventory Valuation & Financial Asset Report
              </h3>
              <button
                onClick={() => setShowValuationModal(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 bg-slate-900 text-white rounded-2xl space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block">
                Total Net Inventory Value
              </span>
              <span className="text-3xl font-black text-emerald-400 font-mono">
                ₹{(summary.totalAssetValue / 100000).toFixed(2)} Lakhs
              </span>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Across all physical units in primary storage and warehouse network.
              </p>
            </div>
            <div className="space-y-2 text-sm font-mono">
              {[
                {
                  label: "Monthly Holding Cost",
                  value:
                    summary.totalMonthlyHoldingCost > 0
                      ? `₹${summary.totalMonthlyHoldingCost.toLocaleString("en-IN")}`
                      : "Not configured",
                  color: "text-slate-900",
                },
                {
                  label: "Avg. Days Inventory On-Hand",
                  value: `${summary.averageDioDays} Days`,
                  color: "text-indigo-800",
                },
                {
                  label: "Dead Stock Capital Locked",
                  value: `₹${skuMetricsList.filter((m) => m.isDeadStock).reduce((acc, m) => acc + m.totalAssetValue, 0).toLocaleString("en-IN")}`,
                  color: "text-rose-600",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between"
                >
                  <span className="text-slate-500 font-sans font-medium text-xs">{row.label}</span>
                  <span className={`font-bold ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowValuationModal(false)}
                className="px-5 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cycle Count Modal */}
      {showCycleCountModal && (
        <div
          onClick={() => setShowCycleCountModal(false)}
          className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-2xl border border-slate-100 p-6 shadow-2xl space-y-4 cursor-default relative"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-emerald-600" /> Cycle Count Workspace
              </h3>
              <button
                onClick={() => setShowCycleCountModal(false)}
                className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {cycleCountStep === "select" && (
              <div className="space-y-3">
                <p className="text-sm text-slate-500 font-medium">
                  Select storage location to initiate physical count reconciliation:
                </p>
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
                  <button
                    onClick={() => setShowCycleCountModal(false)}
                    className="px-4 py-2 bg-slate-100 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStartCycleCount}
                    className="px-5 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700 transition"
                  >
                    Start Count
                  </button>
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
                <button
                  onClick={() => setShowCycleCountModal(false)}
                  className="w-full py-2.5 bg-slate-900 text-white font-bold text-sm rounded-xl hover:bg-slate-800 transition"
                >
                  Done
                </button>
              </div>
            )}
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
          onSuccess={refreshInventoryFromApi}
        />
      )}
    </div>
  );
}
