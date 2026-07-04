interface ProductHeaderProps {
  product: {
    id: number;
    image: string;
    name: string;
    category: string;
    sku: string;
  };
}

export default function ProductHeader({
  product,
}: ProductHeaderProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">

      <div className="flex items-start justify-between">

        <div className="flex items-center gap-5">

          <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-5xl">
            {product.image}
          </div>

          <div>

            <button className="text-sm text-slate-500 transition hover:text-blue-600">
              ← Back to Products
            </button>

            <h1 className="mt-2 text-3xl font-bold">
              {product.name}
            </h1>

            <p className="mt-2 text-slate-500">
              {product.category} • SKU {product.sku} • Product ID #{product.id}
            </p>

          </div>

        </div>

        <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
          Active
        </span>

      </div>

    </div>
  );
}