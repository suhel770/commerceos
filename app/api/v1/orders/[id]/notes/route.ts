import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { ordersApplication } from "@/lib/application/orders.application";
import { addNoteSchema } from "@/lib/validation/orders.schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, routeContext: RouteContext) {
  const context = requestContext(request);
  try {
    const { id } = await routeContext.params;
    const body = addNoteSchema.parse(await request.json());
    const data = await ordersApplication.addNote(context, id, body.body);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
