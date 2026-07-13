import { MarketplaceListing } from "@/lib/types/product";

interface MarketplaceBadgesProps {
  listings: MarketplaceListing[];
}

const marketplaceStyles = {
  Amazon: "bg-orange-100 text-orange-700",
  Flipkart: "bg-blue-100 text-blue-700",
  Meesho: "bg-pink-100 text-pink-700",
  Shopify: "bg-emerald-100 text-emerald-700",
  Website: "bg-slate-100 text-slate-700",
};

export default function MarketplaceBadges({
  listings,
}: MarketplaceBadgesProps) {
  return (
    <div className="mt-1 flex flex-wrap gap-1">

      {listings.map((listing) => (

        <span
          key={listing.id}
          className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
            marketplaceStyles[
              listing.marketplace as keyof typeof marketplaceStyles
            ] ?? "bg-slate-100 text-slate-700"
          }`}
        >
          {listing.marketplace}
        </span>

      ))}

    </div>
  );
}