import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { ordersApplication } from "@/lib/application/orders.application";
import { advanceShipmentEventSchema } from "@/lib/validation/orders.schema";

type RouteContext = {
  params: Promise<{ id: string; shipmentId: string }>;
};

export async function POST(
  request: Request,
  routeContext: RouteContext,
) {
  const context = requestContext(request);

  try {
    const { id, shipmentId } = await routeContext.params;
    const body = advanceShipmentEventSchema.parse(await request.json());
    const data = await ordersApplication.advanceShipmentEvent(
      context,
      id,
      shipmentId,
      body.event,
      body.note,
    );
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
