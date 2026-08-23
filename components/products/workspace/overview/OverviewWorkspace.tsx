"use client";

import type { Product } from "@/lib/types/product";
import type { ProductWorkspaceNavigate } from "../types";

import SalesChannelsCard from "./SalesChannelsCard";
import SalesProfitCard from "./SalesProfitCard";
import BusinessInsightsCard from "./BusinessInsightsCard";
import MarketplacePerformanceCard from "./MarketplacePerformanceCard";
import ProductTimelineCard from "./ProductTimelineCard";
import PackagingOverviewCard from "./PackagingOverviewCard";

interface OverviewWorkspaceProps {
  product: Product;
  onNavigate: ProductWorkspaceNavigate;
}

export default function OverviewWorkspace({
  product,
  onNavigate,
}: OverviewWorkspaceProps) {
  return (
    <div className="space-y-4">

      <div className="grid gap-4 xl:grid-cols-12">

        <div className="xl:col-span-7">
          <SalesChannelsCard
            product={product}
            onViewAll={() => onNavigate("listings")}
          />
        </div>

        <div className="xl:col-span-5">
          <SalesProfitCard product={product} />
        </div>

      </div>

      <div className="grid gap-4 xl:grid-cols-4 sm:grid-cols-2">

        <PackagingOverviewCard
          product={product}
          onManage={() => onNavigate("consumables")}
        />

        <BusinessInsightsCard onOpenAi={() => onNavigate("ai")} />

        <MarketplacePerformanceCard
          onViewAll={() => onNavigate("performance")}
        />

        <ProductTimelineCard
          onViewAll={() => onNavigate("activity")}
        />

      </div>

    </div>
  );
}
