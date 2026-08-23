"use client";

import { safeResponseJson } from "@/lib/api/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { AnimatePresence } from "framer-motion";

import {
  consumeAiCredit,
  getAiCreditsRemaining,
  hasAiCredits,
} from "@/lib/ai/credits";
import { buildInventoryExcel } from "@/lib/inventory";
import type {
  AllocationHint,
  InventoryAlert,
  InventoryHealthRow,
  InventoryInsights,
  InventoryPlanRow,
  PurchaseSuggestion,
} from "@/lib/inventory/planning/types";
import type { StockBalance, StockMovement } from "@/lib/inventory/types";
import {
  DEFAULT_WAREHOUSE_ID,
  SECONDARY_WAREHOUSE_ID,
} from "@/lib/inventory/types";
import ProductPagination from "@/components/shared/pagination/ProductPagination";
import { useCapabilities } from "@/providers/ExperienceProvider";
import InventoryControlCenterView from "./InventoryControlCenterView";

import InventoryAdvisorPanel from "./InventoryAdvisorPanel";
import InventoryDataTable from "./InventoryDataTable";
import InventoryFilterBar from "./InventoryFilterBar";
import InventoryInspectorDrawer from "./InventoryInspectorDrawer";
import InventoryKPIGrid from "./InventoryKPIGrid";
import InventoryMarketplaceStrip from "./InventoryMarketplaceStrip";
import InventoryMorningSummary from "./InventoryMorningSummary";
import InventoryQuickActions from "./InventoryQuickActions";
import InventorySidePanel from "./InventorySidePanel";
import InventoryStatusTabs from "./InventoryStatusTabs";
import InventoryWarehouseSuggestions from "./InventoryWarehouseSuggestions";
import type { AiRecommendation } from "./inventory-advisor-report";
import {
  buildMarketplaceInventoryStrip,
  buildTodaysInventory,
  type InventoryFocusItem,
} from "./inventory-command";
import {
  buildHealthMap,
  matchesSearch,
  matchesTab,
  productAvailableMap,
  stockStatusForProduct,
  computeInventoryKpis,
  computeTabCounts,
  type InventoryTab,
  warehouseLabel,
} from "./inventory-ops";

const PAGE_SIZES = [10, 25, 50, 100];
type DialogMode = "adjust" | "reserve" | "transfer" | "bulk_adjust" | null;

export default function InventoryPage() {
  const router = useRouter();
  const globalCapabilities = useCapabilities();

  const capabilities = useMemo(
    () => ({
      inventory_forecast: globalCapabilities.canUseEnterpriseAI,
      multi_warehouse: globalCapabilities.canUseMultiWarehouse,
      marketplace_inventory: true,
      ai_inventory: globalCapabilities.canUseBasicAI,
      inventory_audit: globalCapabilities.canUseAuditLogs,
    }),
    [globalCapabilities],
  );
  const [balances, setBalances] = useState<StockBalance[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [plans, setPlans] = useState<InventoryPlanRow[]>([]);
  const [healthRows, setHealthRows] = useState<InventoryHealthRow[]>([]);
  const [alerts, setAlerts] = useState<InventoryAlert[]>([]);
  const [insights, setInsights] = useState<InventoryInsights | null>(null);
  const [suggestions, setSuggestions] = useState<PurchaseSuggestion[]>([]);
  const [allocationHints, setAllocationHints] = useState<AllocationHint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [aiCredits, setAiCredits] = useState(25);

  const [tab, setTab] = useState<InventoryTab>("total_skus");
  const [search, setSearch] = useState("");
  const [warehouse, setWarehouse] = useState("all");
  const [stockStatus, setStockStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<StockBalance | null>(null);

  const [dialog, setDialog] = useState<DialogMode>(null);
  const [dialogRow, setDialogRow] = useState<StockBalance | null>(null);
  const [quantity, setQuantity] = useState("10");
  const [reason, setReason] = useState("Manual adjustment");
  const [toWarehouse, setToWarehouse] = useState(SECONDARY_WAREHOUSE_ID);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stockRes, planRes, healthRes, insightsRes] = await Promise.all([
        fetch("/api/v1/inventory"),
        fetch("/api/v1/inventory/planning"),
        fetch("/api/v1/inventory/health"),
        fetch("/api/v1/inventory/insights"),
      ]);
      const [stockPayload, planPayload, healthPayload, insightsPayload] =
        await Promise.all([
          safeResponseJson(stockRes),
          safeResponseJson(planRes),
          safeResponseJson(healthRes),
          safeResponseJson(insightsRes),
        ]);
      if (!stockPayload.data) {
        throw new Error("Failed to load inventory data.");
      }

      setBalances(stockPayload.data.balances as StockBalance[]);
      setMovements(stockPayload.data.movements as StockMovement[]);
      setDetail((current) =>
        current
          ? ((stockPayload.data.balances as StockBalance[]).find(
              (row) => row.id === current.id,
            ) ?? null)
          : null,
      );

      if (planRes.ok && planPayload.success) {
        setPlans(planPayload.data.plans);
        setSuggestions(planPayload.data.suggestions);
        setAllocationHints(planPayload.data.allocationHints);
      }
      if (healthRes.ok && healthPayload.success) {
        setHealthRows(healthPayload.data.rows);
        setAlerts(healthPayload.data.alerts);
      }
      if (insightsRes.ok && insightsPayload.success) {
        setInsights(insightsPayload.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setAiCredits(getAiCreditsRemaining());
  }, []);

  useEffect(() => {
    if (!dialog) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDialog(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialog]);

  const healthByProduct = useMemo(
    () => buildHealthMap(healthRows, plans),
    [healthRows, plans],
  );

  const focusItems = useMemo(
    () =>
      buildTodaysInventory({
        plans,
        alerts,
        balances,
        allocationHints,
        suggestions,
      }),
    [plans, alerts, balances, allocationHints, suggestions],
  );

  const marketplaceChannels = useMemo(
    () =>
      capabilities.marketplace_inventory
        ? buildMarketplaceInventoryStrip(plans, balances)
        : [],
    [capabilities.marketplace_inventory, plans, balances],
  );

  const activeFilterCount = [
    search.trim() ? 1 : 0,
    warehouse !== "all" ? 1 : 0,
    stockStatus !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const availableByProduct = useMemo(
    () => productAvailableMap(balances),
    [balances],
  );

  const visible = useMemo(() => {
    return balances.filter((row) => {
      if (!matchesSearch(row, search)) return false;
      if (warehouse !== "all" && row.warehouseId !== warehouse) return false;
      if (!matchesTab(row, tab, healthByProduct, availableByProduct)) {
        return false;
      }
      if (stockStatus !== "all") {
        const available = availableByProduct.get(row.productId) ?? row.available;
        if (
          stockStatusForProduct(row.productId, available, healthByProduct) !==
          stockStatus
        ) {
          return false;
        }
      }
      return true;
    });
  }, [
    balances,
    search,
    warehouse,
    tab,
    stockStatus,
    healthByProduct,
    availableByProduct,
  ]);

  const totalItems = visible.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return visible.slice(start, start + pageSize);
  }, [visible, safePage, pageSize]);

  const kpis = useMemo(
    () => computeInventoryKpis(balances, healthByProduct),
    [balances, healthByProduct],
  );
  const tabCounts = useMemo(
    () => computeTabCounts(balances, healthByProduct),
    [balances, healthByProduct],
  );

  /** Only warehouses present in stock balances — matches KPI count. */
  const warehouseOptions = useMemo(() => {
    const ids = Array.from(new Set(balances.map((row) => row.warehouseId)));
    return ids
      .map((id) => ({ value: id, label: warehouseLabel(id) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [balances]);

  useEffect(() => {
    if (warehouse === "all") return;
    if (!warehouseOptions.some((opt) => opt.value === warehouse)) {
      setWarehouse("all");
    }
  }, [warehouse, warehouseOptions]);

  useEffect(() => {
    setPage(1);
  }, [search, warehouse, stockStatus, tab, pageSize]);

  const clearFilters = () => {
    setSearch("");
    setWarehouse("all");
    setStockStatus("all");
    setTab("total_skus");
  };

  const toggle = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (ids: string[]) => {
    setSelectedIds((current) => {
      const allSelected = ids.every((id) => current.has(id));
      const next = new Set(current);
      if (allSelected) for (const id of ids) next.delete(id);
      else for (const id of ids) next.add(id);
      return next;
    });
  };

  const exportExcel = (scope: "visible" | "selected" = "visible") => {
    const rows =
      scope === "selected"
        ? balances.filter((row) => selectedIds.has(row.id))
        : visible;
    if (rows.length === 0) {
      setMessage(
        scope === "selected"
          ? "Select inventory rows first to export."
          : "No inventory rows to export.",
      );
      return;
    }
    const excel = buildInventoryExcel(rows);
    const blob = new Blob([excel.body], { type: excel.contentType });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement("a");
    anchor.href = url;
    anchor.download = excel.filename;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(`Exported ${rows.length} inventory row(s) to Excel.`);
  };

  const openDialog = (mode: DialogMode, row?: StockBalance) => {
    setDialog(mode);
    setDialogRow(row ?? null);
    setQuantity(mode === "adjust" || mode === "bulk_adjust" ? "10" : "1");
    setReason(
      mode === "transfer"
        ? "Warehouse transfer"
        : mode === "reserve"
          ? "Manual reserve"
          : "Manual adjustment",
    );
    if (row) {
      setToWarehouse(
        row.warehouseId === DEFAULT_WAREHOUSE_ID
          ? SECONDARY_WAREHOUSE_ID
          : DEFAULT_WAREHOUSE_ID,
      );
    }
  };

  const runAdjust = async (input: {
    productId: string;
    warehouseId: string;
    delta: number;
    reason: string;
  }) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await safeResponseJson(response);
      setMessage("Stock adjusted.");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Adjust failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const runReserve = async (input: {
    productId: string;
    warehouseId: string;
    quantity: number;
    reference: string;
  }) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/inventory/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await safeResponseJson(response);
      setMessage("Stock reserved.");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Reserve failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const runRelease = async (reservationId: string) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/inventory/reserve/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservationId }),
      });
      const payload = await safeResponseJson(response);
      setMessage("Reservation released.");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Release failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const runTransfer = async (input: {
    productId: string;
    fromWarehouseId: string;
    toWarehouseId: string;
    quantity: number;
    reason: string;
  }) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/v1/inventory/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await safeResponseJson(response);
      setMessage("Stock transferred.");
      await load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Transfer failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const submitDialog = async () => {
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty === 0) {
      setMessage("Enter a non-zero quantity.");
      return;
    }

    if (dialog === "bulk_adjust") {
      const ids = Array.from(selectedIds);
      if (ids.length === 0) {
        setMessage("Select rows first.");
        return;
      }
      setSubmitting(true);
      let ok = 0;
      let failed = 0;
      for (const id of ids) {
        const row = balances.find((item) => item.id === id);
        if (!row) {
          failed += 1;
          continue;
        }
        try {
          const response = await fetch("/api/v1/inventory/adjust", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              productId: row.productId,
              warehouseId: row.warehouseId,
              delta: qty,
              reason,
            }),
          });
          const payload = await safeResponseJson(response);
          if (!response.ok || !payload.success) failed += 1;
          else ok += 1;
        } catch {
          failed += 1;
        }
      }
      setSubmitting(false);
      setDialog(null);
      setSelectedIds(new Set());
      setMessage(`Bulk adjust: ${ok} ok, ${failed} failed.`);
      await load();
      return;
    }

    if (!dialogRow) return;

    if (dialog === "adjust") {
      await runAdjust({
        productId: dialogRow.productId,
        warehouseId: dialogRow.warehouseId,
        delta: qty,
        reason,
      });
    } else if (dialog === "reserve") {
      if (qty < 1) {
        setMessage("Reserve quantity must be positive.");
        return;
      }
      await runReserve({
        productId: dialogRow.productId,
        warehouseId: dialogRow.warehouseId,
        quantity: qty,
        reference: reason,
      });
    } else if (dialog === "transfer") {
      if (qty < 1) {
        setMessage("Transfer quantity must be positive.");
        return;
      }
      await runTransfer({
        productId: dialogRow.productId,
        fromWarehouseId: dialogRow.warehouseId,
        toWarehouseId: toWarehouse,
        quantity: qty,
        reason,
      });
    }
    setDialog(null);
  };

  const applyHint = async (hint: AllocationHint) => {
    await runTransfer({
      productId: hint.productId,
      fromWarehouseId: hint.fromWarehouseId,
      toWarehouseId: hint.toWarehouseId,
      quantity: hint.quantity,
      reason: hint.reason,
    });
  };

  const spendAiCredit = () => {
    if (!hasAiCredits()) {
      setMessage("Not enough AI credits for Inventory Advisor actions.");
      setAiCredits(getAiCreditsRemaining());
      return false;
    }
    const remaining = consumeAiCredit(1);
    if (remaining === null) {
      setMessage("Not enough AI credits for Inventory Advisor actions.");
      setAiCredits(getAiCreditsRemaining());
      return false;
    }
    setAiCredits(remaining);
    return true;
  };

  const openProduct = (productId?: string) => {
    if (!productId) return;
    const row = balances.find((b) => b.productId === productId) ?? null;
    if (row) setDetail(row);
  };

  const handleFocusNavigate = (key: InventoryFocusItem["onNavigateKey"]) => {
    if (key === "low_stock") setTab("low_stock");
    else if (key === "out_of_stock") setTab("out_of_stock");
    else if (key === "purchase") router.push("/purchase");
    else if (key === "damaged") {
      setStockStatus("all");
      setTab("damaged");
    } else if (key === "transfer") {
      setMessage("Review warehouse suggestions below.");
    } else setTab("total_skus");
  };

  const runPrimaryCta = () => {
    if (focusItems.some((item) => item.tone === "rose")) {
      setTab("out_of_stock");
      return;
    }
    if (allocationHints.length > 0 && capabilities.multi_warehouse) {
      setMessage("Review warehouse suggestions below.");
      return;
    }
    const first = balances[0];
    if (first) openDialog("adjust", first);
    else setMessage("No stock rows available.");
  };

  const primaryLabel = focusItems.some((item) => item.tone === "rose")
    ? "Review stock-out risks"
    : allocationHints.length > 0 && capabilities.multi_warehouse
      ? "Review transfers"
      : "Add stock adjustment";

  const handleAdvisorRecommendation = (rec: AiRecommendation) => {
    if (rec.kind === "reorder" || rec.kind === "stop_buy") {
      router.push("/purchase");
      setMessage(
        `Advisor: ${rec.action} ${rec.quantityLabel} for “${rec.entity}” — review in Purchase (no auto-buy).`,
      );
      return;
    }
    if (rec.kind === "transfer" && rec.hint) {
      setMessage(
        `Advisor transfer suggestion: review warehouse move for “${rec.entity}”.`,
      );
      void applyHint(rec.hint);
      return;
    }
    openProduct(rec.productId);
  };

  return (
    <div className="space-y-6">
      <InventoryControlCenterView />
    </div>
  );
}
