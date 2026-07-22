import type {
  MarketplaceListing,
  Product,
} from "@/lib/types/product";
import {
  Store,
  BadgeIndianRupee,
  Boxes,
  Package,
  Building2,
  CalendarDays,
  RefreshCw,
  Tag,
} from "lucide-react";

interface ListingOverviewProps {
  product: Product;
  listing: MarketplaceListing;
}

export default function ListingOverview({
  product,
  listing,
}: ListingOverviewProps) {
  const cards = [
    { icon: Store, title: "Marketplace", value: listing.marketplace },
    { icon: Tag, title: "Status", value: listing.status },
    {
      icon: BadgeIndianRupee,
      title: "Selling Price",
      value: `INR ${listing.sellingPrice}`,
    },
    {
      icon: BadgeIndianRupee,
      title: "MRP",
      value: `INR ${product.pricing.mrp}`,
    },
    { icon: Boxes, title: "Inventory", value: listing.availableStock },
    { icon: Package, title: "SKU", value: product.sku },
    { icon: Building2, title: "Brand", value: product.brand },
    { icon: CalendarDays, title: "Created", value: product.createdAt },
    { icon: RefreshCw, title: "Updated", value: product.updatedAt },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Listing Health"
          value={`${listing.healthScore ?? product.performance.healthScore}%`}
          description="Healthy"
          tone="green"
        />
        <SummaryCard
          title="Inventory"
          value={listing.availableStock}
          description="Units Available"
          tone="blue"
        />
        <SummaryCard
          title="Selling Price"
          value={`INR ${listing.sellingPrice}`}
          description="Current Price"
          tone="amber"
        />
        <SummaryCard
          title="Marketplace"
          value={listing.marketplace}
          description="Connected"
          tone="violet"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-slate-50"
            >
              <div className="rounded-lg bg-blue-50 p-2">
                <Icon size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-slate-500">
                  {card.title}
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {card.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface SummaryCardProps {
  title: string;
  value: string | number;
  description: string;
  tone: "green" | "blue" | "amber" | "violet";
}

function SummaryCard({
  title,
  value,
  description,
  tone,
}: SummaryCardProps) {
  const tones = {
    green: "border-green-200 bg-green-50 text-green-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    violet: "border-violet-200 bg-violet-50 text-violet-700",
  };

  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      <h2 className="mt-2 text-2xl font-bold">{value}</h2>
      <p className="mt-1 text-xs">{description}</p>
    </div>
  );
}
