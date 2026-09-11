import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { productDashboardApplication } from "@/lib/application/product-dashboard.application";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = requestContext(request);

  try {
    const data = await productDashboardApplication.getMetrics(context);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
