import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { purchaseApplication } from "@/lib/application/purchase.application";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, routeContext: RouteContext) {
  const context = requestContext(request);

  try {
    const { id } = await routeContext.params;
    const data = await purchaseApplication.receiveGoods(context, id);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
