"use client";

import ProductHeader from "./ProductHeader";
import ProductTabs from "./ProductTabs";
import MetricCard from "./MetricCard";
import MarketplaceListings from "./MarketplaceListings";

import { Product } from "@/lib/types/product";

interface ProductWorkspaceProps {
  product: Product;
}

export default function ProductWorkspace({
  product,
}: ProductWorkspaceProps) {
  const highestSellingPrice = Math.max(
    ...product.listings.map((listing) => listing.sellingPrice)
  );

  const margin = (
    ((highestSellingPrice - product.costPrice) /
      highestSellingPrice) *
    100
  ).toFixed(1);

  return (
    <div className="space-y-8">
      <ProductHeader product={product} />

      <ProductTabs />

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Current Stock"
          value={product.stock.toString()}
        />

        <MetricCard
          title="Cost Price"
          value={`₹${product.costPrice}`}
        />

        <MetricCard
          title="Best Selling Price"
          value={`₹${highestSellingPrice}`}
          valueClass="text-blue-600"
        />

        <MetricCard
          title="Margin"
          value={`${margin}%`}
          valueClass="text-green-600"
        />

        <MetricCard
          title="Sold (30 Days)"
          value={product.sold30Days.toString()}
        />
      </div>

      <MarketplaceListings
        productId={String(product.id)}
        listings={product.listings}
      />
    </div>
  );
}