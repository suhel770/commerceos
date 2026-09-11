"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  Barcode,
  FileText,
  Package,
  Percent,
  Tag,
  Boxes,
} from "lucide-react";

import type { Product } from "@/lib/types/product";
import { getUniversalProductId } from "@/lib/products/product-id-utils";

interface Props {
  product: Product;
}

/**
 * Validates that a route candidate is a safe relative internal CommerceOS path.
 */
function isValidInternalCommerceOSRoute(url: string | null | undefined): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  // Must start with single slash, not protocol-relative // or external schemes
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return false;
  if (trimmed.includes(":") || trimmed.toLowerCase().includes("javascript") || trimmed.toLowerCase().includes("data")) {
    return false;
  }
  return true;
}

/**
 * Resolves the exact originating route for the Product Workspace Back button.
 */
function getReturnDestination(fromQuery?: string | null): string {
  // 1. Check passed fromQuery from useSearchParams
  let candidate = fromQuery;

  // 2. Direct read from window.location.search if not passed or not yet hydrated
  if (!candidate && typeof window !== "undefined") {
    try {
      candidate = new URLSearchParams(window.location.search).get("from");
    } catch {}
  }

  if (candidate) {
    try {
      const decoded = decodeURIComponent(candidate);
      if (isValidInternalCommerceOSRoute(decoded)) {
        return decoded;
      }
    } catch {}
    if (isValidInternalCommerceOSRoute(candidate)) {
      return candidate;
    }
  }

  // 3. Check sessionStorage for the last active Product List view
  if (typeof window !== "undefined") {
    try {
      const stored = sessionStorage.getItem("commerceos_last_product_list_url");
      if (stored && isValidInternalCommerceOSRoute(stored)) {
        return stored;
      }
    } catch {}
  }

  // 4. Safe deterministic fallback: Product List (never Overview/Dashboard)
  return "/products/list";
}

export default function TopMetadataStrip({ product }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromUrl = searchParams?.get("from");

  const returnDestination = getReturnDestination(fromUrl);
  const productName = typeof product?.name === "string" && product.name.trim().length > 0
    ? product.name
    : product?.sku || "Product";

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const currentSearch = typeof window !== "undefined" ? window.location.search : "";
    const rawFrom = fromUrl || new URLSearchParams(currentSearch).get("from");
    const target = getReturnDestination(rawFrom);

    // Strip any ?from= param so the destination page gets a clean URL with no inherited params
    let cleanTarget = target;
    try {
      const url = new URL(target, "http://x");
      url.searchParams.delete("from");
      cleanTarget = url.pathname + (url.search && url.search !== "?" ? url.search : "");
    } catch {}

    router.push(cleanTarget);
  };

  // Product detail page should never carry forward a ?from= param.
  // Strip it from returnDestination so the breadcrumb link on product detail page is clean.
  const cleanReturnDestination = (() => {
    try {
      const url = new URL(returnDestination, "http://x");
      url.searchParams.delete("from");
      return url.pathname + (url.search !== "?" ? url.search : "");
    } catch {
      return returnDestination;
    }
  })();

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 backdrop-blur-md shadow-xs">
      <div className="flex flex-col gap-3 px-4 py-2.5 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        {/* Left Side: Breadcrumb & Back Action */}
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Back to previous page"
            title="Back to previous page"
            className="inline-flex shrink-0 items-center justify-center text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex min-w-0 items-center gap-1.5 text-xs">
            <Link
              href={cleanReturnDestination}
              className="font-bold text-slate-400 hover:text-slate-700 transition"
            >
              Products
            </Link>
            <span className="shrink-0 text-slate-350 select-none">/</span>
            <span className="truncate font-black text-slate-800">
              {productName}
            </span>
          </div>
        </div>

        {/* Right Side: Metadata Badges Grid */}
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 lg:justify-end">
          <MetaItem
            icon={<Tag size={13} />}
            iconClassName="bg-indigo-50 text-indigo-600 border border-indigo-100"
            title="Product ID"
            value={getUniversalProductId(product)}
          />

          <Divider />

          <MetaItem
            icon={<Package size={13} />}
            iconClassName="bg-blue-50 text-blue-600 border border-blue-100"
            title="SKU"
            value={product.sku}
          />

          <Divider />

          <MetaItem
            icon={<Barcode size={13} />}
            iconClassName="bg-violet-50 text-violet-600 border border-violet-100"
            title="Barcode"
            value={product.barcode || "—"}
          />

          {product.category && product.category !== "General" && (
            <>
              <Divider />
              <MetaItem
                icon={<Tag size={13} />}
                iconClassName="bg-amber-50 text-amber-600 border border-amber-100"
                title="Category"
                value={product.category}
              />
            </>
          )}

          {product.brand && product.brand !== "CommerceOS" && (
            <>
              <Divider />
              <MetaItem
                icon={<Boxes size={13} />}
                iconClassName="bg-emerald-50 text-emerald-600 border border-emerald-100"
                title="Brand"
                value={product.brand}
              />
            </>
          )}

          <Divider />

          <MetaItem
            icon={<FileText size={13} />}
            iconClassName="bg-sky-50 text-sky-600 border border-sky-100"
            title="HSN"
            value={product.hsn ?? "—"}
          />

          <Divider />

          <MetaItem
            icon={<Percent size={13} />}
            iconClassName="bg-rose-50 text-rose-600 border border-rose-100"
            title="GST"
            value={product.gstRate !== undefined ? `${product.gstRate}%` : "—"}
          />
        </div>
      </div>
    </div>
  );
}

function Divider() {
  return (
    <div
      aria-hidden="true"
      className="hidden h-5 w-px bg-slate-200/85 sm:block"
    />
  );
}

interface MetaItemProps {
  icon: React.ReactNode;
  iconClassName: string;
  title: string;
  value: string;
}

function MetaItem({ icon, iconClassName, title, value }: MetaItemProps) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`flex h-6.5 w-6.5 shrink-0 items-center justify-center rounded-lg shadow-2xs ${iconClassName}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[8px] font-black uppercase tracking-wider text-slate-400 leading-none">
          {title}
        </p>
        <p className="truncate text-xs font-bold text-slate-700 leading-none mt-1">
          {value}
        </p>
      </div>
    </div>
  );
}
