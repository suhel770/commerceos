import DashboardHero from "./DashboardHero";
import KPIGrid from "./KPIGrid";
import MarketplacePerformance from "./MarketplacePerformance";
import InventoryHealth from "./InventoryHealth";
import OrderPipeline from "./OrderPipeline";
import BusinessHealth from "./BusinessHealth";
import RecentActivity from "./RecentActivity";
import RecentOrders from "./RecentOrders";

export default function Dashboard() {
  return (
    <div className="space-y-8">

      {/* KPI Cards */}
      <KPIGrid />

      {/* AI + Marketplace */}
      <div className="grid gap-6 lg:grid-cols-3">

        <div className="lg:col-span-2">
          <DashboardHero />
        </div>

        <MarketplacePerformance />

      </div>

      {/* Inventory + Pipeline */}
      <div className="grid gap-6 lg:grid-cols-2">

        <InventoryHealth />

        <OrderPipeline />

      </div>

      {/* Health + Activity */}
      <div className="grid gap-6 lg:grid-cols-2">

        <BusinessHealth />

        <RecentActivity />

      </div>

      {/* Recent Orders */}
      <RecentOrders />

    </div>
  );
}