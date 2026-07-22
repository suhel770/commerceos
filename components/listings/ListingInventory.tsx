interface Props {
  productId: string;
  listingId: string;
}

export default function ListingInventory({
  productId,
  listingId,
}: Props) {
  return (
    <div>
      <h2 className="text-xl font-semibold">
        Inventory
      </h2>
    </div>
  );
}