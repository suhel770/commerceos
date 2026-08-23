import AppShell from "@/components/layout/AppShell";
import FinanceWorkspace from "@/components/finance/FinanceWorkspace";

export const metadata = {
  title: "Finance — CommerceOS",
  description: "P&L, cash flow, and financial health dashboard for your ecommerce business.",
};

export default function FinanceRoutePage() {
  return (
    <AppShell
      title="Finance"
      subtitle="P&L, cash flow, and business financial health"
    >
      <div className="mx-auto w-full max-w-[1700px] px-6 pb-6 pt-3">
        <FinanceWorkspace />
      </div>
    </AppShell>
  );
}
