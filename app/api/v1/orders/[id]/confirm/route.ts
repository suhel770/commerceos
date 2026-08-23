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
  request: Request,
  routeContext: RouteContext,
) {
  const context = requestContext(request);

  try {
    const { id } = await routeContext.params;
    let note: string | undefined;
    const raw = await request.text();
    if (raw.trim().length > 0) {
      const body = JSON.parse(raw) as { note?: string };
      note = typeof body.note === "string" ? body.note : undefined;
    }
    const data = await ordersApplication.confirm(context, id, note);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
