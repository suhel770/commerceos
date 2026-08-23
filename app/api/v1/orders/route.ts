import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { ordersApplication } from "@/lib/application/orders.application";
import { createOrderSchema } from "@/lib/validation/orders.schema";

export async function GET(request: Request) {
  const context = requestContext(request);

  try {
    const params = new URL(request.url).searchParams;
    const productId = params.get("productId") ?? undefined;
    const dateFrom = params.get("dateFrom") ?? undefined;
    const dateTo = params.get("dateTo") ?? undefined;
    const data = await ordersApplication.list(context, {
      productId,
      dateFrom,
      dateTo,
    });
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}

export async function POST(request: Request) {
  const context = requestContext(request);

  try {
    const body = createOrderSchema.parse(await request.json());
    const data = await ordersApplication.create(context, body);
    return successResponse(context, data, 201);
  } catch (error) {
    return errorResponse(context, error);
  }
}
