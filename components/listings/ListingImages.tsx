interface Props {
  productId: string;
  listingId: string;
}

export default function ListingImages({
  productId,
  listingId,
}: Props) {
  return (
    <div>
      <h2 className="text-xl font-semibold">
        Images
      </h2>
    </div>
  );
}