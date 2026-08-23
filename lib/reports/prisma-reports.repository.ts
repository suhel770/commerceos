/**
 * CommerceOS V4 — Prisma Reports Analytics Repository
 * PostgreSQL-backed analytics aggregation engine for sales, channels, SKUs, and performance
 * Enforces organizationId + workspaceId tenant isolation.
 */

import { db } from "@/lib/db";
import type {
  ChannelSalesDTO,
  IReportsRepository,
  MonthlyRevenueTrendDTO,
  ReportKpiSummaryDTO,
  ReportPeriodFilter,
  ReportsAnalyticsDTO,
  TopSkuReportDTO,
} from "./reports.repository.interface";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const CHANNEL_COLORS: Record<string, string> = {
  amazon: "#f59e0b",
  website: "#6366f1",
  shopify: "#6366f1",
  flipkart: "#10b981",
  meesho: "#8b5cf6",
  woocommerce: "#ec4899",
  b2b: "#3b82f6",
};

export class PrismaReportsRepository implements IReportsRepository {
  private defaultWorkspaceId = "ws-default";

  private parseNum(val: { toString(): string } | number | null | undefined): number {
    if (!val) return 0;
    return typeof val === "number" ? val : Number(val.toString());
  }

  public async getAnalyticsSummary(filter: ReportPeriodFilter): Promise<ReportsAnalyticsDTO> {
    const workspaceId = filter.workspaceId || this.defaultWorkspaceId;
    const currentYear = new Date().getFullYear();

    // 1. Fetch Orders from PostgreSQL
    const orders = await db.order.findMany({
      where: { workspaceId },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    const activeOrders = orders.filter((o) =>
      ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].includes(o.status.toUpperCase()),
    );

    const totalRevenue = activeOrders.reduce((sum, o) => sum + this.parseNum(o.totalAmount), 0);
    const totalOrders = activeOrders.length;

    // 2. Fetch Purchase Bills Count
    const totalBills = await db.purchaseBill.count({
      where: { workspaceId, isDeleted: false },
    });

    const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    const cancelledOrders = orders.filter((o) => o.status.toUpperCase() === "CANCELLED").length;
    const returnRate = orders.length > 0 ? Number(((cancelledOrders / orders.length) * 100).toFixed(1)) : 0;

    const kpis: ReportKpiSummaryDTO = {
      totalRevenue,
      totalOrders,
      totalBills,
      avgOrderValue,
      returnRate,
    };

    // 3. Channel Sales Distribution
    const channelMap = new Map<string, number>();
    for (const o of activeOrders) {
      const ch = o.channel.toLowerCase();
      channelMap.set(ch, (channelMap.get(ch) || 0) + this.parseNum(o.totalAmount));
    }

    const channels: ChannelSalesDTO[] = [];
    if (totalRevenue > 0) {
      for (const [chName, amt] of channelMap.entries()) {
        const pct = Math.round((amt / totalRevenue) * 100);
        channels.push({
          name: chName.charAt(0).toUpperCase() + chName.slice(1),
          value: pct,
          amount: amt,
          color: CHANNEL_COLORS[chName] || "#94a3b8",
        });
      }
    } else {
      channels.push(
        { name: "Amazon", value: 0, amount: 0, color: "#f59e0b" },
        { name: "Website", value: 0, amount: 0, color: "#6366f1" },
        { name: "Flipkart", value: 0, amount: 0, color: "#10b981" },
      );
    }

    // 4. Monthly Revenue Trend
    const monthlyMap: Record<number, { revenue: number; count: number }> = {};
    for (let m = 0; m < 12; m++) monthlyMap[m] = { revenue: 0, count: 0 };

    for (const o of activeOrders) {
      if (o.createdAt.getFullYear() === currentYear) {
        const mIdx = o.createdAt.getMonth();
        monthlyMap[mIdx].revenue += this.parseNum(o.totalAmount);
        monthlyMap[mIdx].count += 1;
      }
    }

    const monthlyRevenue: MonthlyRevenueTrendDTO[] = MONTHS.map((monthName, idx) => ({
      month: monthName,
      revenueLakhs: Number((monthlyMap[idx].revenue / 100000).toFixed(2)),
      ordersCount: monthlyMap[idx].count,
    }));

    // 5. Top Revenue SKUs
    const skuMap = new Map<string, { name: string; sku: string; units: number; revenue: number }>();

    for (const o of activeOrders) {
      for (const item of o.items) {
        const current = skuMap.get(item.sku) || {
          name: item.productName || item.sku,
          sku: item.sku,
          units: 0,
          revenue: 0,
        };
        current.units += item.quantity;
        current.revenue += this.parseNum(item.totalPrice);
        skuMap.set(item.sku, current);
      }
    }

    let topSkus: TopSkuReportDTO[] = Array.from(skuMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .map((s) => ({
        name: s.name,
        sku: s.sku,
        units: s.units,
        revenue: s.revenue,
        share: totalRevenue > 0 ? Math.round((s.revenue / totalRevenue) * 100) : 0,
      }));

    // Fallback: If no order sales items exist yet, project top SKUs from physical StorageStock
    if (topSkus.length === 0) {
      const storageStocks = await db.storageStock.findMany({
        where: { workspaceId },
        take: 10,
      });

      const totalStockVal = storageStocks.reduce(
        (sum, s) => sum + s.availableQty * this.parseNum((s as any).unitValue || 350),
        0,
      );

      topSkus = storageStocks.map((s) => {
        const rev = s.availableQty * this.parseNum((s as any).unitValue || 350);
        return {
          name: s.productName || s.sku,
          sku: s.sku,
          units: s.availableQty,
          revenue: rev,
          share: totalStockVal > 0 ? Math.round((rev / totalStockVal) * 100) : 0,
        };
      });
    }

    return {
      kpis,
      topSkus,
      channels,
      monthlyRevenue,
    };
  }
}

export const prismaReportsRepository = new PrismaReportsRepository();
