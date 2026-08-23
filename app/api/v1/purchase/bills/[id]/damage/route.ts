import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { purchaseApplication } from "@/lib/application/purchase.application";
import { recordPurchaseLineDamageSchema } from "@/lib/validation/purchase.schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, routeContext: RouteContext) {
  const context = requestContext(request);

  try {
    const { id } = await routeContext.params;
    const body = recordPurchaseLineDamageSchema.parse(await request.json());
    const data = await purchaseApplication.recordLineDamage(
      context,
      id,
      body.lineId,
      body.qtyDamaged,
    );
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
