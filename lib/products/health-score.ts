import { Product } from "@/lib/types/product";

export interface HealthCheckResult {
  score: number;
  grade: "Optimal" | "Good" | "Needs Attention" | "Incomplete";
  colorClass: string;
  badgeClass: string;
  checks: {
    label: string;
    passed: boolean;
    weight: number;
  }[];
  missingItems: string[];
}

/**
 * Calculates a deterministic checklist-based health score for any Product / Master Listing.
 * Total possible score: 100%
 */
export function calculateProductHealth(product: Product): HealthCheckResult {
  const checks = [
    {
      label: "Product Name & Brand",
      passed: Boolean(product.name && product.name.trim().length > 2 && product.brand),
      weight: 15,
    },
    {
      label: "SKU Identifier",
      passed: Boolean(product.sku && product.sku.trim().length > 1),
      weight: 15,
    },
    {
      label: "Category & Classification",
      passed: Boolean(product.category && product.category.trim().length > 0),
      weight: 15,
    },
    {
      label: "Pricing Configured (Selling & Cost)",
      passed: Boolean(
        product.pricing &&
          Number(product.pricing.sellingPrice) > 0 &&
          Number(product.pricing.costPrice) > 0
      ),
      weight: 15,
    },
    {
      label: "Tax & HSN Code",
      passed: Boolean(product.hsn && product.hsn.trim().length >= 4),
      weight: 10,
    },
    {
      label: "Inventory Available (ATS > 0)",
      passed: Boolean(product.inventory && Number(product.inventory.available) > 0),
      weight: 15,
    },
    {
      label: "Product Images & Media",
      passed: Boolean(
        (product.gallery && product.gallery.length > 0) ||
          (product.image && product.image.trim().length > 0 && product.image !== "{}")
      ),
      weight: 10,
    },
    {
      label: "Channel / Marketplace Mapping",
      passed: Boolean(product.listings && product.listings.length > 0),
      weight: 5,
    },
  ];

  let score = 0;
  const missingItems: string[] = [];

  for (const check of checks) {
    if (check.passed) {
      score += check.weight;
    } else {
      missingItems.push(check.label);
    }
  }

  let grade: HealthCheckResult["grade"] = "Optimal";
  let colorClass = "text-emerald-600";
  let badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";

  if (score >= 90) {
    grade = "Optimal";
    colorClass = "text-emerald-600";
    badgeClass = "bg-emerald-50 text-emerald-700 border-emerald-200";
  } else if (score >= 70) {
    grade = "Good";
    colorClass = "text-blue-600";
    badgeClass = "bg-blue-50 text-blue-700 border-blue-200";
  } else if (score >= 50) {
    grade = "Needs Attention";
    colorClass = "text-amber-600";
    badgeClass = "bg-amber-50 text-amber-700 border-amber-200";
  } else {
    grade = "Incomplete";
    colorClass = "text-rose-600";
    badgeClass = "bg-rose-50 text-rose-700 border-rose-200";
  }

  return {
    score,
    grade,
    colorClass,
    badgeClass,
    checks,
    missingItems,
  };
}
