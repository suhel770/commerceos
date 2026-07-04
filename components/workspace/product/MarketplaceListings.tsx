import Link from "next/link";

interface Listing {
  id: string;
  marketplace: string;
  title: string;
  sellingPrice: number;
  stockSync: boolean;
  status: string;
}

interface MarketplaceListingsProps {
  productId: string;
  listings: Listing[];
}

export default function MarketplaceListings({
  productId,
  listings,
}: MarketplaceListingsProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">

      <div className="border-b border-slate-200 p-6">

        <h2 className="text-xl font-bold">
          Marketplace Listings
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Manage listings across all connected marketplaces.
        </p>

      </div>

      <div className="divide-y divide-slate-200">

        {listings.map((listing) => (

          <div
            key={listing.id}
            className="flex items-center justify-between p-6 transition hover:bg-slate-50"
          >

            <div>

              <h3 className="font-semibold capitalize">
                {listing.marketplace}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {listing.status}
              </p>

            </div>

            <div className="text-right">

              <p className="font-semibold">
                ₹{listing.sellingPrice}
              </p>

<button
  onClick={() => {
    console.log("Clicked");
    window.location.href = `/products/${productId}/listings/${listing.id}`;
  }}
  className="mt-2 inline-block text-sm font-medium text-blue-600 hover:text-blue-700"
>
  Open Listing →
</button>

            </div>

          </div>

        ))}

      </div>

    </div>
  );
}