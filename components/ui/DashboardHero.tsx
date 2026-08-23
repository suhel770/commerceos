import DashboardCard from "@/components/ui/DashboardCard";

export default function DashboardHero() {
  return (
    <DashboardCard className="mb-6 overflow-hidden border-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
            CommerceOS AI
          </p>
          <h1 className="mt-3 text-4xl font-bold">Good Morning 👋</h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            No live sales signal yet. Sync channels to populate this summary.
          </p>
          <div className="mt-8 space-y-2 text-slate-300">
            <p>• Add products to start tracking stock</p>
            <p>• Connect marketplaces for orders</p>
            <p>• Record purchases for spend visibility</p>
          </div>
        </div>

        <div className="grid w-full max-w-md grid-cols-2 gap-4">
          {[
            ["Revenue", "₹0"],
            ["Profit", "₹0"],
            ["Orders", "0"],
            ["Best Marketplace", "—"],
          ].map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl bg-white/10 p-5 backdrop-blur"
            >
              <p className="text-sm text-slate-300">{label}</p>
              <h3 className="mt-2 text-3xl font-bold">{value}</h3>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}
