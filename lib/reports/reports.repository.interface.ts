/**
 * CommerceOS V4 — Reports Analytics Repository Interface
 * Typed contract for multi-tenant analytical report aggregation
 */

export interface ReportPeriodFilter {
  organizationId?: string;
  workspaceId?: string;
  period?: string; // "This Year" | "Last 30 Days" | "Last 90 Days"
}

export interface ReportKpiSummaryDTO {
  totalRevenue: number;
  totalOrders: number;
  totalBills: number;
  avgOrderValue: number;
  returnRate: number;
}

export interface TopSkuReportDTO {
  name: string;
  sku: string;
  units: number;
  revenue: number;
  share: number;
}

export interface ChannelSalesDTO {
  name: string;
  value: number; // percentage share
  amount: number;
  color: string;
}

export interface MonthlyRevenueTrendDTO {
  month: string;
  revenueLakhs: number;
  ordersCount: number;
}

export interface ReportsAnalyticsDTO {
  kpis: ReportKpiSummaryDTO;
  topSkus: TopSkuReportDTO[];
  channels: ChannelSalesDTO[];
  monthlyRevenue: MonthlyRevenueTrendDTO[];
}

export interface IReportsRepository {
  getAnalyticsSummary(filter: ReportPeriodFilter): Promise<ReportsAnalyticsDTO>;
}
