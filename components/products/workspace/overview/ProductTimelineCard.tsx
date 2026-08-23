"use client";

import WorkspaceCard from "@/components/ui/WorkspaceCard";
import { getProductTimelinePreview } from "@/lib/mocks/product-activity";

interface ProductTimelineCardProps {
  onViewAll?: () => void;
}

const timeline = getProductTimelinePreview();

export default function ProductTimelineCard({
  onViewAll,
}: ProductTimelineCardProps) {
  return (
    <WorkspaceCard
      height="h-[570px]"
      header={
        <div className="flex items-center justify-between px-6 py-5">

          <div>

            <h2 className="text-xl font-bold text-slate-900">
              Product Timeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Complete activity history for this product
            </p>

          </div>

          <button
            type="button"
            onClick={onViewAll}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View All
          </button>

        </div>
      }
      footer={
        <div className="flex items-center justify-between bg-slate-50 px-6 py-4">

          <span className="text-xs text-slate-500">
            Updated just now
          </span>

          <button
            type="button"
            onClick={onViewAll}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View Complete History →
          </button>

        </div>
      }
    >

    <div className="px-6 py-5">

  {timeline.map((item, index) => {

    const Icon = item.icon;

    return (

      <div
        key={item.id}
        className="relative flex gap-4 pb-7 last:pb-0"
      >

        {index !== timeline.length - 1 && (

          <div className="absolute left-[19px] top-10 bottom-0 w-px bg-slate-200" />

        )}

        <div
          className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${item.color}`}
        >

          <Icon size={18} />

        </div>

        <div className="min-w-0 flex-1">

          <div className="rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:border-slate-300 hover:shadow-sm">

            <div className="flex items-center justify-between gap-3">

              <h3 className="text-sm font-semibold text-slate-900">
                {item.title}
              </h3>

              <span className="shrink-0 text-xs font-medium text-slate-400">
                {item.time}
              </span>

            </div>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {item.description}
            </p>

          </div>

        </div>

      </div>

    );

  })}
      </div>

  </WorkspaceCard>
);
}
