/**
 * CommerceOS V4 — Reports Analytics Domain Service
 */

import type { IReportsRepository, ReportPeriodFilter, ReportsAnalyticsDTO } from "./reports.repository.interface";
import { prismaReportsRepository } from "./prisma-reports.repository";

export class ReportsService {
  constructor(private repo: IReportsRepository = prismaReportsRepository) {}

  public async getAnalyticsSummary(filter: ReportPeriodFilter): Promise<ReportsAnalyticsDTO> {
    return this.repo.getAnalyticsSummary(filter);
  }
}

export const reportsService = new ReportsService();
