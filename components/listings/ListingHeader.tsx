import type { Listing } from "@/lib/data/listings";
import ListingCommandBar from "./ListingCommandBar";

interface ListingHeaderProps {
  listing: Listing;
}

export default function ListingHeader({
  listing,
}: ListingHeaderProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

      {/* Top Section */}

      <div className="flex items-center justify-between px-6 py-4">

        <div className="flex items-center gap-4">

          <img
            src={listing.productImage}
            alt={listing.productName}
            className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
          />

          <div>

            <div className="flex items-center gap-3">

              <h1 className="text-2xl font-bold text-slate-900">
                {listing.productName}
              </h1>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  listing.status === "Active"
                    ? "bg-green-100 text-green-700"
                    : listing.status === "Draft"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {listing.status}
              </span>

            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-500">

              <span className="font-medium text-blue-600">
                {listing.marketplace}
              </span>

              <span>•</span>

              <span>{listing.sku}</span>

              <span>•</span>

              <span>{listing.variant}</span>

              <span>•</span>

              <span>{listing.brand}</span>

            </div>

            <div className="mt-2 flex flex-wrap gap-5 text-xs text-slate-500">

              <span>
                <strong className="text-slate-700">
                  Health
                </strong>{" "}
                96%
              </span>

              <span>
                <strong className="text-slate-700">
                  Last Sync
                </strong>{" "}
                2 min ago
              </span>

              <span>
                <strong className="text-slate-700">
                  Listing ID
                </strong>{" "}
                {listing.id}
              </span>

            </div>

          </div>

        </div>

      </div>

      {/* Command Bar */}

      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
        <ListingCommandBar />
      </div>

    </div>
  );
}