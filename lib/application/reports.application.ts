/**
 * CommerceOS V4 — Reports Application Service Layer
 * Handles authorization checks, tenant security scoping, and analytical report aggregation
 */

import { reportsService } from "@/lib/reports/service";
import { assertWorkspaceAccess, authorize } from "@/lib/platform/authorization";
import type { CommerceContext } from "@/lib/platform/commerce-context";

class ReportsApplicationService {
  public async getAnalytics(context: CommerceContext, period?: string) {
    authorize(context, "reports.view");
    assertWorkspaceAccess(context, context.workspaceId);

    return reportsService.getAnalyticsSummary({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      period,
    });
  }
}

export const reportsApplication = new ReportsApplicationService();
