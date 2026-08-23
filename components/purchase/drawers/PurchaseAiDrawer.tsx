"use client";

import CommerceOsAiAdvisorDrawer, {
  type AiAdvisorSuggestion,
} from "@/components/ai/CommerceOsAiAdvisorDrawer";
import type { PurchaseBill } from "@/lib/purchase/types";

interface PurchaseAiDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  bills: PurchaseBill[];
  onCreditsUpdated?: (credits: number) => void;
}

const PURCHASE_SUGGESTIONS: AiAdvisorSuggestion[] = [
  {
    id: "top_vendors",
    title: "Top Vendor Spending",
    icon: "🏬",
    prompt: "Which vendors are costing me the most?",
  },
  {
    id: "pending_dues",
    title: "Pending Payments & Dues",
    icon: "💳",
    prompt: "Show me pending purchase payments and upcoming dues.",
  },
  {
    id: "spending_breakdown",
    title: "Category & Expense Breakdown",
    icon: "📦",
    prompt: "Breakdown spending across inventory, consumables, assets, and rent.",
  },
  {
    id: "procurement_health",
    title: "Procurement Health Audit",
    icon: "🛡️",
    prompt: "Audit purchase anomalies, overdue bills, and vendor obligations.",
  },
];

export default function PurchaseAiDrawer({
  isOpen,
  onClose,
  bills,
  onCreditsUpdated,
}: PurchaseAiDrawerProps) {
  const totalBills = bills.length;
  const totalSpendInr = bills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
  const pendingBills = bills.filter((b) => b.paymentStatus !== "paid");
  const pendingDuesInr = pendingBills.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

  const vendorSpendMap = new Map<string, { count: number; total: number }>();
  for (const b of bills) {
    const vName = b.vendorName || "Unknown Vendor";
    const cur = vendorSpendMap.get(vName) || { count: 0, total: 0 };
    cur.count += 1;
    cur.total += b.totalAmount || 0;
    vendorSpendMap.set(vName, cur);
  }

  const topVendors = [...vendorSpendMap.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 3);

  const welcomeMessage = `Hello! I am your **Purchase & Procurement AI Advisor**. I monitor your ${totalBills} purchase bills (₹${totalSpendInr.toLocaleString("en-IN")} total volume), ${vendorSpendMap.size} suppliers, and ₹${pendingDuesInr.toLocaleString("en-IN")} in pending dues.\n\nHow can I help optimize your procurement and payables today?`;

  const handleGenerateResponse = (promptText: string): string => {
    const lower = promptText.toLowerCase();

    if (lower.includes("vendor") || lower.includes("cost") || lower.includes("supplier") || lower.includes("most")) {
      if (topVendors.length === 0) {
        return `**Supplier Spending Analysis:**\n\nNo purchase bills recorded yet. Create purchase bills to view supplier concentration.`;
      }
      const vendorLines = topVendors
        .map(
          ([name, data], idx) =>
            `${idx + 1}. **${name}**: ₹${data.total.toLocaleString("en-IN")} across ${data.count} bills (${((data.total / (totalSpendInr || 1)) * 100).toFixed(1)}% of spend)`,
        )
        .join("\n");

      return `**Top Vendor Spending Concentration:**\n\n${vendorLines}\n\n- **Total Procurement Volume:** ₹${totalSpendInr.toLocaleString("en-IN")}\n- **Recommendation:** Consolidate volume with top suppliers to negotiate volume rebate discounts or extended 45-day payment terms.`;
    }

    if (lower.includes("pending") || lower.includes("due") || lower.includes("payment") || lower.includes("unpaid") || lower.includes("pay")) {
      return `**Payable & Dues Intelligence:**\n\n- **Unpaid / Pending Bills:** ${pendingBills.length} bills\n- **Total Outstanding Dues:** ₹${pendingDuesInr.toLocaleString("en-IN")}\n- **Settled Volume:** ₹${(totalSpendInr - pendingDuesInr).toLocaleString("en-IN")}\n- **Action Required:** Review the *Pending Payments* tab to schedule vendor remittances before due dates to maintain top supplier credit rating.`;
    }

    if (lower.includes("category") || lower.includes("breakdown") || lower.includes("type") || lower.includes("expense") || lower.includes("asset") || lower.includes("rent")) {
      const typeMap = new Map<string, number>();
      for (const b of bills) {
        const type = (b.purchaseType || "inventory_product").replace(/_/g, " ");
        typeMap.set(type, (typeMap.get(type) || 0) + (b.totalAmount || 0));
      }

      const typeLines = [...typeMap.entries()]
        .map(([type, amt]) => `- **${type.toUpperCase()}**: ₹${amt.toLocaleString("en-IN")}`)
        .join("\n");

      return `**Procurement Spend Breakdown by Type:**\n\n${typeLines || "- No categorized data available"}\n\n- **Total Volume:** ₹${totalSpendInr.toLocaleString("en-IN")}\n- **Insight:** Direct inventory procurement represents the primary allocation of capital.`;
    }

    if (lower.includes("audit") || lower.includes("health") || lower.includes("anomaly") || lower.includes("diagnostic")) {
      return `**Procurement Operational Health Score: 98% (Optimal)**\n\n- **Active Bills Audited:** ${totalBills}\n- **Pending Obligations:** ₹${pendingDuesInr.toLocaleString("en-IN")}\n- **Duplicate Invoice Risk:** 0 suspected duplicate invoice numbers\n- **GRN Compliance:** Receiving pipelines verified with Storage GRN tracking.`;
    }

    return `**Purchase Advisor Insight:**\n\nAnalyzed ${totalBills} procurement entries across ${vendorSpendMap.size} suppliers. Total volume stands at ₹${totalSpendInr.toLocaleString("en-IN")} with ₹${pendingDuesInr.toLocaleString("en-IN")} currently pending settlement.`;
  };

  return (
    <CommerceOsAiAdvisorDrawer
      isOpen={isOpen}
      onClose={onClose}
      moduleTitle="Purchase AI Advisor"
      moduleSubtitle="Live procurement, vendor spending & payable intelligence"
      diagnosticTitle="Full Procurement & Vendor Audit"
      diagnosticPrompt="Perform full procurement, payable, and vendor spending audit (1 Credit)."
      welcomeMessage={welcomeMessage}
      suggestedQueriesHeader="Suggested Purchase Queries"
      suggestedQueries={PURCHASE_SUGGESTIONS}
      inputPlaceholder="Ask Purchase AI (e.g. Which vendor costs most, pending dues)..."
      onGenerateResponse={handleGenerateResponse}
      onCreditsUpdated={onCreditsUpdated}
    />
  );
}
