import AppShell from "@/components/layout/AppShell";
import ConsumablesPage from "@/components/products/consumables/ConsumablesPage";

export default function ConsumablesRoutePage() {
  return (
    <AppShell
      title="Products"
      subtitle="Master Product Engine across sales channels and warehouses"
    >
      <div className="mx-auto w-full max-w-[1700px] p-8">
        <ConsumablesPage />
      </div>
    </AppShell>
  );
}
