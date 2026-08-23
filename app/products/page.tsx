import AppShell from "@/components/layout/AppShell";
import ProductsPage from "@/components/products/ProductsPage";

export default function ProductsRoutePage() {
  return (
    <AppShell
      title="Products"
      subtitle="Master Product Engine across sales channels and warehouses"
    >
      <div className="mx-auto w-full max-w-[1700px] p-8">
        <ProductsPage />
      </div>
    </AppShell>
  );
}