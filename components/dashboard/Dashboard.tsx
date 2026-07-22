
import KPIGrid from "./KPIGrid";
import SalesOverview from "./SalesOverview";
import MarketplacePerformance from "./MarketplacePerformance";
import ExecutiveBrief from "./ExecutiveBrief";
import InventoryHealth from "./InventoryHealth";
import OrderPipeline from "./OrderPipeline";
import ProfitBreakdown from "./ProfitBreakdown";
import AlertsTasks from "./AlertsTasks";
import RecentActivity from "./RecentActivity";
import { getDashboardData } from "@/lib/dashboard/dashboard-data";
import DashboardControls from "./DashboardControls";

export default async function Dashboard() {
  const dashboardData = await getDashboardData();

  return (
    <div className="mx-auto max-w-[1800px] space-y-4 px-4 py-4 xl:px-4">

      <header className="flex flex-col gap-4 py-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950">Good morning, Amir <span aria-hidden="true">👋</span></h1>
          <p className="mt-1 text-sm text-slate-500">Here&apos;s what&apos;s happening with your business today.</p>
        </div>
        <DashboardControls />
      </header>

      {/* KPI */}
      <KPIGrid kpis={dashboardData.kpis} healthScore={dashboardData.healthScore} />

      {/* Revenue + Marketplace + Executive */}
      <section className="grid items-stretch gap-6 xl:grid-cols-3">

        <div className="flex min-w-0">
          <SalesOverview />
        </div>

        <div className="flex min-w-0">
          <MarketplacePerformance />
        </div>

        <div className="flex min-w-0">
          <ExecutiveBrief brief={dashboardData.executiveBrief} healthScore={dashboardData.healthScore} />
        </div>

      </section>

      {/* Inventory + Orders + Profit + Alerts */}
      <section className="grid items-stretch gap-6 xl:grid-cols-4">

        <div className="flex min-w-0">
          <InventoryHealth />
        </div>

        <div className="flex min-w-0">
          <OrderPipeline />
        </div>

        <div className="flex min-w-0">
          <ProfitBreakdown />
        </div>

        <div className="flex min-w-0">
          <AlertsTasks />
        </div>

      </section>

      {/* Recent Activity */}
      <RecentActivity />

    </div>
  );
}
