export type PurchaseKpiKey =
  | "open_purchases"
  | "open_pos"
  | "pending_receipts"
  | "unpaid_bills"
  | "vendor_dues"
  | "pending_approvals";

export type PurchasePipelineStage = {
  label: string;
  count: number;
  amountInr: number;
  href: string;
  tone: "blue" | "amber" | "violet" | "sky" | "emerald" | "rose";
};

export type PurchaseAttentionItem = {
  id: string;
  label: string;
  detail: string;
  severity: "warning" | "danger" | "info";
  href: string;
};

export type RecentPurchase = {
  id: string;
  reference: string;
  vendor: string;
  type: "Inventory" | "Expense" | "Asset";
  status: "Draft" | "Ordered" | "Partial" | "Received" | "Billed" | "Paid";
  amountInr: number;
  updatedAt: string;
};

export type TopVendor = {
  id: string;
  name: string;
  openPos: number;
  spendInr: number;
  onTimePct: number;
};

export type SpendBucket = {
  label: string;
  amountInr: number;
  sharePct: number;
  tone: string;
};

export type PurchaseDashboardData = {
  kpis: Record<
    PurchaseKpiKey,
    { value: number; format: "count" | "money"; trend: string; trendUp: boolean }
  >;
  pipeline: PurchasePipelineStage[];
  attention: PurchaseAttentionItem[];
  recentPurchases: RecentPurchase[];
  topVendors: TopVendor[];
  spendBuckets: SpendBucket[];
  monthSpendInr: number;
  monthSpendChangePct: number;
};

export function getPurchaseDashboardData(): PurchaseDashboardData {
  return {
    kpis: {
      open_purchases: {
        value: 0,
        format: "count",
        trend: "—",
        trendUp: false,
      },
      open_pos: {
        value: 0,
        format: "count",
        trend: "—",
        trendUp: false,
      },
      pending_receipts: {
        value: 0,
        format: "count",
        trend: "—",
        trendUp: false,
      },
      unpaid_bills: {
        value: 0,
        format: "count",
        trend: "—",
        trendUp: false,
      },
      vendor_dues: {
        value: 0,
        format: "money",
        trend: "—",
        trendUp: false,
      },
      pending_approvals: {
        value: 0,
        format: "count",
        trend: "—",
        trendUp: false,
      },
    },
    pipeline: [
      {
        label: "Draft / Requested",
        count: 0,
        amountInr: 0,
        href: "/purchase/purchases",
        tone: "blue",
      },
      {
        label: "Purchase Orders",
        count: 0,
        amountInr: 0,
        href: "/purchase/orders",
        tone: "amber",
      },
      {
        label: "Goods Receiving",
        count: 0,
        amountInr: 0,
        href: "/purchase/receiving",
        tone: "violet",
      },
      {
        label: "Bills Due",
        count: 0,
        amountInr: 0,
        href: "/purchase/bills",
        tone: "sky",
      },
      {
        label: "Paid this month",
        count: 0,
        amountInr: 0,
        href: "/purchase/payments",
        tone: "emerald",
      },
    ],
    attention: [],
    recentPurchases: [],
    topVendors: [],
    spendBuckets: [
      {
        label: "Inventory",
        amountInr: 0,
        sharePct: 0,
        tone: "bg-violet-500",
      },
      {
        label: "Expenses",
        amountInr: 0,
        sharePct: 0,
        tone: "bg-sky-500",
      },
      {
        label: "Assets",
        amountInr: 0,
        sharePct: 0,
        tone: "bg-emerald-500",
      },
    ],
    monthSpendInr: 0,
    monthSpendChangePct: 0,
  };
}

export function formatPurchaseMoney(value: number): string {
  const hasFraction = !Number.isInteger(value);
  const formatted = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(value);
  // Insert a thin space (U+2009) between the ₹ symbol and the digits for visual comfort.
  return formatted.replace("\u20B9", "\u20B9\u2009");
}
