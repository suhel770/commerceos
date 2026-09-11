import { db } from "@/lib/db";
import { productRepository } from "@/lib/repositories/product.repository";
import { calculateProductHealth } from "@/lib/products/health-score";
import type { CommerceContext } from "@/lib/platform/commerce-context";
import { authorize, assertWorkspaceAccess } from "@/lib/platform/authorization";
import type { Product } from "@/lib/types/product";

export interface AttentionItem {
  id: string;
  title: string;
  description: string;
  count: number;
  severity: "critical" | "warning" | "info";
  actionLabel: string;
  filter: string;
}

export interface MarketplaceStatsItem {
  name: string;
  published: number;
  pending: number;
  error: number;
  total: number;
}

export interface TopProductItem {
  id: string;
  sku: string;
  name: string;
  image?: string;
  brand?: string;
  unitsSold: number;
  revenue: number;
  ordersCount: number;
}

export interface ProductDashboardData {
  kpis: {
    total: number;
    active: number;
    listed: number;
    pendingList: number;
    listingErrors: number;
    issues: number;
  };
  catalogStatus: {
    total: number;
    segments: {
      name: string;
      value: number;
      percentage: number;
      color: string;
      filter: string;
    }[];
  };
  listingPipeline: {
    total: number;
    stages: {
      label: string;
      count: number;
      percentage: number;
      color: string;
      filter: string;
    }[];
  };
  catalogHealth: {
    averageScore: number;
    segments: {
      name: string;
      value: number;
      percentage: number;
      color: string;
      filter: string;
    }[];
  };
  inventoryHealth: {
    total: number;
    signals: {
      label: string;
      count: number;
      percentage: number;
      color: string;
      filter: string;
    }[];
  };
  attentionItems: AttentionItem[];
  marketplaceStats: MarketplaceStatsItem[];
  topPerformingProducts: TopProductItem[];
  recentActivities: {
    id: string;
    action: string;
    actorName: string;
    createdAt: string;
    entityId?: string;
  }[];
}

class ProductDashboardApplicationService {
  async getMetrics(context: CommerceContext): Promise<ProductDashboardData> {
    authorize(context, "products.view");
    assertWorkspaceAccess(context, context.workspaceId);

    // 1. Query real products for current tenant workspace
    const products = await productRepository.findAll({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
    });

    // 2. Primary KPI Calculations
    const total = products.length;
    const active = products.filter((p) => p.status === "Active").length;
    const listed = products.filter(
      (p) =>
        p.listings &&
        p.listings.some(
          (l) =>
            l.status === "Live" ||
            l.status === "active" ||
            l.status === "Published" ||
            l.listingStatus === "Live"
        )
    ).length;
    const pendingList = products.filter(
      (p) => p.status === "Draft" || !p.listings || p.listings.length === 0
    ).length;
    const listingErrors = products.filter(
      (p) =>
        p.listings &&
        p.listings.some(
          (l) =>
            l.status?.toLowerCase().includes("err") ||
            l.status?.toLowerCase().includes("fail")
        )
    ).length;

    const issues = products.filter((p) => {
      const h = calculateProductHealth(p);
      const isOutOfStock = (p.inventory?.available ?? 0) === 0;
      const hasError =
        p.listings &&
        p.listings.some(
          (l) =>
            l.status?.toLowerCase().includes("err") ||
            l.status?.toLowerCase().includes("fail")
        );
      const isMissingPrice = !p.pricing?.sellingPrice || !p.pricing?.costPrice;
      return h.score < 70 || isOutOfStock || hasError || isMissingPrice;
    }).length;

    // 3. Catalog Status Breakdown (Mutually exclusive sum to Total)
    let activeListedCount = 0;
    let activeUnlistedCount = 0;
    let draftCount = 0;
    let inactiveCount = 0;

    for (const p of products) {
      if (p.status === "Draft") {
        draftCount++;
      } else if (p.status === "Archived" || p.status === "Inactive") {
        inactiveCount++;
      } else if (p.status === "Active") {
        const hasListing =
          p.listings &&
          p.listings.some(
            (l) =>
              l.status === "Live" ||
              l.status === "active" ||
              l.status === "Published" ||
              l.listingStatus === "Live"
          );
        if (hasListing) {
          activeListedCount++;
        } else {
          activeUnlistedCount++;
        }
      } else {
        inactiveCount++;
      }
    }

    const catalogStatusSegments = [
      {
        name: "Active (Listed)",
        value: activeListedCount,
        percentage: total > 0 ? Math.round((activeListedCount / total) * 100) : 0,
        color: "#10b981",
        filter: "marketplace=all",
      },
      {
        name: "Active (Unlisted)",
        value: activeUnlistedCount,
        percentage: total > 0 ? Math.round((activeUnlistedCount / total) * 100) : 0,
        color: "#f59e0b",
        filter: "status=active",
      },
      {
        name: "Draft",
        value: draftCount,
        percentage: total > 0 ? Math.round((draftCount / total) * 100) : 0,
        color: "#64748b",
        filter: "status=draft",
      },
      {
        name: "Archived / Inactive",
        value: inactiveCount,
        percentage: total > 0 ? Math.round((inactiveCount / total) * 100) : 0,
        color: "#94a3b8",
        filter: "status=archived",
      },
    ].filter((s) => s.value > 0);

    // 4. Listing Pipeline Stages
    const pipelineDraft = products.filter((p) => p.status === "Draft").length;
    const pipelineReady = products.filter((p) => {
      const h = calculateProductHealth(p);
      return (
        h.score >= 80 &&
        p.status !== "Draft" &&
        (!p.listings || p.listings.length === 0)
      );
    }).length;
    const pipelinePending = products.filter(
      (p) =>
        p.listings &&
        p.listings.some(
          (l) => l.status === "Pending" || l.status === "Syncing"
        )
    ).length;
    const pipelinePublished = listed;
    const pipelineError = listingErrors;
    const pipelineTotal =
      pipelineDraft +
      pipelineReady +
      pipelinePending +
      pipelinePublished +
      pipelineError;

    const pipelineStages = [
      {
        label: "Draft",
        count: pipelineDraft,
        percentage:
          pipelineTotal > 0
            ? Math.round((pipelineDraft / pipelineTotal) * 100)
            : 0,
        color: "bg-slate-400",
        filter: "status=draft",
      },
      {
        label: "Ready to List",
        count: pipelineReady,
        percentage:
          pipelineTotal > 0
            ? Math.round((pipelineReady / pipelineTotal) * 100)
            : 0,
        color: "bg-blue-500",
        filter: "health=optimal",
      },
      {
        label: "Pending Sync",
        count: pipelinePending,
        percentage:
          pipelineTotal > 0
            ? Math.round((pipelinePending / pipelineTotal) * 100)
            : 0,
        color: "bg-amber-500",
        filter: "",
      },
      {
        label: "Published",
        count: pipelinePublished,
        percentage:
          pipelineTotal > 0
            ? Math.round((pipelinePublished / pipelineTotal) * 100)
            : 0,
        color: "bg-emerald-500",
        filter: "marketplace=all",
      },
      {
        label: "Listing Error",
        count: pipelineError,
        percentage:
          pipelineTotal > 0
            ? Math.round((pipelineError / pipelineTotal) * 100)
            : 0,
        color: "bg-rose-500",
        filter: "status=error",
      },
    ];

    // 5. Catalog Health Distribution
    const healthScores = products.map((p) => calculateProductHealth(p).score);
    const averageHealthScore =
      healthScores.length > 0
        ? Math.round(
            healthScores.reduce((a, b) => a + b, 0) / healthScores.length
          )
        : 0;

    const optimalCount = healthScores.filter((s) => s >= 90).length;
    const goodCount = healthScores.filter((s) => s >= 70 && s < 90).length;
    const attentionCount = healthScores.filter((s) => s >= 50 && s < 70).length;
    const incompleteCount = healthScores.filter((s) => s < 50).length;

    const healthSegments = [
      {
        name: "Optimal (≥90)",
        value: optimalCount,
        percentage: total > 0 ? Math.round((optimalCount / total) * 100) : 0,
        color: "#10b981",
        filter: "health=optimal",
      },
      {
        name: "Good (70-89)",
        value: goodCount,
        percentage: total > 0 ? Math.round((goodCount / total) * 100) : 0,
        color: "#3b82f6",
        filter: "health=good",
      },
      {
        name: "Needs Attention (50-69)",
        value: attentionCount,
        percentage: total > 0 ? Math.round((attentionCount / total) * 100) : 0,
        color: "#f59e0b",
        filter: "health=attention",
      },
      {
        name: "Incomplete (<50)",
        value: incompleteCount,
        percentage: total > 0 ? Math.round((incompleteCount / total) * 100) : 0,
        color: "#ef4444",
        filter: "health=incomplete",
      },
    ].filter((s) => s.value > 0);

    // 6. Inventory Health Signals
    const healthyCount = products.filter(
      (p) => (p.inventory?.available ?? 0) > 10
    ).length;
    const lowStockCount = products.filter(
      (p) =>
        (p.inventory?.available ?? 0) > 0 && (p.inventory?.available ?? 0) <= 10
    ).length;
    const outOfStockCount = products.filter(
      (p) => (p.inventory?.available ?? 0) === 0
    ).length;

    const inventorySignals = [
      {
        label: "Healthy Stock (>10)",
        count: healthyCount,
        percentage: total > 0 ? Math.round((healthyCount / total) * 100) : 0,
        color: "bg-emerald-500",
        filter: "",
      },
      {
        label: "Low Stock (1-10)",
        count: lowStockCount,
        percentage: total > 0 ? Math.round((lowStockCount / total) * 100) : 0,
        color: "bg-amber-500",
        filter: "stockStatus=low-stock",
      },
      {
        label: "Out of Stock (0)",
        count: outOfStockCount,
        percentage: total > 0 ? Math.round((outOfStockCount / total) * 100) : 0,
        color: "bg-rose-500",
        filter: "stockStatus=out-of-stock",
      },
    ];

    // 7. Prioritized Attention Center Issues
    const attentionItems: AttentionItem[] = [];
    const missingPricingCount = products.filter(
      (p) => !p.pricing?.sellingPrice || !p.pricing?.costPrice
    ).length;
    const missingChannelsCount = products.filter(
      (p) => p.status === "Active" && (!p.listings || p.listings.length === 0)
    ).length;

    if (listingErrors > 0) {
      attentionItems.push({
        id: "listing_errors",
        title: `${listingErrors} Listing Errors`,
        description: "Marketplace publishing or sync failed",
        count: listingErrors,
        severity: "critical",
        actionLabel: "Review",
        filter: "status=error",
      });
    }

    if (outOfStockCount > 0) {
      attentionItems.push({
        id: "out_of_stock",
        title: `${outOfStockCount} Out of Stock Products`,
        description: "Zero ATS balance across warehouses",
        count: outOfStockCount,
        severity: "critical",
        actionLabel: "Restock",
        filter: "stockStatus=out-of-stock",
      });
    }

    if (missingPricingCount > 0) {
      attentionItems.push({
        id: "missing_pricing",
        title: `${missingPricingCount} Missing Commercial Pricing`,
        description: "Selling price or cost price incomplete",
        count: missingPricingCount,
        severity: "warning",
        actionLabel: "Fix",
        filter: "health=attention",
      });
    }

    if (lowStockCount > 0) {
      attentionItems.push({
        id: "low_stock",
        title: `${lowStockCount} Low Stock Products`,
        description: "Inventory below safety reorder buffer",
        count: lowStockCount,
        severity: "warning",
        actionLabel: "Review",
        filter: "stockStatus=low-stock",
      });
    }

    if (missingChannelsCount > 0) {
      attentionItems.push({
        id: "unlisted_channels",
        title: `${missingChannelsCount} Active Unlisted SKUs`,
        description: "No sales channel connections active",
        count: missingChannelsCount,
        severity: "info",
        actionLabel: "List",
        filter: "status=active",
      });
    }

    if (incompleteCount > 0) {
      attentionItems.push({
        id: "incomplete_data",
        title: `${incompleteCount} Incomplete Catalog Records`,
        description: "Health score below 50% threshold",
        count: incompleteCount,
        severity: "info",
        actionLabel: "Complete",
        filter: "health=incomplete",
      });
    }

    // 8. Marketplace Listing Performance
    const marketplaceCounts: Record<
      string,
      { published: number; pending: number; error: number; total: number }
    > = {};

    for (const p of products) {
      if (!p.listings) continue;
      for (const l of p.listings) {
        const name = l.marketplace.toLowerCase();
        if (!marketplaceCounts[name]) {
          marketplaceCounts[name] = { published: 0, pending: 0, error: 0, total: 0 };
        }
        marketplaceCounts[name].total += 1;
        if (
          l.status === "Live" ||
          l.status === "active" ||
          l.status === "Published" ||
          l.listingStatus === "Live"
        ) {
          marketplaceCounts[name].published += 1;
        } else if (
          l.status?.toLowerCase().includes("err") ||
          l.status?.toLowerCase().includes("fail")
        ) {
          marketplaceCounts[name].error += 1;
        } else {
          marketplaceCounts[name].pending += 1;
        }
      }
    }

    const marketplaceStats: MarketplaceStatsItem[] = Object.entries(
      marketplaceCounts
    ).map(([name, data]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      ...data,
    }));

    // 9. Query Real Top Performing Products from Database Orders
    let topPerformingProducts: TopProductItem[] = [];
    try {
      const orderItems = await db.orderItem.findMany({
        where: { workspaceId: context.workspaceId },
        select: {
          productId: true,
          sku: true,
          productName: true,
          quantity: true,
          totalPrice: true,
          orderId: true,
        },
        take: 200,
      });

      if (orderItems && orderItems.length > 0) {
        const productStatsMap = new Map<
          string,
          {
            sku: string;
            name: string;
            unitsSold: number;
            revenue: number;
            orders: Set<string>;
          }
        >();

        for (const item of orderItems) {
          const key = item.productId || item.sku;
          const existing = productStatsMap.get(key) || {
            sku: item.sku,
            name: item.productName,
            unitsSold: 0,
            revenue: 0,
            orders: new Set<string>(),
          };
          existing.unitsSold += item.quantity || 0;
          existing.revenue += Number(item.totalPrice || 0);
          existing.orders.add(item.orderId);
          productStatsMap.set(key, existing);
        }

        topPerformingProducts = Array.from(productStatsMap.entries())
          .map(([id, stats]) => {
            const productMatch = products.find(
              (p) => p.id === id || p.sku.toLowerCase() === stats.sku.toLowerCase()
            );
            return {
              id,
              sku: stats.sku,
              name: productMatch?.name || stats.name,
              image: productMatch?.image,
              brand: productMatch?.brand,
              unitsSold: stats.unitsSold,
              revenue: stats.revenue,
              ordersCount: stats.orders.size,
            };
          })
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);
      }
    } catch {
      topPerformingProducts = [];
    }

    // 10. Query Real Recent Audit Activities
    let recentActivities: ProductDashboardData["recentActivities"] = [];
    try {
      const logs = await db.auditLog.findMany({
        where: {
          workspaceId: context.workspaceId,
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      });

      recentActivities = logs.map((l) => ({
        id: l.id,
        action: l.action,
        actorName: l.actorName || "System",
        createdAt: l.createdAt.toISOString(),
        entityId: l.entityId,
      }));
    } catch {
      recentActivities = [];
    }

    return {
      kpis: {
        total,
        active,
        listed,
        pendingList,
        listingErrors,
        issues,
      },
      catalogStatus: {
        total,
        segments: catalogStatusSegments,
      },
      listingPipeline: {
        total: pipelineTotal,
        stages: pipelineStages,
      },
      catalogHealth: {
        averageScore: averageHealthScore,
        segments: healthSegments,
      },
      inventoryHealth: {
        total,
        signals: inventorySignals,
      },
      attentionItems,
      marketplaceStats,
      topPerformingProducts,
      recentActivities,
    };
  }
}

export const productDashboardApplication =
  new ProductDashboardApplicationService();
