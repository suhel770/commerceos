interface Props {
  productId: string;
  listingId: string;
}

export default function ListingHistory({
  productId,
  listingId,
}: Props) {
  return (
    <div>
      <h2 className="text-xl font-semibold">
        History
      </h2>
    </div>
  );
}