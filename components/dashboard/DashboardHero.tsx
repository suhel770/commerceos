import {
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Target,
  Sparkles,
} from "lucide-react";

import { executiveBrief } from "@/lib/mocks/dashboard/ai";
import { overview } from "@/lib/mocks/dashboard/overview";

export default function DashboardHero() {
  return (
    <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-sm">

      <div className="grid gap-8 xl:grid-cols-[2fr_1fr]">

        {/* LEFT */}

        <div>

          <div className="flex items-center gap-3">

            <div className="rounded-xl bg-violet-500/20 p-3">

              <Sparkles className="text-violet-300" size={24} />

            </div>

            <div>

              <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                CommerceOS AI
              </p>

              <h1 className="mt-1 text-3xl font-bold">
                {executiveBrief.greeting} 👋
              </h1>

            </div>

          </div>

          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
            {executiveBrief.summary}
          </p>

          {/* Needs Attention */}

          <div className="mt-8">

            <h3 className="flex items-center gap-2 font-semibold">

              <AlertTriangle
                size={18}
                className="text-amber-400"
              />

              Needs Attention

            </h3>

            <div className="mt-4 space-y-3">

              {executiveBrief.alerts.map((alert) => (

                <button
                  key={alert}
                  className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-left transition hover:border-violet-400 hover:bg-white/10"
                >

                  <span>{alert}</span>

                  <ArrowRight size={18} />

                </button>

              ))}

            </div>

          </div>

          {/* AI Recommendations */}

          <div className="mt-8">

            <h3 className="flex items-center gap-2 font-semibold">

              <TrendingUp
                size={18}
                className="text-emerald-400"
              />

              AI Recommendations

            </h3>

            <div className="mt-4 space-y-3">

              {executiveBrief.recommendations.map((recommendation) => (

                <button
                  key={recommendation}
                  className="flex w-full items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-left transition hover:bg-emerald-500/20"
                >

                  <span>{recommendation}</span>

                  <ArrowRight size={18} />

                </button>

              ))}

            </div>

          </div>

        </div>

        {/* RIGHT */}

        <div className="space-y-5">

          <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">

            <p className="text-sm uppercase tracking-wide text-slate-400">
              Business Health
            </p>

            <h2 className="mt-3 text-6xl font-bold">
              {overview.businessHealth}
            </h2>

            <p className="mt-2 text-emerald-400">
              Excellent
            </p>

          </div>

          <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">

            <p className="text-sm text-slate-400">
              Revenue Today
            </p>

            <h3 className="mt-2 text-3xl font-bold">
              ₹{overview.revenue.toLocaleString()}
            </h3>

          </div>

          <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">

            <p className="text-sm text-slate-400">
              Orders
            </p>

            <h3 className="mt-2 text-3xl font-bold">
              {overview.orders}
            </h3>

          </div>

          <div className="rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 p-6">

            <div className="flex items-center gap-2">

              <Target size={18} />

              <span className="font-semibold">
                Today's Mission
              </span>

            </div>

            <p className="mt-4 leading-7">
              Dispatch all pending orders before 4:00 PM.
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}