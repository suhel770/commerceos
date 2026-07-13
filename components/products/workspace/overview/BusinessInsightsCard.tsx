"use client";
import WorkspaceCard from "@/components/ui/WorkspaceCard";


import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Package,
  Sparkles,
  TrendingUp,
} from "lucide-react";

const insights = [
  {
    id: 1,
    icon: TrendingUp,
    title: "Increase Amazon selling price by ₹20",
    impact: "+₹18,400 / month",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  {
    id: 2,
    icon: Package,
    title: "Shopify stock will run out in 6 days",
    impact: "Restock Soon",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    id: 3,
    icon: AlertTriangle,
    title: "Returns increased by 2.1%",
    impact: "Needs Attention",
    color: "text-red-600",
    bg: "bg-red-50",
  },
];

export default function BusinessInsightsCard() {
  return (
    <WorkspaceCard
      height="h-[570px]"
      header={
        <div className="flex items-center justify-between px-6 py-5">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">

              <Sparkles
                size={22}
                className="text-violet-600"
              />

            </div>

            <div>

              <h2 className="text-xl font-bold text-slate-900">
                CommerceOS AI
              </h2>

              <p className="text-sm text-slate-500">
                AI powered business recommendations
              </p>

            </div>

          </div>

          <div className="flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2">

            <Brain
              size={16}
              className="text-violet-600"
            />

            <span className="text-sm font-semibold text-violet-700">
              AI Ready
            </span>

          </div>

        </div>
      }
      footer={
        <div className="flex items-center justify-between bg-slate-50 px-6 py-4">

          <div>

            <p className="text-xs text-slate-500">
              Last analysed
            </p>

            <p className="mt-1 text-sm font-semibold text-slate-900">
              2 minutes ago
            </p>

          </div>

          <button className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">

            View Full AI Analysis

            <ArrowRight size={16} />

          </button>

        </div>
      }
    >
          
     {/* Insights */}

      <div className="space-y-3 p-5">

        {insights.map((item) => {

          const Icon = item.icon;

          return (            
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-violet-200 hover:bg-violet-50/30"
            >
              <div className="flex items-start gap-3">

                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.bg}`}
                >
                  <Icon
                    size={18}
                    className={item.color}
                  />
                </div>

                <div className="flex-1">

                  <p className="text-sm font-semibold text-slate-900">
                    {item.title}
                  </p>

                  <p className={`mt-1 text-xs font-semibold ${item.color}`}>
                    {item.impact}
                  </p>

                </div>

              </div>

            </div>

          );

        })}

      </div>

      {/* AI Opportunity */}

      <div className="px-5 pb-5">

        <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-blue-50 to-white p-5">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Estimated Monthly Opportunity
              </p>

              <h3 className="mt-2 text-4xl font-bold tracking-tight text-emerald-600">
                +₹18,400
              </h3>

              <p className="mt-2 text-sm text-slate-600">
                Based on the current AI recommendations for this product.
              </p>

            </div>

            <div className="rounded-2xl border border-violet-200 bg-white px-4 py-3 shadow-sm">

              <p className="text-xs text-slate-500">
                Confidence
              </p>

              <p className="mt-1 text-2xl font-bold text-violet-600">
                96%
              </p>

            </div>

          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">

            <div className="rounded-xl bg-white p-3 text-center">

              <p className="text-xs text-slate-500">
                Actions
              </p>

              <p className="mt-1 text-xl font-bold text-slate-900">
                3
              </p>

            </div>

            <div className="rounded-xl bg-white p-3 text-center">

              <p className="text-xs text-slate-500">
                High Priority
              </p>

              <p className="mt-1 text-xl font-bold text-red-500">
                2
              </p>

            </div>

            <div className="rounded-xl bg-white p-3 text-center">

              <p className="text-xs text-slate-500">
                Success Rate
              </p>

              <p className="mt-1 text-xl font-bold text-emerald-600">
                91%
              </p>

            </div>

          </div>

        </div>

      </div>
    

    </WorkspaceCard>
  );
}