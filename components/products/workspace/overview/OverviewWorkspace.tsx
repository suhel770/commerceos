"use client";

import type { Product } from "@/lib/types/product";

import SalesChannelsCard from "./SalesChannelsCard";
import SalesProfitCard from "./SalesProfitCard";
import BusinessInsightsCard from "./BusinessInsightsCard";
import MarketplacePerformanceCard from "./MarketplacePerformanceCard";
import ProductTimelineCard from "./ProductTimelineCard";
import ExecutiveSummaryCard from "./ExecutiveSummaryCard";

interface OverviewWorkspaceProps {
  product: Product;
}

export default function OverviewWorkspace({
  product,
}: OverviewWorkspaceProps) {
  return (
    <div className="space-y-4">

      {/* Top Row */}

      <div className="grid gap-4 xl:grid-cols-12">

        <div className="xl:col-span-7">
          <SalesChannelsCard product={product} />
        </div>

        <div className="xl:col-span-5">
          <SalesProfitCard product={product} />
        </div>

      </div>

      {/* Middle Row */}

      <div className="grid gap-4 xl:grid-cols-3">

        <BusinessInsightsCard />

        <MarketplacePerformanceCard />

        <ProductTimelineCard />

      </div>

      {/* Executive Summary */}

      <ExecutiveSummaryCard />

    </div>
  );
}