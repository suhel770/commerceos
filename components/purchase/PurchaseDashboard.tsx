"use client";

import { safeFetchJson, safeResponseJson } from "@/lib/api/client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, AlertTriangle, Filter, X } from "lucide-react";

import DashboardCard from "@/components/dashboard/DashboardCard";

import CommerceDateRangePicker from "@/components/ui/CommerceDateRangePicker";
import { useCapabilities } from "@/providers/ExperienceProvider";
import {
  consumeAiCredit,
  getAiCreditsRemaining,
  hasAiCredits,
} from "@/lib/ai/credits";
import {
  PURCHASE_TYPE_LABELS,
  aggregatePurchaseStockBySku,
  buildProcurementInsights,
  buildPurchaseBillsExcel,
  formatPurchaseMoney,
  isExpensePathType,
  isStockPathType,
  type CreatePurchaseBillInput,
  type CreatePurchaseOrderInput,
  type CreateVendorInput,
  type PaymentMethod,
  type ProcurementInsight,
  type PurchaseBill,
  type PurchaseStatus,
  type PurchaseType,
  type Vendor,
  type VendorWithStats,
} from "@/lib/purchase";

import BillInspectorDrawer from "./BillInspectorDrawer";
import EditPurchaseBillDialog from "./EditPurchaseBillDialog";
import ImportPurchasesDialog from "./ImportPurchasesDialog";
import NewPurchaseBillDialog from "./NewPurchaseBillDialog";
import NewPurchaseOrderDialog from "./NewPurchaseOrderDialog";
import NewVendorDialog from "./NewVendorDialog";
import PurchaseAiDrawer from "./drawers/PurchaseAiDrawer";
import ProcurementInsightsCard from "./ProcurementInsightsCard";
import PurchaseCategoryChart from "./PurchaseCategoryChart";
import PurchaseDataTable from "./PurchaseDataTable";
import PurchaseFiltersDrawer from "./PurchaseFiltersDrawer";
import PurchaseMorningSummary from "./PurchaseMorningSummary";
import PurchaseOpsCards, { buildDefaultOpsCards } from "./PurchaseOpsCards";
import PurchaseOpsWidgets from "./PurchaseOpsWidgets";
import PurchaseQuickActions from "./PurchaseQuickActions";
import PurchaseTrendChart from "./PurchaseTrendChart";
import ReceiveGoodsDialog from "./ReceiveGoodsDialog";
import RecordPaymentDialog from "./RecordPaymentDialog";
import VendorInspectorDrawer from "./VendorInspectorDrawer";
import {
  DEFAULT_PURCHASE_CAPABILITIES,
  EMPTY_PURCHASE_DASHBOARD_FILTERS,
  buildBusinessActivity,
  buildOpsTasks,
  buildProcurementAlerts,
  buildPurchaseHealth,
  buildTodayFocusItems,
  countActivePurchaseFilters,
  countDuplicateInvoiceSuspects,
  isPurchaseBillOverdue,
  matchesDashboardFilters,
  parsePurchaseTab,
  paymentsDueToday,
  vendorsMissingGstin,
  waitingReceivingBills,
  type OpsTask,
  type ProcurementAlert,
  type PurchaseDashboardFilters,
  type PurchaseTab,
  type TodayFocusItem,
} from "./purchase-ops";

type DialogMode =
  | "bill"
  | "po"
  | "vendor"
  | "payment"
  | "receive"
  | "import"
  | null;

function toInputDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function PurchaseDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const tabFromUrl = parsePurchaseTab(searchParams.get("tab"));
  const [tab, setTab] = useState<PurchaseTab>(tabFromUrl);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [vendors, setVendors] = useState<VendorWithStats[]>([]);
  const [bills, setBills] = useState<PurchaseBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [billType, setBillType] =
    useState<PurchaseType>("inventory_product");
  const [billIntent, setBillIntent] = useState<"create" | "upload">("create");
  const [returnToBill, setReturnToBill] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null);
  const [editingBill, setEditingBill] = useState<PurchaseBill | null>(null);
  const [selectedVendor, setSelectedVendor] =
    useState<VendorWithStats | null>(null);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiCredits, setAiCredits] = useState(221);

  useEffect(() => {
    setAiCredits(getAiCreditsRemaining());
  }, []);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] =
    useState<PurchaseDashboardFilters>(EMPTY_PURCHASE_DASHBOARD_FILTERS);
  const [draftFilters, setDraftFilters] =
    useState<PurchaseDashboardFilters>(EMPTY_PURCHASE_DASHBOARD_FILTERS);
  const [reorderCount, setReorderCount] = useState(0);
  const [dismissedAlertIds, setDismissedAlertIds] = useState<Set<string>>(
    () => new Set(),
  );
  const globalCaps = useCapabilities();
  const capabilities = useMemo(
    () => ({
      inventory: true,
      warehouseReceiving: globalCaps.canUseWarehouse || globalCaps.canUsePutaway,
      autoReceive: !globalCaps.canUseWarehouse,
      multiWarehouse: globalCaps.canUseMultiWarehouse,
      finance: true,
      vendorAnalytics: globalCaps.canUseVendorAnalytics,
      aiProcurement: globalCaps.canUseBasicAI,
    }),
    [globalCaps],
  );

  useEffect(() => {
    setAiCredits(getAiCreditsRemaining());
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCopilotOpen(false);
        setFiltersOpen(false);
        setDialog(null);
        setSelectedBill(null);
        setEditingBill(null);
        setSelectedVendor(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!capabilities.inventory) return;
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/v1/inventory/insights");
        const payload = await safeResponseJson(response);
        if (cancelled) return;
        const data = payload.data as {
          lowStockCount?: number;
          stockOutRiskCount?: number;
        };
        setReorderCount(
          (data.lowStockCount ?? 0) + (data.stockOutRiskCount ?? 0),
        );
      } catch {
        // Soft-fail: reorder card stays at 0 when Inventory insights unavailable.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [capabilities.inventory]);

  useEffect(() => {
    setTab(tabFromUrl);
  }, [tabFromUrl]);

  const setActiveTab = useCallback(
    (next: PurchaseTab) => {
      setTab(next);
      const params = new URLSearchParams(searchParams.toString());
      if (next === "all") params.delete("tab");
      else params.set("tab", next);
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    },
    [pathname, router, searchParams],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vendorsPayload, billsPayload] = await Promise.all([
        safeFetchJson<{ success: boolean; data: VendorWithStats[] }>(
          "/api/v1/purchase/vendors",
        ).catch((err) => {
          console.warn("[PurchaseDashboard] load vendors warning:", err);
          return { success: true, data: [] as VendorWithStats[] };
        }),
        safeFetchJson<{ success: boolean; data: PurchaseBill[] }>(
          "/api/v1/purchase/bills",
        ).catch((err) => {
          console.warn("[PurchaseDashboard] load bills warning:", err);
          return { success: true, data: [] as PurchaseBill[] };
        }),
      ]);
      setVendors((vendorsPayload?.data as VendorWithStats[]) || []);
      setBills((billsPayload?.data as PurchaseBill[]) || []);
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("commerceos_purchase_bills_v1");
        } catch {}
      }
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Failed to load purchase workspace.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const dateScopedBills = useMemo(() => {
    return bills.filter((bill) => {
      if (dateFrom && bill.billDate < dateFrom) return false;
      if (dateTo && bill.billDate > dateTo) return false;
      return true;
    });
  }, [bills, dateFrom, dateTo]);

  const filteredBills = useMemo(() => {
    return dateScopedBills.filter((bill) =>
      matchesDashboardFilters(bill, appliedFilters),
    );
  }, [dateScopedBills, appliedFilters]);

  const activeFilterCount = countActivePurchaseFilters(appliedFilters);

  const openFilters = () => {
    setDraftFilters(appliedFilters);
    setFiltersOpen(true);
  };

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    setDraftFilters(EMPTY_PURCHASE_DASHBOARD_FILTERS);
    setAppliedFilters(EMPTY_PURCHASE_DASHBOARD_FILTERS);
    setFiltersOpen(false);
  };

  const inventoryTotal = useMemo(
    () =>
      filteredBills
        .filter((bill) => isStockPathType(bill.purchaseType))
        .reduce((sum, bill) => sum + bill.totalAmount, 0),
    [filteredBills],
  );
  const expenseTotal = useMemo(
    () =>
      filteredBills
        .filter((bill) => isExpensePathType(bill.purchaseType))
        .reduce((sum, bill) => sum + bill.totalAmount, 0),
    [filteredBills],
  );
  const assetTotal = useMemo(
    () =>
      filteredBills
        .filter((bill) => bill.purchaseType === "asset")
        .reduce((sum, bill) => sum + bill.totalAmount, 0),
    [filteredBills],
  );
  const total = inventoryTotal + expenseTotal + assetTotal;

  const pendingBills = useMemo(
    () =>
      filteredBills.filter(
        (bill) =>
          bill.paymentStatus !== "paid" &&
          bill.status !== "void" &&
          bill.status !== "draft",
      ),
    [filteredBills],
  );
  const pendingAmount = pendingBills.reduce(
    (sum, bill) => sum + bill.totalAmount,
    0,
  );
  const overdueBills = pendingBills.filter((bill) =>
    isPurchaseBillOverdue(bill),
  );
  const outstandingVendors = vendors.filter(
    (vendor) => vendor.outstandingBalance > 0,
  ).length;

  const categorySlices = useMemo(() => {
    const byType = new Map<PurchaseType, number>();
    for (const bill of filteredBills) {
      byType.set(
        bill.purchaseType,
        (byType.get(bill.purchaseType) ?? 0) + bill.totalAmount,
      );
    }
    const colors: Record<PurchaseType, string> = {
      inventory_product: "#7c3aed",
      packaging_material: "#3b82f6",
      office_expense: "#f59e0b",
      asset: "#10b981",
      marketing: "#d946ef",
      software: "#06b6d4",
      courier: "#14b8a6",
      rent: "#84cc16",
      utilities: "#eab308",
      service: "#f97316",
      travel: "#f43f5e",
      professional_fees: "#8b5cf6",
      other: "#94a3b8",
    };
    const raw = Array.from(byType.entries())
      .map(([type, amount]) => ({
        label: PURCHASE_TYPE_LABELS[type],
        amount,
        color: colors[type],
      }))
      .filter((row) => row.amount > 0);
    const denom = raw.reduce((sum, row) => sum + row.amount, 0) || 1;
    return raw.map((row) => ({
      ...row,
      pct: Math.round((row.amount / denom) * 100),
    }));
  }, [filteredBills]);

  const trendData = useMemo(() => {
    const buckets = new Map<string, number>();
    for (const bill of filteredBills) {
      const key = bill.billDate.slice(5);
      buckets.set(key, (buckets.get(key) ?? 0) + bill.totalAmount);
    }
    if (buckets.size === 0) {
      return [
        { label: "W1", amount: 0 },
        { label: "W2", amount: 0 },
        { label: "W3", amount: 0 },
        { label: "W4", amount: 0 },
      ];
    }
    return Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([label, amount]) => ({ label, amount }));
  }, [filteredBills]);

  const topVendors = useMemo(() => {
    return [...vendors]
      .map((vendor) => {
        const spend = filteredBills
          .filter(
            (bill) =>
              bill.vendorId === vendor.id && bill.status !== "void",
          )
          .reduce((sum, bill) => sum + bill.totalAmount, 0);
        return { id: vendor.id, name: vendor.name, amount: spend };
      })
      .filter((row) => row.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredBills, vendors]);

  const upcomingPayments = useMemo(
    () =>
      [...pendingBills]
        .filter((bill) => bill.dueDate)
        .sort((a, b) => (a.dueDate ?? "").localeCompare(b.dueDate ?? ""))
        .slice(0, 5)
        .map((bill) => ({
          id: bill.id,
          billId: bill.id,
          label: bill.vendorName,
          dueDate: bill.dueDate!,
          amount: bill.totalAmount,
          overdue: isPurchaseBillOverdue(bill),
        })),
    [pendingBills],
  );

  const paidCount = useMemo(
    () =>
      filteredBills.filter(
        (bill) =>
          bill.status !== "void" &&
          bill.status !== "draft" &&
          bill.paymentStatus === "paid",
      ).length,
    [filteredBills],
  );

  const gstIssueVendors = useMemo(
    () => vendorsMissingGstin(vendors),
    [vendors],
  );
  const duplicateInvoices = useMemo(
    () => countDuplicateInvoiceSuspects(filteredBills),
    [filteredBills],
  );
  const dueToday = useMemo(
    () => paymentsDueToday(filteredBills),
    [filteredBills],
  );
  const receivingQueue = useMemo(
    () => waitingReceivingBills(filteredBills),
    [filteredBills],
  );
  const packagingPendingCount = useMemo(
    () =>
      pendingBills.filter((bill) => bill.purchaseType === "packaging_material")
        .length,
    [pendingBills],
  );
  const inventoryPendingCount = useMemo(
    () =>
      pendingBills.filter((bill) => bill.purchaseType === "inventory_product")
        .length,
    [pendingBills],
  );

  const openBill = useCallback(
    (
      type: PurchaseType = "inventory_product",
      intent: "create" | "upload" = "create",
    ) => {
      setBillType(type);
      setBillIntent(intent);
      setDialog("bill");
    },
    [],
  );

  const recordPayment = useCallback(
    async (input: {
      billId: string;
      paymentMethod: PaymentMethod;
      paymentId?: string;
      amount: number;
      paymentDate: string;
    }) => {
      setSubmitting(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/v1/purchase/bills/${input.billId}/payment`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paymentMethod: input.paymentMethod,
              paymentId: input.paymentId,
              amount: input.amount,
              paymentDate: input.paymentDate,
            }),
          },
        );
        const payload = await safeResponseJson(response);
        const bill = payload.data as PurchaseBill;
        await load();
        setDialog(null);
        const paidLabel = formatPurchaseMoney(input.amount);
        setMessage(
          bill.paymentStatus === "partial"
            ? `Partial payment of ${paidLabel} recorded for ${bill.billNumber}.`
            : bill.paymentId
              ? `Payment of ${paidLabel} recorded for ${bill.billNumber} (${bill.paymentId}).`
              : `Payment of ${paidLabel} recorded for ${bill.billNumber}.`,
        );
        return true;
      } catch (paymentError) {
        setError(
          paymentError instanceof Error
            ? paymentError.message
            : "Failed to record payment.",
        );
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [load],
  );

  const receiveGoods = useCallback(
    async (billId: string) => {
      setSubmitting(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/v1/purchase/bills/${billId}/receive`,
          { method: "POST" },
        );
        const payload = await safeResponseJson(response);
        const bill = payload.data as PurchaseBill;
        await load();
        setDialog(null);
        setMessage(`Goods received for ${bill.billNumber}.`);
        return true;
      } catch (receiveError) {
        setError(
          receiveError instanceof Error
            ? receiveError.message
            : "Failed to receive goods.",
        );
        return false;
      } finally {
        setSubmitting(false);
      }
    },
    [load],
  );

  const onImportSuccess = useCallback(
    async (count: number) => {
      setSubmitting(true);
      setError(null);
      try {
        await load();
        setDialog(null);
        setMessage(`Imported ${count} purchase${count === 1 ? "" : "s"} successfully.`);
      } catch (err) {
        setError("Failed to load dashboard after import.");
      } finally {
        setSubmitting(false);
      }
    },
    [load],
  );

  const navigateOps = useCallback(
    (
      key:
        | TodayFocusItem["onNavigateKey"]
        | OpsTask["onNavigateKey"]
        | NonNullable<ProcurementAlert["navigateKey"]>,
    ) => {
      switch (key) {
        case "stock":
          router.push("/inventory");
          return;
        case "vendors":
          router.push("/purchase/vendors");
          return;
        case "overdue":
          setAppliedFilters((prev) => ({ ...prev, overdueOnly: true }));
          setActiveTab("pending");
          return;
        case "inventory_tab":
          setActiveTab("inventory");
          return;
        case "packaging_tab":
          setAppliedFilters((prev) => ({
            ...prev,
            purchaseTypes: ["packaging_material"],
          }));
          setActiveTab("inventory");
          return;
        case "receiving":
          setMessage(
            capabilities.warehouseReceiving
              ? "Showing ordered stock purchases waiting for receiving."
              : "Receiving opens when warehouse receiving is enabled.",
          );
          setActiveTab("inventory");
          return;
        case "pending":
        default:
          setActiveTab("pending");
      }
    },
    [capabilities.warehouseReceiving, router, setActiveTab],
  );

  const focusItems = useMemo(
    () =>
      buildTodayFocusItems({
        capabilities,
        reorderCount,
        pendingBillsCount: pendingBills.length,
        overdueCount: overdueBills.length,
        paymentsDueTodayCount: dueToday.length,
        vendorIssuesCount: gstIssueVendors.length,
        waitingReceivingCount: receivingQueue.length,
      }),
    [
      capabilities,
      dueToday.length,
      gstIssueVendors.length,
      overdueBills.length,
      pendingBills.length,
      receivingQueue.length,
      reorderCount,
    ],
  );

  const todayTasks = useMemo(
    () =>
      buildOpsTasks({
        capabilities,
        reorderCount,
        overdueCount: overdueBills.length,
        pendingBillsCount: pendingBills.length,
        vendorGstMissingCount: gstIssueVendors.length,
        packagingPendingCount,
        waitingReceivingCount: receivingQueue.length,
        inventoryPendingCount,
      }),
    [
      capabilities,
      gstIssueVendors.length,
      inventoryPendingCount,
      overdueBills.length,
      packagingPendingCount,
      pendingBills.length,
      receivingQueue.length,
      reorderCount,
    ],
  );

  const health = useMemo(
    () =>
      buildPurchaseHealth({
        paidCount,
        pendingCount: pendingBills.length,
        overdueCount: overdueBills.length,
        vendorGstMissingCount: gstIssueVendors.length,
        duplicateInvoiceCount: duplicateInvoices.count,
      }),
    [
      duplicateInvoices.count,
      gstIssueVendors.length,
      overdueBills.length,
      paidCount,
      pendingBills.length,
    ],
  );

  const alerts = useMemo(
    () =>
      buildProcurementAlerts({
        capabilities,
        reorderCount,
        overdueBills,
        duplicateInvoiceBills: duplicateInvoices.bills,
        gstIssueVendors,
      }),
    [
      capabilities,
      duplicateInvoices.bills,
      gstIssueVendors,
      overdueBills,
      reorderCount,
    ],
  );

  const activity = useMemo(
    () =>
      buildBusinessActivity({
        bills: filteredBills,
        vendors,
        capabilities,
      }),
    [capabilities, filteredBills, vendors],
  );

  const primaryCta = useMemo(() => {
    if (overdueBills.length > 0) {
      return {
        label: `Review ${overdueBills.length} overdue payment${overdueBills.length === 1 ? "" : "s"}`,
        run: () => navigateOps("overdue"),
      };
    }
    if (capabilities.inventory && reorderCount > 0) {
      return {
        label: `Reorder ${reorderCount} product${reorderCount === 1 ? "" : "s"} needing stock`,
        run: () => navigateOps("stock"),
      };
    }
    if (pendingBills.length > 0) {
      return {
        label: `Open ${pendingBills.length} pending bill${pendingBills.length === 1 ? "" : "s"}`,
        run: () => navigateOps("pending"),
      };
    }
    return {
      label: "Log a new purchase to keep spend tracked",
      run: () => openBill("inventory_product"),
    };
  }, [
    capabilities.inventory,
    navigateOps,
    openBill,
    overdueBills.length,
    pendingBills.length,
    reorderCount,
  ]);

  const opsCards = useMemo(
    () =>
      buildDefaultOpsCards({
        capabilities,
        reorderCount,
        pendingBillsCount: pendingBills.length,
        pendingAmount,
        incomingCount: bills.filter(
          (b) => b.status === "ordered" || b.status === "partially_received",
        ).length,
        outstandingVendors,
        alertCount: alerts.filter((row) => !dismissedAlertIds.has(row.id))
          .length,
        onReorder: () => navigateOps("stock"),
        onPending: () => navigateOps("pending"),
        onIncoming: () => setDialog("receive"),
        onVendors: () => navigateOps("vendors"),
        onAlerts: () => {
          const el = document.getElementById("spend-insights-section");
          if (el) el.scrollIntoView({ behavior: "smooth" });
          else navigateOps("pending");
        },
        onAiAdvisor: () => {
          setCopilotOpen(true);
        },
      }),
    [
      alerts,
      bills,
      capabilities,
      dismissedAlertIds,
      navigateOps,
      pendingAmount,
      pendingBills.length,
      reorderCount,
      outstandingVendors,
    ],
  );

  const handleInsightView = useCallback(
    (insight: ProcurementInsight) => {
      const href = insight.action?.href ?? "/purchase/bills";
      if (href.startsWith("/purchase/vendors")) {
        router.push("/purchase/vendors");
        return;
      }
      if (href.startsWith("/inventory") || href.startsWith("/purchase/stock")) {
        router.push("/inventory");
        return;
      }
      if (href.startsWith("/purchase/bills")) {
        router.push("/purchase/bills");
        return;
      }
      router.push("/purchase/bills");
    },
    [router],
  );

  const openBillById = useCallback(
    (billId: string) => {
      const bill = bills.find((row) => row.id === billId) ?? null;
      if (bill) setSelectedBill(bill);
    },
    [bills],
  );

  const openVendorById = useCallback(
    (vendorId: string) => {
      const vendor = vendors.find((row) => row.id === vendorId) ?? null;
      if (vendor) setSelectedVendor(vendor);
      else router.push("/purchase/vendors");
    },
    [router, vendors],
  );

  const spendAiCredit = () => {
    if (!hasAiCredits()) {
      setMessage("Not enough AI credits. Add credits before using CommerceOS AI.");
      setAiCredits(getAiCreditsRemaining());
      return false;
    }
    const remaining = consumeAiCredit(1);
    if (remaining === null) {
      setMessage("Not enough AI credits. Add credits before using CommerceOS AI.");
      setAiCredits(getAiCreditsRemaining());
      return false;
    }
    setAiCredits(remaining);
    return true;
  };

  const handleInsightAct = (insight: ProcurementInsight) => {
    const kind = insight.action?.kind;
    if (kind === "new_purchase") {
      setBillType("inventory_product");
      setBillIntent("create");
      setDialog("bill");
      setMessage(
        `AI suggested a plan for “${insight.entity}” — review before saving.`,
      );
      return;
    }
    if (kind === "stocks") {
      router.push("/inventory");
      return;
    }
    if (kind === "vendors") {
      router.push("/purchase/vendors");
      return;
    }
    if (kind === "bills") {
      router.push("/purchase/bills");
      return;
    }
    router.push("/purchase/bills");
  };

  const exportRows = (rows: PurchaseBill[]) => {
    if (rows.length === 0) {
      setMessage("No purchases to export.");
      return;
    }
    const excel = buildPurchaseBillsExcel(filteredBills);
    const blob = new Blob([excel.body as any], { type: excel.contentType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = excel.filename;
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage(`Exported ${rows.length} purchase(s).`);
  };

  const createVendor = async (input: CreateVendorInput) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/purchase/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await safeResponseJson(response);
      await load();
      setMessage(`Vendor “${(payload.data as Vendor).name}” created.`);
      return payload.data as Vendor;
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Failed to create vendor.",
      );
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const createBill = async (input: CreatePurchaseBillInput) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/purchase/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await safeResponseJson(response);
      const bill = payload.data as PurchaseBill;
      await load();
      setMessage(`Bill ${bill.billNumber} saved.`);
      if (isExpensePathType(bill.purchaseType)) setActiveTab("expenses");
      else if (bill.purchaseType === "asset") setActiveTab("assets");
      else setActiveTab("all");
      return bill;
    } catch (createError) {
      const msg =
        createError instanceof Error
          ? createError.message
          : "Failed to save purchase bill.";
      setError(msg);
      throw createError;
    } finally {
      setSubmitting(false);
    }
  };

  const createPO = async (input: CreatePurchaseOrderInput) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/purchase/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const payload = await safeResponseJson(response);
      const po = payload.data;
      await load();
      setMessage(`Purchase Order ${po.poNumber} saved.`);
      setDialog(null);
      return po;
    } catch (createError) {
      const msg =
        createError instanceof Error
          ? createError.message
          : "Failed to save Purchase Order.";
      setError(msg);
      throw createError;
    } finally {
      setSubmitting(false);
    }
  };

  const onDeleteBill = async (billId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/purchase/bills/${billId}`, {
        method: "DELETE",
      });
      const payload = await safeResponseJson(response);
      await load();
      setSelectedBill(null);
      setMessage("Purchase bill moved to Trash (30 days retention).");
    } catch (err: any) {
      setError(err?.message || "Failed to delete bill.");
    } finally {
      setSubmitting(false);
    }
  };

  const onRestoreBill = async (billId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/purchase/bills/${billId}/restore`, {
        method: "POST",
      });
      const payload = await safeResponseJson(response);
      await load();
      setMessage("Purchase bill restored from trash.");
    } catch (err: any) {
      setError(err?.message || "Failed to restore bill.");
    } finally {
      setSubmitting(false);
    }
  };

  const onPermanentDeleteBill = async (billId: string) => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/purchase/bills/${billId}?permanent=true`, {
        method: "DELETE",
      });
      const payload = await safeResponseJson(response);
      await load();
      setSelectedBill(null);
      setMessage("Purchase bill permanently deleted.");
    } catch (err: any) {
      setError(err?.message || "Failed to delete bill.");
    } finally {
      setSubmitting(false);
    }
  };

  const onUpdateBill = async (
    billId: string,
    patch: Partial<PurchaseBill>,
  ): Promise<boolean> => {
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/v1/purchase/bills/${billId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = await safeResponseJson(response);
      await load();
      setEditingBill(null);
      setMessage("Purchase bill updated successfully.");
      return true;
    } catch (err: any) {
      setError(err?.message || "Failed to update bill.");
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const transitionBill = async (billId: string, status: PurchaseStatus) => {
    setError(null);
    try {
      const response = await fetch(
        `/api/v1/purchase/bills/${billId}/transition`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const payload = await safeResponseJson(response);
      const bill = payload.data as PurchaseBill;
      setBills((prev) =>
        prev.map((row) => (row.id === bill.id ? bill : row)),
      );
      setMessage(`${bill.billNumber} → ${bill.status}`);
      await load();
    } catch (transitionError) {
      setError(
        transitionError instanceof Error
          ? transitionError.message
          : "Failed to update status.",
      );
    }
  };

  const bulkVoid = async (ids: string[]) => {
    if (ids.length === 0) {
      throw new Error("Select at least one bill first.");
    }
    const voidable = ids.filter((id) => {
      const bill = bills.find((row) => row.id === id);
      return Boolean(bill && bill.status !== "void" && bill.status !== "completed");
    });
    if (voidable.length === 0) {
      throw new Error(
        "Selected bills are already completed or void — nothing to void.",
      );
    }
    for (const id of voidable) {
      await transitionBill(id, "void");
    }
    setMessage(`Voided ${voidable.length} purchase${voidable.length === 1 ? "" : "s"}.`);
  };

  return (
    <div className="mx-auto max-w-[1700px] space-y-4 px-6 pb-10 pt-4">
      <header className="space-y-1">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold tracking-tight text-slate-900">
              Purchase Dashboard
            </h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Procurement command center — decide what to do next.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <CommerceDateRangePicker
              from={dateFrom}
              to={dateTo}
              onChange={(from, to) => {
                setDateFrom(from);
                setDateTo(to);
              }}
              className="w-[200px]"
            />
            <button
              type="button"
              onClick={openFilters}
              className={`inline-flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm font-semibold shadow-sm transition ${
                activeFilterCount > 0
                  ? "border-violet-200 bg-violet-50 text-violet-800 hover:bg-violet-100"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Filter size={15} />
              Filters
              {activeFilterCount > 0 ? (
                <span className="rounded-md bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p>{error}</p>
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss">
            <X size={16} />
          </button>
        </div>
      ) : null}

      {message ? (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          <p>{message}</p>
          <button
            type="button"
            onClick={() => setMessage(null)}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
        </div>
      ) : null}

      <PurchaseMorningSummary
        focusItems={focusItems}
        loading={loading}
        primaryLabel={primaryCta.label}
        onPrimaryAction={primaryCta.run}
        onFocusNavigate={navigateOps}
      />

      <PurchaseQuickActions
        onNewPurchase={() => openBill("inventory_product", "create")}
        onUploadBill={() => openBill("inventory_product", "upload")}
        onRecordPayment={() => setDialog("payment")}
        onReceiveGoods={() => setDialog("receive")}
        onImportPurchases={() => setDialog("import")}
      />

      <PurchaseOpsCards cards={opsCards} loading={loading} />

      <PurchaseOpsWidgets
        capabilities={capabilities}
        todayTasks={todayTasks}
        upcoming={upcomingPayments}
        activity={activity}
        healthScore={health.score}
        healthReasons={health.reasons}
        onTaskNavigate={navigateOps}
        onOpenBill={openBillById}
        onOpenVendor={openVendorById}
        onOpenPending={() => navigateOps("pending")}
      />



      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-slate-900">
            Spend insights
          </h2>
          <p className="text-xs text-slate-500">
            Compact analytics — category, trend, vendors, and alerts.
          </p>
        </div>
        <div className="grid items-stretch gap-3 xl:grid-cols-3">
          <PurchaseCategoryChart
            slices={categorySlices}
            total={total}
            compact
            onSelectCategory={(type, label) => {
              if (!type) return;
              setAppliedFilters((prev) => ({
                ...prev,
                purchaseTypes: [type],
              }));
              if (label) setMessage(`Filtered table for: ${label}`);
              const tableEl = document.getElementById("purchase-data-table");
              tableEl?.scrollIntoView({ behavior: "smooth" });
            }}
          />
          <PurchaseTrendChart data={trendData} compact />
          <div className="flex h-full min-w-0 flex-col gap-3">
            {capabilities.vendorAnalytics ? (
              <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
                <header className="border-b border-slate-100 px-4 py-2.5">
                  <h3 className="text-sm font-semibold tracking-tight text-slate-900">
                    Top Vendors
                  </h3>
                </header>
                <div className="space-y-1 p-2.5">
                  {topVendors.length === 0 ? (
                    <p className="px-2 py-4 text-center text-xs text-slate-500">
                      No vendor spend in this range.
                    </p>
                  ) : (
                    topVendors.map((vendor, index) => (
                      <button
                        key={vendor.id}
                        type="button"
                        onClick={() => {
                          const full = vendors.find(
                            (row) => row.id === vendor.id,
                          );
                          if (full) setSelectedVendor(full);
                          else router.push("/purchase/vendors");
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg bg-slate-50 px-3 py-1.5 text-left hover:bg-slate-100"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-violet-100 text-[10px] font-bold text-violet-700">
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-900">
                          {vendor.name}
                        </span>
                        <span className="shrink-0 text-xs font-bold text-slate-900">
                          {formatPurchaseMoney(vendor.amount)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            ) : null}
            <DashboardCard
              className="flex h-full flex-col min-w-0"
              title="Procurement Alerts"
              contentClassName="flex flex-1 flex-col p-3.5"
            >
              {alerts.filter((alert) => !dismissedAlertIds.has(alert.id)).length === 0 ? (
                <div className="flex flex-1 items-center justify-center p-4 text-center">
                  <p className="text-xs font-semibold text-emerald-700">
                    ✨ No active alerts — procurement looks clear.
                  </p>
                </div>
              ) : (
                <ul className="flex-1 max-h-[380px] space-y-2 overflow-y-auto custom-scrollbar pr-1">
                  {alerts
                    .filter((alert) => !dismissedAlertIds.has(alert.id))
                    .map((alert) => {
                      const isCritical = alert.severity === "critical";
                      const isWarn = alert.severity === "warn";
                      return (
                        <li
                          key={alert.id}
                          className={`rounded-xl border p-2 transition-all shadow-xs ${
                            isCritical
                              ? "border-rose-200/90 bg-rose-50/70"
                              : isWarn
                                ? "border-amber-200/90 bg-amber-50/70"
                                : "border-slate-200/90 bg-slate-50/70"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={`mt-0.5 shrink-0 rounded-md p-1 ${
                                isCritical
                                  ? "bg-rose-100 text-rose-700"
                                  : isWarn
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {isCritical ? (
                                <AlertTriangle size={13} />
                              ) : (
                                <AlertCircle size={13} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold leading-snug text-slate-900">
                                {alert.title}
                              </p>
                              <p className="mt-0.5 text-[11px] text-slate-600 font-mono">
                                {alert.detail}
                              </p>
                            </div>
                          </div>
                          <div className="mt-1.5 flex items-center justify-end gap-1.5 border-t border-slate-200/60 pt-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (alert.billId) openBillById(alert.billId);
                                else if (alert.vendorId)
                                  openVendorById(alert.vendorId);
                                else if (alert.navigateKey)
                                  navigateOps(alert.navigateKey);
                              }}
                              className="rounded-lg bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 hover:text-violet-700"
                            >
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (alert.billId) openBillById(alert.billId);
                                else if (alert.vendorId)
                                  openVendorById(alert.vendorId);
                                else if (alert.navigateKey)
                                  navigateOps(alert.navigateKey);
                              }}
                              className="rounded-lg bg-violet-600 px-2.5 py-1 text-[10px] font-bold text-white hover:bg-violet-700"
                            >
                              Resolve
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDismissedAlertIds((prev) =>
                                  new Set(prev).add(alert.id),
                                )
                              }
                              className="rounded-lg px-2 py-1 text-[10px] font-semibold text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            >
                              Dismiss
                            </button>
                          </div>
                        </li>
                      );
                    })}
                </ul>
              )}
            </DashboardCard>
          </div>
        </div>
      </section>

      <section>
        <PurchaseDataTable
          tab={tab}
          bills={filteredBills}
          vendors={vendors}
          capabilities={capabilities}
          showPaymentDetails
          onTabChange={setActiveTab}
          onNewBill={() => openBill("inventory_product")}
          onSelectVendor={setSelectedVendor}
          onViewBill={setSelectedBill}
          onEditBill={(bill) => setEditingBill(bill)}
          onDeleteBill={onDeleteBill}
          onRestoreBill={onRestoreBill}
          onPermanentDeleteBill={onPermanentDeleteBill}
          onPayBill={(bill) => {
            setSelectedBill(bill);
            setDialog("payment");
          }}
          onExport={exportRows}
          onTransition={transitionBill}
          onBulkVoid={bulkVoid}
        />
      </section>

      <PurchaseFiltersDrawer
        open={filtersOpen}
        draft={draftFilters}
        dateScopedBills={dateScopedBills}
        vendors={vendors}
        onDraftChange={setDraftFilters}
        onApply={applyFilters}
        onClear={clearFilters}
        onClose={() => setFiltersOpen(false)}
      />

      <NewPurchaseBillDialog
        open={dialog === "bill"}
        submitting={submitting}
        vendors={vendors}
        initialType={billType}
        intent={billIntent}
        onClose={() => {
          setDialog(null);
          setBillIntent("create");
          setReturnToBill(false);
        }}
        onCreateVendor={() => {
          setReturnToBill(true);
          setDialog("vendor");
        }}
        onSwitchToPO={() => setDialog("po")}
        onCreate={createBill}
        onSpendAiCredit={spendAiCredit}
        aiCreditsRemaining={aiCredits}
      />

      <NewPurchaseOrderDialog
        open={dialog === "po"}
        submitting={submitting}
        vendors={vendors}
        initialType={billType}
        onClose={() => setDialog(null)}
        onCreateVendor={() => {
          setReturnToBill(true);
          setDialog("vendor");
        }}
        onSwitchToDirectBill={() => setDialog("bill")}
        onCreatePO={createPO}
      />

      <NewVendorDialog
        open={dialog === "vendor"}
        submitting={submitting}
        onClose={() => {
          const reopenBill = returnToBill;
          setReturnToBill(false);
          setDialog(reopenBill ? "bill" : null);
        }}
        onCreate={createVendor}
      />

      <RecordPaymentDialog
        open={dialog === "payment"}
        submitting={submitting}
        bills={bills}
        onClose={() => setDialog(null)}
        onRecord={recordPayment}
      />

      <ReceiveGoodsDialog
        open={dialog === "receive"}
        submitting={submitting}
        bills={bills}
        onClose={() => setDialog(null)}
        onReceive={receiveGoods}
      />

      <ImportPurchasesDialog
        open={dialog === "import"}
        submitting={submitting}
        vendors={vendors}
        onClose={() => setDialog(null)}
        onImportSuccess={onImportSuccess}
      />

      <BillInspectorDrawer
        bill={selectedBill}
        vendor={
          selectedBill
            ? vendors.find((row) => row.id === selectedBill.vendorId) ?? null
            : null
        }
        onClose={() => setSelectedBill(null)}
        onEditBill={(bill) => setEditingBill(bill)}
        onDeleteBill={onDeleteBill}
      />

      <EditPurchaseBillDialog
        open={Boolean(editingBill)}
        submitting={submitting}
        bill={editingBill}
        vendors={vendors}
        onClose={() => setEditingBill(null)}
        onUpdate={onUpdateBill}
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

      <PurchaseAiDrawer
        isOpen={copilotOpen}
        onClose={() => setCopilotOpen(false)}
        bills={filteredBills}
        onCreditsUpdated={setAiCredits}
      />
    </div>
  );
}
