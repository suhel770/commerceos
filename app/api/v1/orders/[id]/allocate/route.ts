import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { ordersApplication } from "@/lib/application/orders.application";
import { allocateOrderSchema } from "@/lib/validation/orders.schema";

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
      allocateOrderSchema.parse(JSON.parse(raw));
    }
    const data = await ordersApplication.allocate(context, id);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
