interface Props {
  productId: string;
  listingId: string;
}

export default function ListingSeo({
  productId,
  listingId,
}: Props) {
  return (
    <div>
      <h2 className="text-xl font-semibold">
        SEO
      </h2>
    </div>
  );
}