"use client";

import { safeResponseJson } from "@/lib/api/client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Warehouse, Boxes, Truck, ShieldCheck, Sparkles, GripVertical } from "lucide-react";
import { getAiCreditsRemaining } from "@/lib/ai/credits";
import CreateStorageLocationModal from "./CreateStorageLocationModal";
import StorageEmptyState from "./StorageEmptyState";
import PendingReceiptsHeroSection from "./PendingReceiptsHeroSection";
import StorageLocationGrid from "./StorageLocationGrid";
import StorageTransfersSection, { type StorageTransferRecord } from "./StorageTransfersSection";
import StorageRecentActivity, { type ActivityEventItem } from "./StorageRecentActivity";
import StorageRightPanel from "./StorageRightPanel";

import type { StorageLocationCardData } from "./StorageLocationCard";
import ReceivingWorkspaceModal from "./modals/ReceivingWorkspaceModal";
import StorageAiDrawer from "./drawers/StorageAiDrawer";
import BillInspectorDrawer from "@/components/purchase/BillInspectorDrawer";
import type { PurchaseBill } from "@/lib/purchase/types";
import { receivingEngine, locationStockRepository } from "@/lib/storage/engine/receiving.engine";
import type { SecurityContext, StorageLocationType } from "@/lib/storage/domain/types";

const mockSecurity: SecurityContext = {
  tenantId: "tenant-default",
  organizationId: "org-commerceos",
  workspaceId: "ws-default",
  actorId: "usr-solo-founder",
  actorName: "Solo Founder",
};

import { useReorderableKpis } from "@/components/ui/kpi";

const STORAGE_LOCATIONS_KEY = "commerceos_storage_locations_v5";
const STORAGE_KPI_ORDER_KEY = "commerceos_storage_kpi_order_v1";

type StorageKpiKey = "facilities" | "units" | "inwarding" | "health" | "ai_advisor";
const defaultKpiOrder: StorageKpiKey[] = ["facilities", "units", "inwarding", "health", "ai_advisor"];

export default function StorageHomePageView() {
  const router = useRouter();
  const [locations, setLocations] = useState<StorageLocationCardData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [pendingBills, setPendingBills] = useState<PurchaseBill[]>([]);
  const [transfers] = useState<StorageTransferRecord[]>([]);
  const [activity, setActivity] = useState<ActivityEventItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
  const [receivingBill, setReceivingBill] = useState<PurchaseBill | null>(null);
  const [inspectingBill, setInspectingBill] = useState<PurchaseBill | null>(null);
  const [credits, setCredits] = useState(getAiCreditsRemaining());
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>("Live");

  // Global Reorderable KPI System integration
  const {
    order: kpiOrder,
    isReordered: isKpiReordered,
    resetOrder: resetKpiOrder,
    getCardDragProps,
  } = useReorderableKpis<StorageKpiKey>({
    storageKey: STORAGE_KPI_ORDER_KEY,
    defaultOrder: defaultKpiOrder,
  });

  const loadLocations = useCallback(async () => {
    try {
      const [locRes, stockRes] = await Promise.all([
        fetch("/api/v1/storage/locations"),
        fetch("/api/v1/storage/receipts"),
      ]);

      const locPayload = await safeResponseJson(locRes);
      const stockPayload = await safeResponseJson(stockRes);

      const items = Array.isArray(locPayload)
        ? locPayload
        : Array.isArray(locPayload?.data)
          ? locPayload.data
          : [];

      const allStocks: any[] = Array.isArray(stockPayload)
        ? stockPayload
        : Array.isArray(stockPayload?.data)
          ? stockPayload.data
          : [];

      const mapped: StorageLocationCardData[] = items.map((loc: any) => {
        const meta = loc.metadata && typeof loc.metadata === "object" ? loc.metadata : {};
        
        // Match storage stock records belonging to this location
        const locIdLower = String(loc.id || "").toLowerCase().trim();
        const matchedStocks = allStocks.filter(
          (s) => String(s.storageLocationId || "").toLowerCase().trim() === locIdLower
        );

        const dbUnits = matchedStocks.reduce((sum, s) => sum + (Number(s.availableQty) || 0), 0);
        const dbProducts = new Set(
          matchedStocks.filter((s) => (Number(s.availableQty) || 0) > 0).map((s) => s.sku)
        ).size;

        const totalAvailableUnits = dbUnits;
        const totalProductsCount = dbProducts;

        const isExternal = loc.type === "amazon_fba" || loc.type === "flipkart_fulfillment" || loc.type === "3pl" || loc.type === "transit";
        const scope = isExternal ? "external_fulfillment" : "internal";

        return {
          id: loc.id,
          name: loc.name || "Unnamed Facility",
          code: loc.code || `LOC-${loc.id.slice(0, 4).toUpperCase()}`,
          type: loc.type || "warehouse",
          typeLabel: loc.typeLabel || (loc.type ? loc.type.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()) : "Warehouse"),
          locationScope: scope,
          marketplaceProvider: loc.marketplace?.provider || meta.marketplace?.provider,
          connectionStatus: loc.marketplace?.connectionStatus || meta.marketplace?.connectionStatus || (isExternal ? "not_configured" : undefined),
          availableUnits: totalAvailableUnits,
          productsCount: totalProductsCount,
          inventoryValue: totalAvailableUnits * 350,
          healthStatus: isExternal && totalAvailableUnits === 0 ? "healthy" : totalAvailableUnits > 0 ? "healthy" : (loc.status === "active" ? "healthy" : "warning"),
          lastActivity: isExternal ? "Awaiting SP-API Sync" : totalAvailableUnits > 0 ? "Active stock" : "Ready",
          isDefault: Boolean(loc.isDefault),
          isArchived: Boolean(loc.isArchived || loc.status === "decommissioned"),
          retentionExpiresAt: loc.retentionExpiresAt,
          subLocationConfig: loc.subLocationConfig || meta.subLocationConfig || undefined,
          employees: loc.employees || meta.employees || undefined,
        };
      });

      setLocations(mapped);
    } catch {
      setLocations([]);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    void loadLocations();
  }, [loadLocations]);

  const refreshPendingBills = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/purchase/bills");
      const payload = await safeResponseJson(res);
      const serverBills: PurchaseBill[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

      const receivable = serverBills.filter((bill) =>
        receivingEngine.isBillEligibleForStorageReceiving(bill),
      );
      setPendingBills(receivable);
    } catch {
      setPendingBills([]);
    }
  }, []);

  // Sync Location balances when stock records change
  const updateLocationCardBalances = useCallback(async () => {
    try {
      const stockRes = await fetch("/api/v1/storage/receipts");
      const stockPayload = await safeResponseJson(stockRes);
      const allStocks: any[] = Array.isArray(stockPayload)
        ? stockPayload
        : Array.isArray(stockPayload?.data)
          ? stockPayload.data
          : [];

      setLocations((prev) => {
        const updated = prev.map((loc) => {
          const locIdLower = String(loc.id || "").toLowerCase().trim();
          const matchedStocks = allStocks.filter(
            (s) => String(s.storageLocationId || "").toLowerCase().trim() === locIdLower
          );

          const dbUnits = matchedStocks.reduce((sum, s) => sum + (Number(s.availableQty) || 0), 0);
          const dbProducts = new Set(
            matchedStocks.filter((s) => (Number(s.availableQty) || 0) > 0).map((s) => s.sku)
          ).size;

          const localUnits = locationStockRepository.getTotalUnitsForLocation(loc.id) || 0;
          const localProducts = locationStockRepository.getDistinctProductCountForLocation(loc.id) || 0;

          const totalAvailableUnits = Math.max(dbUnits, localUnits);
          const totalProductsCount = Math.max(dbProducts, localProducts);

          return {
            ...loc,
            availableUnits: totalAvailableUnits,
            productsCount: totalProductsCount,
            inventoryValue: totalAvailableUnits * 350,
            healthStatus: totalAvailableUnits > 0 ? "healthy" : loc.healthStatus,
            lastActivity: totalAvailableUnits > 0 ? "Active stock" : "Ready",
          };
        });
        return updated;
      });
    } catch {}
  }, []);

  const handleManualSync = useCallback(() => {
    setIsSyncing(true);
    void refreshPendingBills();
    void updateLocationCardBalances();
    setLastSyncedAt(
      "Synced " +
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
    );
    setTimeout(() => {
      setIsSyncing(false);
    }, 500);
  }, [refreshPendingBills, updateLocationCardBalances]);

  // Automatic Realtime Polling (Every 5 seconds)
  useEffect(() => {
    void refreshPendingBills();
    void updateLocationCardBalances();

    const intervalTimer = setInterval(() => {
      void refreshPendingBills();
      void updateLocationCardBalances();
      setLastSyncedAt(
        "Live " +
          new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
      );
    }, 5000);

    const handleStockUpdated = () => {
      void updateLocationCardBalances();
    };
    window.addEventListener("commerceos_stock_updated", handleStockUpdated);

    return () => {
      clearInterval(intervalTimer);
      window.removeEventListener("commerceos_stock_updated", handleStockUpdated);
    };
  }, [refreshPendingBills, updateLocationCardBalances]);

  const handleCardClick = (locationId: string) => {
    router.push(`/storage/${locationId}`);
  };

  const handleCreateLocation = async (data: {
    name: string;
    type: StorageLocationType;
    fcReferenceCode?: string;
    isDefault?: boolean;
    subLocationConfig?: {
      racks: number;
      shelves: number;
      binsPerShelf: number;
      totalBins: number;
    };
    employees?: Array<{
      id: string;
      name: string;
      designation: string;
      phone?: string;
    }>;
  }) => {
    const isFirst = locations.length === 0;
    const locationCode = data.fcReferenceCode
      ? `${data.type.slice(0, 3).toUpperCase()}-${data.fcReferenceCode}`
      : `LOC-${Date.now().toString().slice(-4)}`;

    try {
      const res = await fetch("/api/v1/storage/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          code: locationCode,
          type: data.type,
          isDefault: isFirst || Boolean(data.isDefault),
          metadata: {
            subLocationConfig: data.subLocationConfig,
            employees: data.employees,
          },
        }),
      });

      if (res.ok) {
        await loadLocations();
      }
    } catch (err) {
      console.error("Failed to create storage location:", err);
    }
  };

  const handleArchiveLocation = (locationId: string) => {
    setLocations((prev) => {
      const now = Date.now();
      const retentionExpiry = new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString();
      const next = prev.map((loc) => {
        if (loc.id === locationId) {
          return {
            ...loc,
            isArchived: true,
            archivedAt: new Date(now).toISOString(),
            retentionExpiresAt: retentionExpiry,
          };
        }
        return loc;
      });
      try {
        localStorage.setItem(STORAGE_LOCATIONS_KEY, JSON.stringify(next));
      } catch {
        // Ignore quota errors
      }
      return next;
    });
  };

  const handleRestoreLocation = (locationId: string) => {
    setLocations((prev) => {
      const next = prev.map((loc) => {
        if (loc.id === locationId) {
          return {
            ...loc,
            isArchived: false,
            archivedAt: undefined,
            retentionExpiresAt: undefined,
          };
        }
        return loc;
      });
      try {
        localStorage.setItem(STORAGE_LOCATIONS_KEY, JSON.stringify(next));
      } catch {
        // Ignore quota errors
      }
      return next;
    });
  };

  const handleSetDefaultLocation = async (locationId: string) => {
    // Optimistic UI update
    setLocations((prev) =>
      prev.map((loc) => ({
        ...loc,
        isDefault: loc.id === locationId,
      }))
    );

    try {
      const res = await fetch(`/api/v1/storage/locations/${locationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });

      if (res.ok) {
        await loadLocations();
      }
    } catch (err) {
      console.error("Failed to set default location:", err);
      await loadLocations();
    }
  };

  const handleReceivingComplete = (billNumber: string) => {
    refreshPendingBills();
    updateLocationCardBalances();

    // Log Activity
    const newActivity: ActivityEventItem = {
      id: `act-rec-${Date.now()}`,
      type: "purchase_received",
      description: `Completed receiving for Purchase Bill ${billNumber}`,
      locationName: "Storage Locations",
      timeAgo: "Just now",
    };

    setActivity((prev) => [newActivity, ...prev]);
  };

  const handleRunAnalysis = () => {
    if (credits > 0) {
      setCredits((prev) => prev - 1);
    }
  };

  const activeLocations = locations.filter((loc) => !loc.isArchived);
  const totalNetworkUnits = locations.reduce((sum, loc) => sum + (loc.availableUnits || 0), 0);
  const totalAllocatedSkus = locations.reduce((sum, loc) => sum + (loc.productsCount || 0), 0);
  const totalBinsCount = locations.reduce((sum, loc) => sum + (loc.subLocationConfig?.totalBins || 0), 0);
  const potentialSavings = totalNetworkUnits > 0 ? Math.round(totalNetworkUnits * 1.5) : 0;

  if (!isLoaded) return null;

  return (
    <div className="w-full px-6 py-6 font-sans space-y-6 animate-in fade-in duration-200">
      {locations.length === 0 ? (
        <StorageEmptyState onCreateLocation={() => setIsCreateModalOpen(true)} />
      ) : (
        <>
          {/* Executive KPI Overview Strip (5 Draggable & Reorderable Cards) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
                <GripVertical className="h-3.5 w-3.5 text-slate-400" />
                Warehouse KPI Overview <span className="text-[10px] font-normal text-slate-400">(Drag & drop to rearrange metrics)</span>
              </span>
              {isKpiReordered && (
                <button
                  type="button"
                  onClick={resetKpiOrder}
                  className="text-[10px] font-extrabold text-violet-600 hover:text-violet-800 transition-colors cursor-pointer"
                >
                  Reset Order
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
              {kpiOrder.map((kpiKey, index) => {
                const dragProps = getCardDragProps(index);
                const isDragging = dragProps.isDragging;
                const isOver = dragProps.isOver;

                if (kpiKey === "facilities") {
                  return (
                    <div
                      key="facilities"
                      {...dragProps}
                      className={`group relative flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-xs transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
                        isDragging
                          ? "opacity-40 scale-95 border-dashed border-violet-400"
                          : isOver
                            ? "border-violet-500 ring-2 ring-violet-200 scale-102 shadow-md bg-violet-50/20"
                            : "border-slate-200/80 hover:shadow-sm hover:border-slate-300"
                      }`}
                    >
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 pointer-events-none">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700 border border-violet-100">
                        <Warehouse className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-500">
                          Storage Facilities
                        </p>
                        <p className="truncate text-lg font-bold tracking-tight text-slate-900 mt-0.5">
                          {activeLocations.length} Active
                        </p>
                        <p className="truncate text-[11px] font-semibold text-slate-400 mt-0.5">
                          {totalBinsCount > 0 ? `${totalBinsCount} Physical Bins` : "Multi-node network"}
                        </p>
                      </div>
                    </div>
                  );
                }

                if (kpiKey === "units") {
                  return (
                    <div
                      key="units"
                      {...dragProps}
                      className={`group relative flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-xs transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
                        isDragging
                          ? "opacity-40 scale-95 border-dashed border-violet-400"
                          : isOver
                            ? "border-emerald-500 ring-2 ring-emerald-200 scale-102 shadow-md bg-emerald-50/20"
                            : "border-slate-200/80 hover:shadow-sm hover:border-slate-300"
                      }`}
                    >
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 pointer-events-none">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                        <Boxes className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-500">
                          Stored Units
                        </p>
                        <p className="truncate text-lg font-bold tracking-tight text-slate-900 mt-0.5">
                          {totalNetworkUnits.toLocaleString("en-IN")}
                        </p>
                        <p className="truncate text-[11px] font-semibold text-slate-400 mt-0.5">
                          Across {totalAllocatedSkus} active SKUs
                        </p>
                      </div>
                    </div>
                  );
                }

                if (kpiKey === "inwarding") {
                  return (
                    <div
                      key="inwarding"
                      {...dragProps}
                      className={`group relative flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-xs transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
                        isDragging
                          ? "opacity-40 scale-95 border-dashed border-violet-400"
                          : isOver
                            ? "border-amber-500 ring-2 ring-amber-200 scale-102 shadow-md bg-amber-50/20"
                            : "border-slate-200/80 hover:shadow-sm hover:border-slate-300"
                      }`}
                    >
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 pointer-events-none">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
                        <Truck className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-500">
                          Inwarding Pipeline
                        </p>
                        <p className="truncate text-lg font-bold tracking-tight text-slate-900 mt-0.5">
                          {pendingBills.length} Bills
                        </p>
                        <p className="truncate text-[11px] font-semibold text-slate-400 mt-0.5">
                          Pending bin inwarding
                        </p>
                      </div>
                    </div>
                  );
                }

                if (kpiKey === "health") {
                  return (
                    <div
                      key="health"
                      {...dragProps}
                      className={`group relative flex items-center gap-3 rounded-2xl border bg-white p-4 shadow-xs transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
                        isDragging
                          ? "opacity-40 scale-95 border-dashed border-violet-400"
                          : isOver
                            ? "border-indigo-500 ring-2 ring-indigo-200 scale-102 shadow-md bg-indigo-50/20"
                            : "border-slate-200/80 hover:shadow-sm hover:border-slate-300"
                      }`}
                    >
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 pointer-events-none">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <ShieldCheck className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-slate-500">
                          Facility Health
                        </p>
                        <p className="truncate text-lg font-bold tracking-tight text-emerald-600 mt-0.5">
                          100%
                        </p>
                        <p className="truncate text-[11px] font-semibold text-slate-400 mt-0.5">
                          Operational & Balanced
                        </p>
                      </div>
                    </div>
                  );
                }

                if (kpiKey === "ai_advisor") {
                  return (
                    <div
                      key="ai_advisor"
                      {...dragProps}
                      className={`group relative flex items-center gap-3 rounded-2xl border bg-white p-4 text-left shadow-xs transition-all duration-200 cursor-grab active:cursor-grabbing select-none ${
                        isDragging
                          ? "opacity-40 scale-95 border-dashed border-violet-400"
                          : isOver
                            ? "border-emerald-500 ring-2 ring-emerald-200 scale-102 shadow-md bg-emerald-50/20"
                            : "border-slate-200/80 hover:shadow-sm hover:border-emerald-300"
                      }`}
                    >
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 pointer-events-none">
                        <GripVertical className="h-4 w-4" />
                      </div>
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 group-hover:scale-105 transition-transform">
                        <Sparkles className="h-5 w-5" />
                      </span>
                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => setIsAiDrawerOpen(true)}
                      >
                        <p className="truncate text-xs font-semibold text-slate-500">
                          Storage AI Advisor
                        </p>
                        <p className="truncate text-lg font-bold tracking-tight text-slate-900 mt-0.5">
                          {credits} Credits
                        </p>
                        <p className="truncate text-[11px] font-semibold text-emerald-700 mt-0.5 group-hover:underline">
                          Ask AI Advisor →
                        </p>
                      </div>
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>

          {/* Section 1: Storage Locations Grid (Full Width) */}
          <StorageLocationGrid
            locations={locations}
            onCardClick={handleCardClick}
            onAddLocationClick={() => setIsCreateModalOpen(true)}
            onRestoreLocation={handleRestoreLocation}
            onSetDefaultLocation={handleSetDefaultLocation}
          />

          {/* Section 2: Pending Receipts Inwarding Queue (Full Width) */}
          <PendingReceiptsHeroSection
            pendingBills={pendingBills}
            onReceiveGoods={(bill) => setReceivingBill(bill)}
            onInspectBill={(bill) => setInspectingBill(bill)}
            onSync={handleManualSync}
            isSyncing={isSyncing}
            lastSyncedAt={lastSyncedAt}
          />

          {/* Section 3: Bottom Operations & Audit Grid */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Left: Stock Transfers (7 cols) */}
            <div className="lg:col-span-7">
              <StorageTransfersSection transfers={transfers} />
            </div>

            {/* Right: Storage Recent Activity (5 cols) */}
            <div className="lg:col-span-5">
              <StorageRecentActivity events={activity} />
            </div>
          </div>
        </>
      )}

      {/* Storage AI Advisor Copilot Drawer */}
      <StorageAiDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        locations={locations}
        pendingBills={pendingBills}
        onCreditsUpdated={(c) => setCredits(c)}
      />

      {/* Create Location Modal */}
      <CreateStorageLocationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateLocation}
      />

      {/* Receiving Workspace Modal */}
      <ReceivingWorkspaceModal
        isOpen={Boolean(receivingBill)}
        onClose={() => setReceivingBill(null)}
        bill={receivingBill}
        availableLocations={locations}
        securityContext={mockSecurity}
        onReceivingComplete={handleReceivingComplete}
      />

      {/* Bill Inspector Drawer */}
      <BillInspectorDrawer
        bill={inspectingBill}
        onClose={() => setInspectingBill(null)}
      />
    </div>
  );
}
