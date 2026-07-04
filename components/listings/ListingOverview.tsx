import type { Listing } from "@/lib/data/listings";
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
  listing: Listing;
}

export default function ListingOverview({
  listing,
}: ListingOverviewProps) {
  const cards = [
    {
      icon: Store,
      title: "Marketplace",
      value: listing.marketplace,
    },
    {
      icon: Tag,
      title: "Status",
      value: listing.status,
    },
    {
      icon: BadgeIndianRupee,
      title: "Selling Price",
      value: `₹${listing.sellingPrice}`,
    },
    {
      icon: BadgeIndianRupee,
      title: "MRP",
      value: `₹${listing.mrp}`,
    },
    {
      icon: Boxes,
      title: "Inventory",
      value: listing.inventory,
    },
    {
      icon: Package,
      title: "SKU",
      value: listing.sku,
    },
    {
      icon: Building2,
      title: "Brand",
      value: listing.brand,
    },
    {
      icon: CalendarDays,
      title: "Created",
      value: listing.createdAt,
    },
    {
      icon: RefreshCw,
      title: "Updated",
      value: listing.updatedAt,
    },
  ];

  return (
    <div className="space-y-5">

      {/* Quick Summary */}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">

        <div className="rounded-xl border border-green-200 bg-green-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
            Listing Health
          </p>

          <h2 className="mt-2 text-3xl font-bold text-green-700">
            96%
          </h2>

          <p className="mt-1 text-xs text-green-700">
            Excellent
          </p>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Inventory
          </p>

          <h2 className="mt-2 text-3xl font-bold text-blue-700">
            {listing.inventory}
          </h2>

          <p className="mt-1 text-xs text-blue-700">
            Units Available
          </p>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
            Selling Price
          </p>

          <h2 className="mt-2 text-3xl font-bold text-amber-700">
            ₹{listing.sellingPrice}
          </h2>

          <p className="mt-1 text-xs text-amber-700">
            Current Price
          </p>
        </div>

        <div className="rounded-xl border border-violet-200 bg-violet-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
            Marketplace
          </p>

          <h2 className="mt-2 text-2xl font-bold text-violet-700">
            {listing.marketplace}
          </h2>

          <p className="mt-1 text-xs text-violet-700">
            Connected
          </p>
        </div>

      </div>

      {/* Details */}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">

        {cards.map((card) => {

          const Icon = card.icon;

          return (
            <div
              key={card.title}
              className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-blue-300 hover:bg-slate-50"
            >

              <div className="rounded-lg bg-blue-50 p-2">
                <Icon
                  size={16}
                  className="text-blue-600"
                />
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