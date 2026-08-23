import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { ordersApplication } from "@/lib/application/orders.application";
import { generateDocumentSchema } from "@/lib/validation/orders.schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, routeContext: RouteContext) {
  const context = requestContext(request);
  try {
    const { id } = await routeContext.params;
    const body = generateDocumentSchema.parse(await request.json());
    const data = await ordersApplication.generateDocument(
      context,
      id,
      body.type,
    );
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
