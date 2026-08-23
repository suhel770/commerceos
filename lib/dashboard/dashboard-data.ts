import "server-only";

/**
 * Dashboard view model. Keep API credentials and provider-specific payloads in
 * server-side adapters, then map them into this serializable contract.
 */
export type DashboardData = {
  kpis: Array<{
    id: "revenue" | "profit" | "orders" | "inventory";
    label: string;
    value: string;
    change: string;
  }>;
  healthScore: number;
  executiveBrief: {
    summary: string[];
    recommendation: string;
    estimatedProfit: string;
  };
};

const demoDashboardData: DashboardData = {
  kpis: [
    { id: "revenue", label: "Total Revenue", value: "₹0", change: "—" },
    { id: "profit", label: "Net Profit", value: "₹0", change: "—" },
    { id: "orders", label: "Orders", value: "0", change: "—" },
    { id: "inventory", label: "Inventory Value", value: "₹0", change: "—" },
  ],
  healthScore: 0,
  executiveBrief: {
    summary: [
      "No live marketplace data yet.",
      "Add products and sync channels to populate this dashboard.",
    ],
    recommendation: "Create your first product in Product Studio",
    estimatedProfit: "₹0/month",
  },
};

export async function getDashboardData(): Promise<DashboardData> {
  // Replace this with authenticated provider adapters or a database query.
  // This module is server-only so tokens and provider credentials stay private.
  return demoDashboardData;
}
