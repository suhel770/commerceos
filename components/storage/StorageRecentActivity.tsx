"use client";

import { ArrowRightLeft, Clock, PackageCheck, RefreshCw, SlidersHorizontal, Archive } from "lucide-react";

export interface ActivityEventItem {
  id: string;
  type: "purchase_received" | "transfer" | "adjustment" | "marketplace_sync" | "archive";
  description: string;
  locationName: string;
  timeAgo: string;
}

interface StorageRecentActivityProps {
  events: ActivityEventItem[];
  onViewAll?: () => void;
}

export default function StorageRecentActivity({ events, onViewAll }: StorageRecentActivityProps) {
  const getEventIcon = (type: ActivityEventItem["type"]) => {
    switch (type) {
      case "purchase_received":
        return <PackageCheck className="h-3.5 w-3.5 text-emerald-600" />;
      case "transfer":
        return <ArrowRightLeft className="h-3.5 w-3.5 text-indigo-600" />;
      case "adjustment":
        return <SlidersHorizontal className="h-3.5 w-3.5 text-amber-600" />;
      case "marketplace_sync":
        return <RefreshCw className="h-3.5 w-3.5 text-blue-600" />;
      case "archive":
        return <Archive className="h-3.5 w-3.5 text-rose-600" />;
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400" />
          Recent Activity
        </h3>

        <button
          type="button"
          onClick={onViewAll}
          className="text-[11px] font-bold text-violet-700 hover:text-violet-900 transition-colors"
        >
          View All →
        </button>
      </div>

      <div className="mt-3 divide-y divide-slate-100">
        {events.slice(0, 5).map((evt) => (
          <div key={evt.id} className="py-2.5 flex items-start justify-between gap-3 text-[11px]">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-slate-50 border border-slate-100">
                {getEventIcon(evt.type)}
              </div>
              <div>
                <p className="font-semibold text-slate-800 leading-snug">{evt.description}</p>
                <span className="text-[10px] font-bold text-slate-400">{evt.locationName}</span>
              </div>
            </div>
            <span className="shrink-0 text-[10px] font-medium text-slate-400">{evt.timeAgo}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
