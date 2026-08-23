import { MarketplaceListing } from "@/lib/types/product";

interface MarketplaceBadgesProps {
  listings?: MarketplaceListing[];
}

const marketplaceStyles: Record<string, string> = {
  amazon: "bg-amber-50 text-amber-700 border-amber-200",
  Amazon: "bg-amber-50 text-amber-700 border-amber-200",
  flipkart: "bg-blue-50 text-blue-700 border-blue-200",
  Flipkart: "bg-blue-50 text-blue-700 border-blue-200",
  meesho: "bg-pink-50 text-pink-700 border-pink-200",
  Meesho: "bg-pink-50 text-pink-700 border-pink-200",
  shopify: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Shopify: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export default function MarketplaceBadges({ listings = [] }: MarketplaceBadgesProps) {
  if (!listings || listings.length === 0) {
    return (
      <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-500">
        Not Connected
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {listings.map((listing) => {
        const style = marketplaceStyles[listing.marketplace] || "bg-slate-50 text-slate-700 border-slate-200";
        return (
          <span
            key={listing.id || listing.marketplace}
            className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${style}`}
          >
            {listing.marketplace}
          </span>
        );
      })}
    </div>
  );
}