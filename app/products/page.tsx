import AppShell from "@/components/layout/AppShell";
import ProductOverviewDashboard from "@/components/products/ProductOverviewDashboard";

export default function ProductsRoutePage() {
  return (
    <AppShell
      title="Products"
      subtitle="Master Product Engine across sales channels and warehouses"
    >
      <div className="mx-auto w-full max-w-[1700px] p-8">
        <ProductOverviewDashboard />
      </div>
    </AppShell>
  );
}