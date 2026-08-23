import type { Product, ProductStatus } from "@/lib/types/product";

/**
 * Bible Product Lifecycle:
 * Draft → Review → Ready → Published → Active → Archived
 *
 * ProductStatus is a UI-facing subset; derive a consistent badge from
 * canonical status + live marketplace listings.
 */
export type ProductLifecycleStage =
  | "Draft"
  | "Review"
  | "Ready"
  | "Published"
  | "Active"
  | "Archived";

export function deriveProductLifecycle(
  product: Product,
): ProductLifecycleStage {
  if (product.status === "Archived") {
    return "Archived";
  }

  if (product.status === "Out of Stock") {
    return product.listings.some(
      (listing) => listing.listingStatus === "Live",
    )
      ? "Published"
      : "Ready";
  }

  const liveListings = product.listings.filter(
    (listing) => listing.listingStatus === "Live",
  ).length;

  if (liveListings > 0 || product.status === "Active") {
    return "Active";
  }

  if (product.status === "Inactive") {
    return "Published";
  }

  if (product.status === "Draft") {
    return product.listings.length > 0 ? "Ready" : "Draft";
  }

  return "Draft";
}

export function lifecycleBadgeClasses(
  stage: ProductLifecycleStage,
): string {
  switch (stage) {
    case "Active":
      return "bg-emerald-50 text-emerald-700";
    case "Published":
    case "Ready":
      return "bg-blue-50 text-blue-700";
    case "Review":
      return "bg-amber-50 text-amber-700";
    case "Archived":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-amber-50 text-amber-700";
  }
}

export function statusToLifecycleLabel(
  status: ProductStatus,
): ProductLifecycleStage {
  switch (status) {
    case "Active":
      return "Active";
    case "Archived":
      return "Archived";
    case "Inactive":
      return "Published";
    case "Out of Stock":
      return "Published";
    default:
      return "Draft";
  }
}
