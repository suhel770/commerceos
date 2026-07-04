interface ProductMetricsProps {
  sellingPrice: number;
  costPrice: number;
  stock: number;
  sold30Days: number;
}

export default function ProductMetrics({
  sellingPrice,
  costPrice,
  stock,
  sold30Days,
}: ProductMetricsProps) {
  const margin = (
    ((sellingPrice - costPrice) / sellingPrice) *
    100
  ).toFixed(1);

  return (
    <div className="mt-6 grid grid-cols-2 gap-6 border-t border-slate-100 pt-6 md:grid-cols-5">

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Selling
        </p>

        <p className="mt-2 text-lg font-semibold">
          ₹{sellingPrice}
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Cost
        </p>

        <p className="mt-2 text-lg">
          ₹{costPrice}
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Margin
        </p>

        <p className="mt-2 font-semibold text-green-600">
          {margin}%
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Stock
        </p>

        <p className="mt-2 text-lg font-semibold">
          {stock}
        </p>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-slate-400">
          Sold (30 Days)
        </p>

        <p className="mt-2 text-lg font-semibold text-blue-600">
          {sold30Days}
        </p>
      </div>

    </div>
  );
}