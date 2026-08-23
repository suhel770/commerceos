import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { ordersApplication } from "@/lib/application/orders.application";
import { reserveOrderSchema } from "@/lib/validation/orders.schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  routeContext: RouteContext,
) {
  const context = requestContext(request);

  try {
    const { id } = await routeContext.params;
    const raw = await request.text();
    if (raw.trim().length > 0) {
      reserveOrderSchema.parse(JSON.parse(raw));
    }
    const data = await ordersApplication.reserve(context, id);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
