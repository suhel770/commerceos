/**
 * CommerceOS Reports Analytics API Route
 * GET /api/v1/reports/analytics - Returns Sales, Channel, Monthly Trend, and Top SKU analytics
 */

import { errorResponse, requestContext, successResponse } from "@/lib/api/route-response";
import { reportsApplication } from "@/lib/application/reports.application";

export async function GET(request: Request) {
  const context = requestContext(request);
  try {
    const params = new URL(request.url).searchParams;
    const period = params.get("period") ?? undefined;

    const data = await reportsApplication.getAnalytics(context, period);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
