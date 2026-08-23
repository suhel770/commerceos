/**
 * CommerceOS Finance Summary API Route
 * GET /api/v1/finance/summary - Returns P&L, KPIs, Cash Flow, and Tax Summary
 */

import { errorResponse, requestContext, successResponse } from "@/lib/api/route-response";
import { financeApplication } from "@/lib/application/finance.application";

export async function GET(request: Request) {
  const context = requestContext(request);
  try {
    const summary = await financeApplication.getSummary(context);
    const cashflow = await financeApplication.getCashflow(context);
    const tax = await financeApplication.getTaxSummary(context);

    return successResponse(context, {
      pnl: summary,
      cashflow,
      tax,
    });
  } catch (error) {
    return errorResponse(context, error);
  }
}
