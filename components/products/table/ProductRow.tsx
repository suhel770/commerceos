"use client";

import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types/product";
import { getProductSlug } from "@/lib/products/slug";

import ProductCell from "./cells/ProductCell";
import MarketplaceBadges from "./badges/MarketplaceBadges";
import StatusCell from "./cells/StatusCell";
import HealthCell from "./cells/HealthCell";
import ActionCell from "./cells/ActionCell";

interface ProductRowProps {
  product: Product;
  selected: boolean;
  onToggle: () => void;
  onViewClick?: () => void;
  onUniversalListingClick?: (product: Product) => void;
}

export default function ProductRow({
  product,
  selected,
  onToggle,
  onUniversalListingClick,
}: ProductRowProps) {
  const router = useRouter();
  const ats = product.inventory?.available ?? 0;
  const reserved = product.inventory?.reserved ?? 0;
  const damaged = product.inventory?.damaged ?? 0;
  const hasListings = Boolean(product.listings && product.listings.length > 0);
  const productSlug = getProductSlug(product);

  const handleRowClick = (e: React.MouseEvent<HTMLTableRowElement>) => {
    const target = e.target as HTMLElement;
    // Don't navigate if clicking inside buttons, links, inputs, or interactive menus
    if (target.closest("button, a, input, select, [role='button'], [data-prevent-row-click='true']")) {
      return;
    }
    const currentOrigin = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/products/list";
    router.push(`/products/${productSlug}?from=${encodeURIComponent(currentOrigin)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === "Enter") {
      const target = e.target as HTMLElement;
      if (target.tagName === "TR" || target.getAttribute("role") === "row") {
        e.preventDefault();
        const currentOrigin = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/products/list";
        router.push(`/products/${productSlug}?from=${encodeURIComponent(currentOrigin)}`);
      }
    }
  };

  return (
    <tr
      onClick={handleRowClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="row"
      aria-label={`Product ${product.name}, SKU ${product.sku}`}
      className={`
        group
        cursor-pointer
        border-b
        border-slate-100
        transition-colors
        duration-150
        hover:bg-blue-50/50
        focus-visible:bg-blue-50/60
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-inset
        focus-visible:ring-blue-500
        ${selected ? "bg-blue-50/70 ring-1 ring-inset ring-blue-200" : ""}
      `}
    >
      <td
        className="w-10 px-3 py-3.5 text-center align-middle"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          aria-label={`Select ${product.name}`}
          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
        />
      </td>

      <td className="min-w-[280px] px-3 py-3.5 align-middle">
        <ProductCell product={product} />
      </td>

      <td className="w-24 px-3 py-3.5 text-right align-middle">
        <span
          className={`font-mono text-sm font-bold ${
            ats > 10 ? "text-emerald-600" : ats > 0 ? "text-amber-600" : "text-rose-600"
          }`}
        >
          {ats}
        </span>
      </td>

      <td className="w-24 px-3 py-3.5 text-right align-middle">
        <span className="font-mono text-sm font-semibold text-slate-600">
          {reserved}
        </span>
      </td>

      <td className="w-24 px-3 py-3.5 text-right align-middle">
        <span
          className={`font-mono text-sm font-semibold ${
            damaged > 0 ? "text-rose-500 font-bold" : "text-slate-400"
          }`}
        >
          {damaged}
        </span>
      </td>

      <td className="w-40 px-3 py-3.5 text-center align-middle">
        <MarketplaceBadges
          listings={product.listings}
          onBadgeClick={() => onUniversalListingClick?.(product)}
        />
      </td>

      <td className="w-32 px-3 py-3.5 text-center align-middle">
        <StatusCell status={product.status} hasListings={hasListings} />
      </td>

      <td className="w-36 px-3 py-3.5 text-center align-middle">
        <HealthCell product={product} />
      </td>

      <td className="w-24 px-3 py-3.5 text-center align-middle">
        <ActionCell
          slug={productSlug}
          onUniversalListingClick={() => onUniversalListingClick?.(product)}
        />
      </td>
    </tr>
  );
}