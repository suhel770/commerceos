import type { Product } from "@/lib/types/product";

export interface BusinessInsight {
  id: string;

  priority: "high" | "medium" | "low";

  title: string;

  description: string;

  impact: string;
}

export function generateBusinessInsights(
  product: Product
): BusinessInsight[] {

  const insights: BusinessInsight[] = [];

  /* Inventory */

  if (product.inventory.available < 30) {

    insights.push({
      id: "inventory",

      priority: "high",

      title: "Low Inventory",

      description:
        "Current stock may not be enough for upcoming demand.",

      impact:
        "Restock soon to avoid losing sales.",
    });

  }

  /* Margin */

  if (product.pricing.margin > 45) {

    insights.push({
      id: "margin",

      priority: "medium",

      title: "Healthy Margin",

      description:
        "This product has excellent gross margin.",

      impact:
        "Consider increasing ad spend.",
    });

  }

  /* Returns */

  if (
    product.performance.returnsPercentage < 2
  ) {

    insights.push({
      id: "returns",

      priority: "low",

      title: "Excellent Return Rate",

      description:
        "Customers are satisfied with this product.",

      impact:
        "Low refund risk.",
    });

  }

  /* Listing Health */

  const synced =
    product.listings.filter(
      (listing) => listing.stockSync
    ).length;

  if (
    synced === product.listings.length
  ) {

    insights.push({
      id: "sync",

      priority: "low",

      title: "Listings Synced",

      description:
        "All connected channels are synchronized.",

      impact:
        "Inventory consistency maintained.",
    });

  }

  return insights;
}