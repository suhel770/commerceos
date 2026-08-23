import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { purchaseApplication } from "@/lib/application/purchase.application";
import { transitionPurchaseBillSchema } from "@/lib/validation/purchase.schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, routeContext: RouteContext) {
  const context = requestContext(request);

  try {
    const { id } = await routeContext.params;
    const body = transitionPurchaseBillSchema.parse(await request.json());
    const data = await purchaseApplication.transitionBill(
      context,
      id,
      body.status,
    );
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
