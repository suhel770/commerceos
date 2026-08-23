import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { inventoryApplication } from "@/lib/application/inventory.application";

export async function GET(request: Request) {
  const context = requestContext(request);

  try {
    const productId =
      new URL(request.url).searchParams.get("productId") ??
      undefined;
    const data = await inventoryApplication.list(
      context,
      productId ?? undefined,
    );
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
