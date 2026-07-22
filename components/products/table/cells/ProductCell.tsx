import Link from "next/link";
import Image from "next/image";

import { Product } from "@/lib/types/product";
import MarketplaceBadges from "../badges/MarketplaceBadges";

interface ProductCellProps {
  product: Product;
}

export default function ProductCell({
  product,
}: ProductCellProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block rounded-xl p-2 -m-2 transition-all duration-200 hover:bg-blue-50/60"
    >
      <div className="flex items-center gap-3">

        <div className="h-12 w-12 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 transition-transform duration-200 group-hover:scale-105">

          <Image
            src={product.image}
            alt={product.name}
            width={48}
            height={48}
            className="h-full w-full object-cover"
          />

        </div>

        <div className="min-w-0 flex-1">

          <h3 className="truncate text-[15px] font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
            {product.name}
          </h3>

          <p className="text-[11px] text-slate-500">
            {product.category}
          </p>

          <p className="mt-0.5 text-[11px] text-slate-400">
            SKU • {product.sku}
          </p>

          <div className="mt-1.5">
            <MarketplaceBadges
              listings={product.listings}
            />
          </div>

        </div>

      </div>
    </Link>
  );
}