"use client";

import WorkspaceCard from "@/components/ui/WorkspaceCard";
import { Inbox } from "lucide-react";

interface MarketplacePerformanceCardProps {
  onViewAll?: () => void;
}

export default function MarketplacePerformanceCard({
  onViewAll,
}: MarketplacePerformanceCardProps) {
  return (
    <WorkspaceCard
      height="h-[570px]"
      header={
        <div className="flex items-center justify-between px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Marketplace Performance
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Revenue, orders and ROI across connected marketplaces
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
          <span className="text-xs text-slate-500">No marketplace data yet</span>
          <button
            type="button"
            onClick={onViewAll}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            View Detailed Analytics →
          </button>
        </div>
      }
    >
      <div className="flex h-full min-h-[360px] flex-col items-center justify-center px-6 py-12 text-center">
        <Inbox className="h-5 w-5 text-slate-400" />
        <p className="mt-2 text-sm font-semibold text-slate-700">
          No channel performance yet
        </p>
        <p className="mt-1 max-w-xs text-xs text-slate-500">
          Connect marketplaces and sync orders to populate this card.
        </p>
      </div>
    </WorkspaceCard>
  );
}
