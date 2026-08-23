/**
 * CommerceOS V4 — Finance Application Service Layer
 * Handles authorization checks, tenant security scoping, and financial domain orchestrations
 */

import { financeService } from "@/lib/finance/service";
import { assertWorkspaceAccess, authorize } from "@/lib/platform/authorization";
import type { CommerceContext } from "@/lib/platform/commerce-context";

class FinanceApplicationService {
  public async getSummary(context: CommerceContext) {
    authorize(context, "finance.view");
    assertWorkspaceAccess(context, context.workspaceId);

    return financeService.getPnLSummary({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
    });
  }

  public async listTransactions(context: CommerceContext) {
    authorize(context, "finance.view");
    assertWorkspaceAccess(context, context.workspaceId);

    return financeService.listTransactions({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
    });
  }

  public async getCashflow(context: CommerceContext) {
    authorize(context, "finance.view");
    assertWorkspaceAccess(context, context.workspaceId);

    return financeService.getCashflowSummary({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
    });
  }

  public async getTaxSummary(context: CommerceContext) {
    authorize(context, "finance.view");
    assertWorkspaceAccess(context, context.workspaceId);

    return financeService.getTaxSummary({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
    });
  }
}

export const financeApplication = new FinanceApplicationService();
