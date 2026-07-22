interface StockCellProps {
  stock: number;
}

export default function StockCell({
  stock,
}: StockCellProps) {

  const color =
    stock > 100
      ? "text-green-600"
      : stock > 20
      ? "text-orange-500"
      : "text-red-600";

  const label =
    stock > 100
      ? "In Stock"
      : stock > 20
      ? "Low Stock"
      : "Out of Stock";

  return (
    <div>

      <p className={`text-sm font-semibold ${color}`}>
        {stock}
      </p>

      <p className="mt-1 text-[11px] text-slate-500">
        {label}
      </p>

    </div>
  );
}