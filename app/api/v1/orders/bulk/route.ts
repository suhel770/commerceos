import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { ordersApplication } from "@/lib/application/orders.application";
import { bulkOrdersSchema } from "@/lib/validation/orders.schema";

export async function POST(request: Request) {
  const context = requestContext(request);
  try {
    const body = bulkOrdersSchema.parse(await request.json());
    const data = await ordersApplication.bulk(context, body);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
