import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { ordersApplication } from "@/lib/application/orders.application";
import { initiateRtoSchema } from "@/lib/validation/orders.schema";

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
    const body =
      raw.trim().length === 0
        ? {}
        : initiateRtoSchema.parse(JSON.parse(raw));
    const data = await ordersApplication.initiateRto(
      context,
      id,
      body.reason,
    );
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
