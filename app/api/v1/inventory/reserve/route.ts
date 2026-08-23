import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { inventoryApplication } from "@/lib/application/inventory.application";
import { inventoryReserveSchema } from "@/lib/validation/inventory.schema";

export async function POST(request: Request) {
  const context = requestContext(request);

  try {
    const body = inventoryReserveSchema.parse(await request.json());
    const data = await inventoryApplication.reserve(context, body);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
