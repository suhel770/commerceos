interface Props {
  productId: string;
  listingId: string;
}

export default function ListingPricing({
  productId,
  listingId,
}: Props) {
  return (
    <div>
      <h2 className="text-xl font-semibold">
        Pricing
      </h2>
    </div>
  );
}