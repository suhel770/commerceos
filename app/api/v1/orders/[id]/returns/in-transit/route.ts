import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { ordersApplication } from "@/lib/application/orders.application";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  _request: Request,
  routeContext: RouteContext,
) {
  const context = requestContext(_request);

  try {
    const { id } = await routeContext.params;
    const data = await ordersApplication.markReturnInTransit(context, id);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
