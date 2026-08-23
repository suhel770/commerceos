/** CommerceOS Purchase Orders Route API */
import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { purchaseApplication } from "@/lib/application/purchase.application";
import { createPurchaseOrderSchema } from "@/lib/validation/purchase.schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = requestContext(request);

  try {
    const data = await purchaseApplication.listOrders(context);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}

export async function POST(request: Request) {
  const context = requestContext(request);

  try {
    const body = createPurchaseOrderSchema.parse(await request.json());
    const data = await purchaseApplication.createOrder(context, body);
    return successResponse(context, data, 201);
  } catch (error) {
    return errorResponse(context, error);
  }
}
