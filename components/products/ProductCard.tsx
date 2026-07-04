import {
  Eye,
  MoreVertical,
  Pencil,
} from "lucide-react";

import MarketplaceBadge from "./MarketplaceBadge";
import ProductMetrics from "./ProductMetrics";
import StatusBadge from "./StatusBadge";
import Link from "next/link";
import { Product } from "@/lib/types/product";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({
  product,
}: ProductCardProps) {
  return (
    <Link href={`/products/${product.id}`}
  className="block"
>
  <div className="group border-b border-slate-100 bg-white p-6 transition-all duration-300 hover:-translate-y-[2px] hover:bg-slate-50 hover:shadow-md">

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

        {/* LEFT */}

        <div className="flex items-center gap-5 flex-1">

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-3xl">
            {product.image}
          </div>

          <div className="min-w-0">

            <h3 className="text-lg font-bold text-slate-900">
              {product.name}
            </h3>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">

              <span>{product.category}</span>

              <span>•</span>

              <span className="font-medium text-slate-700">
                SKU: {product.sku}
              </span>

            </div>

            
            <div className="mt-3 flex flex-wrap gap-2">

  {product.listings.map((listing) => (
    <MarketplaceBadge
      key={listing.id}
      marketplace={listing.marketplace}
    />
  ))}

</div>

            

          </div>

        </div>

        {/* RIGHT */}

        <div className="flex flex-col items-end gap-4">

          <StatusBadge status={product.stock > 0 ? "Active" : "Out of Stock"} />

          <div className="flex items-center gap-1">

            <button className="rounded-lg p-2 text-slate-500 transition hover:bg-blue-100 hover:text-blue-600">
              <Eye size={17} />
            </button>

            <button className="rounded-lg p-2 text-slate-500 transition hover:bg-amber-100 hover:text-amber-600">
              <Pencil size={17} />
            </button>

            <button className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100">
              <MoreVertical size={17} />
            </button>

          </div>

        </div>

      </div>

      <ProductMetrics
        sellingPrice={product.listings[0]?.sellingPrice ?? 0}
        costPrice={product.costPrice}
        stock={product.stock}
        sold30Days={product.sold30Days}
      />

    </div>
    </Link>
  );
}