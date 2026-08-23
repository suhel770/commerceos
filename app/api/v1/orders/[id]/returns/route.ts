import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { ordersApplication } from "@/lib/application/orders.application";
import { openReturnSchema } from "@/lib/validation/orders.schema";

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
    const body = openReturnSchema.parse(await request.json());
    const data = await ordersApplication.openReturn(context, id, body);
    return successResponse(context, data, 201);
  } catch (error) {
    return errorResponse(context, error);
  }
}
