"use client";

import type { Product } from "@/lib/types/product";

import ProductCell from "./cells/ProductCell";
import MarketplaceBadges from "./badges/MarketplaceBadges";
import StatusCell from "./cells/StatusCell";
import HealthCell from "./cells/HealthCell";
import ActionCell from "./cells/ActionCell";

interface ProductRowProps {
  product: Product;
  selected: boolean;
  onToggle: () => void;
}

export default function ProductRow({
  product,
  selected,
  onToggle,
}: ProductRowProps) {
  const ats = product.inventory?.available ?? 0;
  const reserved = product.inventory?.reserved ?? 0;
  const damaged = product.inventory?.damaged ?? 0;
  const hasListings = Boolean(product.listings && product.listings.length > 0);
  const slug = product.slug || product.sku?.toLowerCase() || product.id;

  return (
    <tr
      className={`
        border-b
        border-slate-100
        transition-all
        duration-150
        hover:bg-blue-50/40
        ${selected ? "bg-blue-50/70 ring-1 ring-inset ring-blue-200" : ""}
      `}
    >
      <td className="w-10 px-3 py-3.5 text-center align-middle">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
      </td>

      <td className="min-w-[280px] px-3 py-3.5 align-middle">
        <ProductCell product={product} />
      </td>

      <td className="w-24 px-3 py-3.5 text-right align-middle">
        <span
          className={`font-mono text-xs font-black ${
            ats > 10 ? "text-emerald-600" : ats > 0 ? "text-amber-600" : "text-rose-600"
          }`}
        >
          {ats}
        </span>
      </td>

      <td className="w-24 px-3 py-3.5 text-right align-middle">
        <span className="font-mono text-xs font-semibold text-slate-600">
          {reserved}
        </span>
      </td>

      <td className="w-24 px-3 py-3.5 text-right align-middle">
        <span
          className={`font-mono text-xs font-semibold ${
            damaged > 0 ? "text-rose-500 font-bold" : "text-slate-400"
          }`}
        >
          {damaged}
        </span>
      </td>

      <td className="w-40 px-3 py-3.5 text-center align-middle">
        <MarketplaceBadges listings={product.listings} />
      </td>

      <td className="w-32 px-3 py-3.5 text-center align-middle">
        <StatusCell status={product.status} hasListings={hasListings} />
      </td>

      <td className="w-36 px-3 py-3.5 text-center align-middle">
        <HealthCell product={product} />
      </td>

      <td className="w-24 px-3 py-3.5 text-center align-middle">
        <ActionCell slug={slug} />
      </td>
    </tr>
  );
}