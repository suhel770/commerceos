import AppShell from "@/components/layout/AppShell";
import ConsumablesPage from "@/components/products/consumables/ConsumablesPage";

export default function ConsumablesRoutePage() {
  return (
    <AppShell
      title="Consumables & Packaging"
      subtitle="Operational packaging supplies and warehouse consumable inventory"
    >
      <div className="mx-auto w-full max-w-[1700px] p-8">
        <ConsumablesPage />
      </div>
    </AppShell>
  );
}
