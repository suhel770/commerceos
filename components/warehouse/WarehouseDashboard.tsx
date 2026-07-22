import PageHeader from "@/components/ui/PageHeader";

export default function WarehouseDashboard() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Warehouse"
        description="Manage inventory, stock movement and warehouse operations."
        buttonText="+ Receive Stock"
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">

        <h2 className="text-2xl font-bold text-slate-900">
          Warehouse Module
        </h2>

        <p className="mt-3 text-slate-500">
          🚧 Coming in Sprint 7
        </p>

      </div>
    </div>
  );
}