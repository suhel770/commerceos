import type {
  PaymentStatus,
  PurchaseBill,
  PurchaseStatus,
  PurchaseType,
  VendorWithStats,
} from "@/lib/purchase";
import {
  isExpensePathType,
  isStockPathType,
  vendorRequiresGstin,
} from "@/lib/purchase";

export type PurchaseTab =
  | "all"
  | "po"
  | "inventory"
  | "expenses"
  | "assets"
  | "pending"
  | "completed"
  | "deleted"
  | "vendors";

export const PURCHASE_TABS: Array<[PurchaseTab, string]> = [
  ["all", "All Purchases"],
  ["inventory", "Inventory"],
  ["expenses", "Expenses"],
  ["assets", "Assets"],
  ["pending", "Pending"],
  ["completed", "Completed"],
  ["po", "Purchase Orders (PO)"],
  ["deleted", "Trash (30 Days)"],
];

export function parsePurchaseTab(value: string | null | undefined): PurchaseTab {
  if (value === "vendors") return "vendors";
  if (value === "po" || value === "orders") return "po";
  // Legacy URL aliases
  if (value === "bills") return "pending";
  if (
    value === "orders" ||
    value === "receiving" ||
    value === "purchases" ||
    value === "overview"
  ) {
    return value === "orders" || value === "receiving" ? "inventory" : "all";
  }
  const match = PURCHASE_TABS.find(([id]) => id === value);
  return match?.[0] ?? "all";
}

export function paymentLabel(status: PaymentStatus): string {
  switch (status) {
    case "paid":
      return "Paid";
    case "partial":
      return "Partially Paid";
    case "unpaid":
      return "Pending";
    default:
      return String(status ?? "Pending");
  }
}

export function workflowLabel(status: PurchaseStatus): string {
  switch (status) {
    case "draft":
      return "Draft";
    case "ordered":
      return "Ordered";
    case "received":
      return "Received";
    case "partially_received":
      return "Partially Received";
    case "qc":
      return "QC";
    case "completed":
      return "Completed";
    case "void":
      return "Void";
    default:
      return String(status ?? "Draft");
  }
}

export function matchesTab(bill: PurchaseBill, tab: PurchaseTab): boolean {
  if (tab === "deleted") {
    return Boolean(bill.isDeleted);
  }
  if (bill.isDeleted) {
    return false;
  }
  if (tab === "all" || tab === "vendors") return true;
  if (tab === "po") {
    return (
      bill.status === "ordered" ||
      bill.status === "draft" ||
      bill.billNumber.toUpperCase().startsWith("PO") ||
      Boolean(bill.poNumber)
    );
  }
  if (tab === "inventory") return isStockPathType(bill.purchaseType);
  if (tab === "expenses") return isExpensePathType(bill.purchaseType);
  if (tab === "assets") return bill.purchaseType === "asset";
  if (tab === "pending") {
    return (
      bill.status !== "void" &&
      bill.status !== "draft" &&
      bill.paymentStatus !== "paid"
    );
  }
  if (tab === "completed") {
    return bill.status === "completed";
  }
  return true;
}

const TYPE_BADGE: Record<PurchaseType, string> = {
  inventory_product: "bg-blue-50 text-blue-700",
  packaging_material: "bg-indigo-50 text-indigo-700",
  office_expense: "bg-orange-50 text-orange-700",
  asset: "bg-sky-50 text-sky-700",
  marketing: "bg-fuchsia-50 text-fuchsia-700",
  software: "bg-cyan-50 text-cyan-700",
  courier: "bg-teal-50 text-teal-700",
  rent: "bg-lime-50 text-lime-800",
  utilities: "bg-yellow-50 text-yellow-800",
  service: "bg-amber-50 text-amber-700",
  travel: "bg-rose-50 text-rose-700",
  professional_fees: "bg-violet-50 text-violet-700",
  other: "bg-slate-100 text-slate-700",
};

/** Short labels for dense tables (single-line badges). */
export const PURCHASE_TYPE_SHORT_LABELS: Record<PurchaseType, string> = {
  inventory_product: "Inventory",
  packaging_material: "Packaging",
  office_expense: "Office",
  asset: "Asset",
  marketing: "Marketing",
  software: "Software",
  courier: "Courier",
  rent: "Rent",
  utilities: "Utilities",
  service: "Service",
  travel: "Travel",
  professional_fees: "Pro fees",
  other: "Other",
};

export function typeBadgeClass(type: PurchaseType): string {
  return TYPE_BADGE[type];
}

/**
 * Capability keys for adaptive Purchase UI.
 * One dashboard shell — widgets mount/unmount from these flags.
 * No separate Starter/Growth/Enterprise dashboards.
 */
export type PurchaseCapabilities = {
  /** Low stock, reorder, inventory impact */
  inventory: boolean;
  /** Receiving queue, GRN, QC, Waiting for Receiving */
  warehouseReceiving: boolean;
  /**
   * When receiving is off, Level-1 can auto-apply stock path on complete.
   * Drives Business / Inventory Impact copy from the workflow, not hard stubs.
   */
  autoReceive: boolean;
  multiWarehouse: boolean;
  /** Payables, cash outflow, upcoming payments, outstanding vendors */
  finance: boolean;
  /** Vendor intelligence / outstanding vendor cards */
  vendorAnalytics: boolean;
  /** Optional AI recommendation strip */
  aiProcurement: boolean;
};

export const DEFAULT_PURCHASE_CAPABILITIES: PurchaseCapabilities = {
  inventory: true,
  warehouseReceiving: false,
  autoReceive: true,
  multiWarehouse: false,
  finance: true,
  vendorAnalytics: true,
  aiProcurement: true,
};

export type PurchaseNextAction = {
  label: string;
  tone: "neutral" | "warn" | "ok" | "violet";
};

export type InventoryImpact = {
  label: string;
  tone: "neutral" | "warn" | "ok" | "violet" | "slate";
};

/** Contextual next action — adapts to receiving capability. */
export function nextPurchaseAction(
  bill: PurchaseBill,
  capabilities: PurchaseCapabilities = DEFAULT_PURCHASE_CAPABILITIES,
): PurchaseNextAction {
  if (bill.status === "void") {
    return { label: "Void", tone: "neutral" };
  }
  if (bill.status === "draft") {
    return { label: "Finish draft", tone: "warn" };
  }
  if (bill.paymentStatus === "unpaid" || bill.paymentStatus === "partial") {
    return { label: "Payment pending", tone: "warn" };
  }
  if (bill.purchaseType === "asset") {
    if (bill.status === "completed") {
      return { label: "Add to Asset Register", tone: "violet" };
    }
    return { label: "Complete asset purchase", tone: "neutral" };
  }
  if (isExpensePathType(bill.purchaseType)) {
    if (bill.status === "completed" || bill.paymentStatus === "paid") {
      return { label: "Completed", tone: "ok" };
    }
    return { label: "Expense logged", tone: "ok" };
  }
  if (isStockPathType(bill.purchaseType)) {
    if (
      capabilities.warehouseReceiving &&
      (bill.status === "ordered" || bill.status === "received" || bill.status === "qc")
    ) {
      if (bill.status === "qc") return { label: "QC review", tone: "warn" };
      if (bill.status === "received") return { label: "Put away stock", tone: "warn" };
      return { label: "Waiting for Receiving", tone: "warn" };
    }
    if (bill.purchaseType === "packaging_material") {
      return { label: "Ready for Inventory", tone: "violet" };
    }
    if (bill.status === "completed" && bill.paymentStatus === "paid") {
      return { label: "Done", tone: "ok" };
    }
    return { label: "Record next purchase", tone: "violet" };
  }
  if (bill.status === "completed" && bill.paymentStatus === "paid") {
    return { label: "Done", tone: "ok" };
  }
  return { label: "Review", tone: "neutral" };
}

/**
 * Inventory Impact — derived from workflow capabilities (receiving / auto-receive),
 * not hardcoded seller-plan copy.
 */
export function inventoryImpact(
  bill: PurchaseBill,
  capabilities: PurchaseCapabilities = DEFAULT_PURCHASE_CAPABILITIES,
): InventoryImpact {
  if (!capabilities.inventory) {
    return { label: "—", tone: "slate" };
  }
  if (bill.status === "void") {
    return { label: "No Inventory Impact", tone: "slate" };
  }
  if (!isStockPathType(bill.purchaseType)) {
    return { label: "No Inventory Impact", tone: "slate" };
  }
  if (capabilities.warehouseReceiving) {
    if (bill.status === "ordered") {
      return { label: "Waiting for Receiving", tone: "warn" };
    }
    if (bill.status === "received" || bill.status === "qc") {
      return { label: "Inbound — put away", tone: "warn" };
    }
  }
  if (
    capabilities.autoReceive ||
    !capabilities.warehouseReceiving ||
    bill.status === "completed"
  ) {
    return { label: "Stock Added", tone: "ok" };
  }
  return { label: "Inventory pending", tone: "violet" };
}

/**
 * Business Impact — seller-friendly outcome after save / workflow step.
 * Complements Inventory Impact with plane-specific language.
 */
export function businessImpact(
  bill: PurchaseBill,
  capabilities: PurchaseCapabilities = DEFAULT_PURCHASE_CAPABILITIES,
): InventoryImpact {
  if (bill.status === "void") {
    return { label: "No impact", tone: "slate" };
  }

  switch (bill.purchaseType) {
    case "inventory_product": {
      if (capabilities.warehouseReceiving && bill.status === "ordered") {
        return { label: "Waiting for Receiving", tone: "warn" };
      }
      if (
        capabilities.autoReceive ||
        !capabilities.warehouseReceiving ||
        bill.status === "completed"
      ) {
        return { label: "Increases Available Stock", tone: "ok" };
      }
      return { label: "Stock path pending", tone: "violet" };
    }
    case "packaging_material": {
      if (capabilities.warehouseReceiving && bill.status === "ordered") {
        return { label: "Waiting for Receiving", tone: "warn" };
      }
      return { label: "Packaging Inventory Updated", tone: "violet" };
    }
    case "asset":
      return { label: "Added to Asset Register", tone: "violet" };
    case "marketing":
      return { label: "Expense Recorded", tone: "ok" };
    case "courier":
      return { label: "Wallet Recharge", tone: "ok" };
    case "software":
      return { label: "Subscription Expense", tone: "ok" };
    case "office_expense":
    case "rent":
    case "utilities":
    case "service":
    case "travel":
    case "professional_fees":
    case "other":
      return { label: "Expense Recorded", tone: "ok" };
    default:
      return { label: "Recorded", tone: "neutral" };
  }
}

export type TodayFocusItem = {
  id: string;
  label: string;
  tone: "rose" | "amber" | "orange" | "violet" | "slate";
  capability?: keyof PurchaseCapabilities;
  onNavigateKey:
    | "stock"
    | "pending"
    | "overdue"
    | "vendors"
    | "inventory_tab"
    | "receiving";
};

export function buildTodayFocusItems(input: {
  capabilities: PurchaseCapabilities;
  reorderCount: number;
  pendingBillsCount: number;
  overdueCount: number;
  paymentsDueTodayCount: number;
  vendorIssuesCount: number;
  waitingReceivingCount: number;
}): TodayFocusItem[] {
  const items: TodayFocusItem[] = [];
  if (input.capabilities.inventory && input.reorderCount > 0) {
    items.push({
      id: "reorder",
      label: `${input.reorderCount} product${input.reorderCount === 1 ? "" : "s"} requiring purchase`,
      tone: "rose",
      capability: "inventory",
      onNavigateKey: "stock",
    });
  }
  if (input.capabilities.finance && input.paymentsDueTodayCount > 0) {
    items.push({
      id: "due-today",
      label: `${input.paymentsDueTodayCount} payment${input.paymentsDueTodayCount === 1 ? "" : "s"} due today`,
      tone: "orange",
      capability: "finance",
      onNavigateKey: "pending",
    });
  }
  if (input.capabilities.warehouseReceiving && input.waitingReceivingCount > 0) {
    items.push({
      id: "deliveries",
      label: `${input.waitingReceivingCount} vendor deliver${input.waitingReceivingCount === 1 ? "y" : "ies"} expected`,
      tone: "violet",
      capability: "warehouseReceiving",
      onNavigateKey: "receiving",
    });
  }
  if (input.pendingBillsCount > 0) {
    items.push({
      id: "bills-action",
      label: `${input.pendingBillsCount} bill${input.pendingBillsCount === 1 ? "" : "s"} waiting for action`,
      tone: "amber",
      onNavigateKey: "pending",
    });
  }
  if (input.capabilities.vendorAnalytics && input.vendorIssuesCount > 0) {
    items.push({
      id: "vendor-issues",
      label: `${input.vendorIssuesCount} vendor issue${input.vendorIssuesCount === 1 ? "" : "s"} (GST / profile)`,
      tone: "orange",
      capability: "vendorAnalytics",
      onNavigateKey: "vendors",
    });
  }
  if (input.capabilities.inventory && input.reorderCount > 0) {
    items.push({
      id: "inv-rec",
      label: "Inventory purchase recommendations ready",
      tone: "violet",
      capability: "inventory",
      onNavigateKey: "stock",
    });
  }
  if (input.capabilities.finance && input.overdueCount > 0) {
    items.push({
      id: "overdue",
      label: `${input.overdueCount} overdue payable${input.overdueCount === 1 ? "" : "s"}`,
      tone: "rose",
      capability: "finance",
      onNavigateKey: "overdue",
    });
  }
  return items.slice(0, 6);
}

export type OpsTask = {
  id: string;
  label: string;
  onNavigateKey:
    | "stock"
    | "pending"
    | "overdue"
    | "vendors"
    | "inventory_tab"
    | "packaging_tab"
    | "receiving";
};

export function buildOpsTasks(input: {
  capabilities: PurchaseCapabilities;
  reorderCount: number;
  overdueCount: number;
  pendingBillsCount: number;
  vendorGstMissingCount: number;
  packagingPendingCount: number;
  waitingReceivingCount: number;
  inventoryPendingCount: number;
}): OpsTask[] {
  const tasks: OpsTask[] = [];
  if (input.capabilities.inventory && input.reorderCount > 0) {
    tasks.push({
      id: "reorder",
      label: `${input.reorderCount} products need reordering`,
      onNavigateKey: "stock",
    });
  }
  if (input.capabilities.finance && input.overdueCount > 0) {
    tasks.push({
      id: "overdue",
      label: `${input.overdueCount} overdue payment${input.overdueCount === 1 ? "" : "s"}`,
      onNavigateKey: "overdue",
    });
  }
  if (input.pendingBillsCount > 0) {
    tasks.push({
      id: "pending",
      label: `${input.pendingBillsCount} pending bill${input.pendingBillsCount === 1 ? "" : "s"}`,
      onNavigateKey: "pending",
    });
  }
  if (input.capabilities.vendorAnalytics && input.vendorGstMissingCount > 0) {
    tasks.push({
      id: "gst",
      label: `Vendor GST missing (${input.vendorGstMissingCount})`,
      onNavigateKey: "vendors",
    });
  }
  if (input.capabilities.inventory && input.inventoryPendingCount > 0) {
    tasks.push({
      id: "inv-pending",
      label: `${input.inventoryPendingCount} inventory purchase${input.inventoryPendingCount === 1 ? "" : "s"} pending`,
      onNavigateKey: "inventory_tab",
    });
  }
  if (input.capabilities.inventory && input.packagingPendingCount > 0) {
    tasks.push({
      id: "packaging",
      label: `Low stock packaging — ${input.packagingPendingCount} open`,
      onNavigateKey: "packaging_tab",
    });
  }
  if (input.capabilities.warehouseReceiving && input.waitingReceivingCount > 0) {
    tasks.push({
      id: "receiving",
      label: `Waiting for receiving (${input.waitingReceivingCount})`,
      onNavigateKey: "receiving",
    });
  }
  return tasks.slice(0, 7);
}

export type PurchaseHealthReason = {
  id: string;
  label: string;
  ok: boolean;
};

export function buildPurchaseHealth(input: {
  paidCount: number;
  pendingCount: number;
  overdueCount: number;
  vendorGstMissingCount: number;
  duplicateInvoiceCount: number;
}): { score: number; reasons: PurchaseHealthReason[] } {
  const total = input.paidCount + input.pendingCount;
  let score = total > 0 ? Math.round((input.paidCount / total) * 100) : 100;
  if (input.overdueCount > 0) score = Math.max(0, score - input.overdueCount * 4);
  if (input.duplicateInvoiceCount > 0) score = Math.max(0, score - 8);
  if (input.vendorGstMissingCount > 0) score = Math.max(0, score - 3);

  const reasons: PurchaseHealthReason[] = [
    {
      id: "overdue",
      label:
        input.overdueCount === 0
          ? "No overdue vendors"
          : `${input.overdueCount} overdue payment${input.overdueCount === 1 ? "" : "s"}`,
      ok: input.overdueCount === 0,
    },
    {
      id: "gst",
      label:
        input.vendorGstMissingCount === 0
          ? "GST validated"
          : `${input.vendorGstMissingCount} vendor GST gap${input.vendorGstMissingCount === 1 ? "" : "s"}`,
      ok: input.vendorGstMissingCount === 0,
    },
    {
      id: "pending",
      label:
        input.pendingCount === 0
          ? "No open payments"
          : `${input.pendingCount} payment${input.pendingCount === 1 ? "" : "s"} pending`,
      ok: input.pendingCount <= 2,
    },
    {
      id: "dup",
      label:
        input.duplicateInvoiceCount === 0
          ? "No duplicate invoices"
          : `${input.duplicateInvoiceCount} possible duplicate${input.duplicateInvoiceCount === 1 ? "" : "s"}`,
      ok: input.duplicateInvoiceCount === 0,
    },
    {
      id: "pattern",
      label:
        score >= 85
          ? "Healthy purchasing pattern"
          : score >= 60
            ? "Purchasing needs attention"
            : "Purchasing pattern at risk",
      ok: score >= 85,
    },
  ];

  return { score, reasons };
}

export type ProcurementAlert = {
  id: string;
  title: string;
  detail: string;
  severity: "critical" | "warn" | "info";
  billId?: string;
  vendorId?: string;
  navigateKey?: "stock" | "pending" | "overdue" | "vendors";
};

export function buildProcurementAlerts(input: {
  capabilities: PurchaseCapabilities;
  reorderCount: number;
  overdueBills: PurchaseBill[];
  duplicateInvoiceBills: PurchaseBill[];
  gstIssueVendors: VendorWithStats[];
}): ProcurementAlert[] {
  const alerts: ProcurementAlert[] = [];
  if (input.capabilities.inventory && input.reorderCount > 0) {
    alerts.push({
      id: "stock-risk",
      title: `Stock pressure on ${input.reorderCount} SKU${input.reorderCount === 1 ? "" : "s"}`,
      detail: "Inventory insights flagged low stock or stock-out risk.",
      severity: "critical",
      navigateKey: "stock",
    });
  }
  for (const bill of input.overdueBills.slice(0, 3)) {
    alerts.push({
      id: `overdue-${bill.id}`,
      title: `Vendor payment overdue — ${bill.vendorName}`,
      detail: `${bill.billNumber} due ${bill.dueDate ?? "—"}`,
      severity: "critical",
      billId: bill.id,
      navigateKey: "overdue",
    });
  }
  for (const bill of input.duplicateInvoiceBills.slice(0, 2)) {
    alerts.push({
      id: `dup-${bill.id}`,
      title: "Duplicate invoice suspected",
      detail: `${bill.vendorInvoiceNumber} · ${bill.vendorName}`,
      severity: "warn",
      billId: bill.id,
      navigateKey: "pending",
    });
  }
  if (input.capabilities.vendorAnalytics) {
    for (const vendor of input.gstIssueVendors.slice(0, 2)) {
      alerts.push({
        id: `gst-${vendor.id}`,
        title: "GST mismatch / missing",
        detail: `${vendor.name} requires GSTIN`,
        severity: "warn",
        vendorId: vendor.id,
        navigateKey: "vendors",
      });
    }
  }
  return alerts.slice(0, 6);
}

export type BusinessActivity = {
  id: string;
  at: string;
  timeLabel: string;
  title: string;
  detail: string;
  kind:
    | "purchase_created"
    | "vendor_added"
    | "bill_uploaded"
    | "payment_completed"
    | "inventory_received"
    | "purchase_completed";
  billId?: string;
  vendorId?: string;
};

function timeLabelFromIso(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function buildBusinessActivity(input: {
  bills: PurchaseBill[];
  vendors: VendorWithStats[];
  capabilities: PurchaseCapabilities;
}): BusinessActivity[] {
  const events: BusinessActivity[] = [];

  for (const bill of input.bills) {
    events.push({
      id: `created-${bill.id}`,
      at: bill.createdAt ?? `${bill.billDate}T09:00:00.000Z`,
      timeLabel: timeLabelFromIso(bill.createdAt ?? `${bill.billDate}T09:00:00.000Z`),
      title: "Purchase Created",
      detail: `${bill.billNumber} · ${bill.vendorName}`,
      kind: "purchase_created",
      billId: bill.id,
    });
    if (bill.attachments?.some((row) => row.kind === "bill" || row.kind === "tax_invoice") || bill.billUploadName) {
      events.push({
        id: `upload-${bill.id}`,
        at: bill.updatedAt ?? bill.createdAt ?? `${bill.billDate}T09:40:00.000Z`,
        timeLabel: timeLabelFromIso(
          bill.updatedAt ?? bill.createdAt ?? `${bill.billDate}T09:40:00.000Z`,
        ),
        title: "Bill Uploaded",
        detail: bill.billNumber,
        kind: "bill_uploaded",
        billId: bill.id,
      });
    }
    if (bill.paymentStatus === "paid") {
      events.push({
        id: `paid-${bill.id}`,
        at: bill.updatedAt ?? `${bill.billDate}T10:25:00.000Z`,
        timeLabel: timeLabelFromIso(
          bill.updatedAt ?? `${bill.billDate}T10:25:00.000Z`,
        ),
        title: "Payment Completed",
        detail: `${bill.billNumber} · ${bill.vendorName}`,
        kind: "payment_completed",
        billId: bill.id,
      });
    }
    if (
      input.capabilities.warehouseReceiving &&
      (bill.status === "received" || bill.status === "qc")
    ) {
      events.push({
        id: `recv-${bill.id}`,
        at: bill.updatedAt ?? `${bill.billDate}T11:15:00.000Z`,
        timeLabel: timeLabelFromIso(
          bill.updatedAt ?? `${bill.billDate}T11:15:00.000Z`,
        ),
        title: "Inventory Received",
        detail: bill.billNumber,
        kind: "inventory_received",
        billId: bill.id,
      });
    }
    if (bill.status === "completed") {
      events.push({
        id: `done-${bill.id}`,
        at: bill.updatedAt ?? `${bill.billDate}T13:20:00.000Z`,
        timeLabel: timeLabelFromIso(
          bill.updatedAt ?? `${bill.billDate}T13:20:00.000Z`,
        ),
        title: "Purchase Completed",
        detail: bill.billNumber,
        kind: "purchase_completed",
        billId: bill.id,
      });
    }
  }

  for (const vendor of input.vendors) {
    events.push({
      id: `vendor-${vendor.id}`,
      at: vendor.createdAt ?? new Date().toISOString(),
      timeLabel: timeLabelFromIso(vendor.createdAt ?? new Date().toISOString()),
      title: "Vendor Added",
      detail: vendor.name,
      kind: "vendor_added",
      vendorId: vendor.id,
    });
  }

  return events
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 12);
}

export function countDuplicateInvoiceSuspects(bills: PurchaseBill[]): {
  count: number;
  bills: PurchaseBill[];
} {
  const seen = new Map<string, PurchaseBill>();
  const dups: PurchaseBill[] = [];
  for (const bill of bills) {
    if (!bill.vendorInvoiceNumber || bill.status === "void") continue;
    const key = `${bill.vendorId}::${bill.vendorInvoiceNumber.trim().toLowerCase()}`;
    const prior = seen.get(key);
    if (prior) {
      dups.push(bill);
    } else {
      seen.set(key, bill);
    }
  }
  return { count: dups.length, bills: dups };
}

export function vendorsMissingGstin(vendors: VendorWithStats[]): VendorWithStats[] {
  return vendors.filter(
    (vendor) =>
      vendorRequiresGstin(vendor.registrationType) && !vendor.gstin?.trim(),
  );
}

export function paymentsDueToday(
  bills: PurchaseBill[],
  today: string = todayInputDate(),
): PurchaseBill[] {
  return bills.filter(
    (bill) =>
      bill.dueDate === today &&
      bill.paymentStatus !== "paid" &&
      bill.status !== "void" &&
      bill.status !== "draft",
  );
}

export function waitingReceivingBills(bills: PurchaseBill[]): PurchaseBill[] {
  return bills.filter(
    (bill) =>
      isStockPathType(bill.purchaseType) && bill.status === "ordered",
  );
}

export type GstSupplyFilter = "all" | "intra" | "inter" | "none";

export type PurchaseDashboardFilters = {
  purchaseTypes: PurchaseType[];
  paymentStatuses: PaymentStatus[];
  purchaseStatuses: PurchaseStatus[];
  vendorIds: string[];
  gstSupply: GstSupplyFilter;
  overdueOnly: boolean;
};

export const EMPTY_PURCHASE_DASHBOARD_FILTERS: PurchaseDashboardFilters = {
  purchaseTypes: [],
  paymentStatuses: [],
  purchaseStatuses: [],
  vendorIds: [],
  gstSupply: "all",
  overdueOnly: false,
};

function todayInputDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function isPurchaseBillOverdue(
  bill: PurchaseBill,
  today: string = todayInputDate(),
): boolean {
  if (!bill.dueDate) return false;
  if (bill.paymentStatus === "paid" || bill.status === "void") return false;
  return bill.dueDate < today;
}

export function countActivePurchaseFilters(
  filters: PurchaseDashboardFilters,
): number {
  let count = 0;
  if (filters.purchaseTypes.length > 0) count += 1;
  if (filters.paymentStatuses.length > 0) count += 1;
  if (filters.purchaseStatuses.length > 0) count += 1;
  if (filters.vendorIds.length > 0) count += 1;
  if (filters.gstSupply !== "all") count += 1;
  if (filters.overdueOnly) count += 1;
  return count;
}

export type VendorPurchaseAgg = {
  vendorId: string;
  totalSpend: number;
  expenseSpend: number;
  stockSpend: number;
  assetSpend: number;
  billCount: number;
  lastBillDate: string | null;
  lastBillNumber: string | null;
};

/** Aggregate non-void bill spend per vendor for Vendor Management. */
export function aggregateVendorPurchases(
  bills: PurchaseBill[],
): Map<string, VendorPurchaseAgg> {
  const map = new Map<string, VendorPurchaseAgg>();

  for (const bill of bills) {
    if (bill.status === "void") continue;

    const current = map.get(bill.vendorId) ?? {
      vendorId: bill.vendorId,
      totalSpend: 0,
      expenseSpend: 0,
      stockSpend: 0,
      assetSpend: 0,
      billCount: 0,
      lastBillDate: null as string | null,
      lastBillNumber: null as string | null,
    };

    current.totalSpend += bill.totalAmount;
    current.billCount += 1;

    if (isStockPathType(bill.purchaseType)) {
      current.stockSpend += bill.totalAmount;
    } else if (isExpensePathType(bill.purchaseType)) {
      current.expenseSpend += bill.totalAmount;
    } else if (bill.purchaseType === "asset") {
      current.assetSpend += bill.totalAmount;
    }

    if (
      !current.lastBillDate ||
      bill.billDate > current.lastBillDate ||
      (bill.billDate === current.lastBillDate &&
        bill.billNumber > (current.lastBillNumber ?? ""))
    ) {
      current.lastBillDate = bill.billDate;
      current.lastBillNumber = bill.billNumber;
    }

    map.set(bill.vendorId, current);
  }

  return map;
}

export function matchesDashboardFilters(
  bill: PurchaseBill,
  filters: PurchaseDashboardFilters,
  today: string = todayInputDate(),
): boolean {
  if (
    filters.purchaseTypes.length > 0 &&
    !filters.purchaseTypes.includes(bill.purchaseType)
  ) {
    return false;
  }
  if (
    filters.paymentStatuses.length > 0 &&
    !filters.paymentStatuses.includes(bill.paymentStatus)
  ) {
    return false;
  }
  if (
    filters.purchaseStatuses.length > 0 &&
    !filters.purchaseStatuses.includes(bill.status)
  ) {
    return false;
  }
  if (
    filters.vendorIds.length > 0 &&
    !filters.vendorIds.includes(bill.vendorId)
  ) {
    return false;
  }

  if (filters.gstSupply === "none") {
    if (bill.taxAmount > 0) return false;
  } else if (filters.gstSupply === "intra") {
    if (bill.taxAmount <= 0 || bill.interstate) return false;
  } else if (filters.gstSupply === "inter") {
    if (bill.taxAmount <= 0 || !bill.interstate) return false;
  }

  if (filters.overdueOnly && !isPurchaseBillOverdue(bill, today)) {
    return false;
  }

  return true;
}
