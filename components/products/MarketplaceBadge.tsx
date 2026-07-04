interface MarketplaceBadgeProps {
  marketplace: string;
}

export default function MarketplaceBadge({
  marketplace,
}: MarketplaceBadgeProps) {
  const styles =
    marketplace === "Amazon"
      ? "bg-orange-100 text-orange-700"
      : marketplace === "Meesho"
      ? "bg-pink-100 text-pink-700"
      : marketplace === "Shopify"
      ? "bg-green-100 text-green-700"
      : "bg-slate-100 text-slate-700";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles}`}
    >
      {marketplace}
    </span>
  );
}