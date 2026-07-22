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
    { id: "revenue", label: "Total Revenue", value: "₹12,48,230", change: "+18.6%" },
    { id: "profit", label: "Net Profit", value: "₹3,82,450", change: "+14.2%" },
    { id: "orders", label: "Orders", value: "1,243", change: "+11.3%" },
    { id: "inventory", label: "Inventory Value", value: "₹8,76,120", change: "+7.8%" },
  ],
  healthScore: 92,
  executiveBrief: {
    summary: [
      "Revenue is up 18.6% compared to yesterday.",
      "Amazon sales increased by 16.4%.",
      "14 products are running low on stock.",
      "3 listings have Buy Box at risk.",
      "Return rate improved by 2.1%.",
    ],
    recommendation: "Increase price of 8 high-demand products",
    estimatedProfit: "₹45,200/month",
  },
};

export async function getDashboardData(): Promise<DashboardData> {
  // Replace this with authenticated provider adapters or a database query.
  // This module is server-only so tokens and provider credentials stay private.
  return demoDashboardData;
}
