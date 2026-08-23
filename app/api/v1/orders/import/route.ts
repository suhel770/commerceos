import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { ordersApplication } from "@/lib/application/orders.application";
import { createOrderSchema } from "@/lib/validation/orders.schema";

export async function POST(request: Request) {
  const context = requestContext(request);

  try {
    const body = createOrderSchema.parse(await request.json());
    const data = await ordersApplication.import(context, body);
    return successResponse(context, data, 201);
  } catch (error) {
    return errorResponse(context, error);
  }
}
