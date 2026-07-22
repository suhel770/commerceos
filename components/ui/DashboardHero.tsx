import DashboardCard from "@/components/ui/DashboardCard";

export default function DashboardHero() {
  return (
    <DashboardCard className="mb-6 overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-0">

      <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">

        <div className="max-w-2xl">

          <p className="text-sm uppercase tracking-[0.3em] text-slate-300">
            CommerceOS AI
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Good Morning, Amir 👋
          </h1>

          <p className="mt-5 text-lg leading-8 text-slate-300">
            Sales increased
            <span className="font-semibold text-emerald-400">
              {" "}18.2%
            </span>
            {" "}compared to yesterday.
          </p>

          <div className="mt-8 space-y-2 text-slate-300">

            <p>• 6 products require stock replenishment</p>

            <p>• 3 pending shipments need attention</p>

            <p>• GST filing due in 3 days</p>

          </div>

        </div>

        <div className="grid w-full max-w-md grid-cols-2 gap-4">

          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">

            <p className="text-sm text-slate-300">
              Revenue
            </p>

            <h3 className="mt-2 text-3xl font-bold">
              ₹48,520
            </h3>

          </div>

          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">

            <p className="text-sm text-slate-300">
              Profit
            </p>

            <h3 className="mt-2 text-3xl font-bold">
              ₹16,240
            </h3>

          </div>

          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">

            <p className="text-sm text-slate-300">
              Orders
            </p>

            <h3 className="mt-2 text-3xl font-bold">
              142
            </h3>

          </div>

          <div className="rounded-2xl bg-white/10 p-5 backdrop-blur">

            <p className="text-sm text-slate-300">
              Best Marketplace
            </p>

            <h3 className="mt-2 text-xl font-bold">
              Amazon
            </h3>

          </div>

        </div>

      </div>

    </DashboardCard>
  );
}