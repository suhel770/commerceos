import KPICard from "./KPICard";
import RevenueChart from "./RevenueChart";
import SalesOverview from "./SalesOverview";
import RecentOrders from "./RecentOrders";

export default function Dashboard() {
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-4">
        <KPICard
          title="Revenue"
          value="₹2,48,760"
          growth="18.6%"
        />

        <KPICard
          title="Orders"
          value="748"
          growth="12.4%"
        />

        <KPICard
          title="Profit"
          value="₹2,31,540"
          growth="20.4%"
        />

        <KPICard
          title="Inventory"
          value="12,847"
          growth="4.2%"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>

        <div>
          <SalesOverview />
        </div>
      </div>
      <div className="mt-6">
        <RecentOrders />
      </div>

    </>
  );
}