import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { inventoryApplication } from "@/lib/application/inventory.application";

interface RouteProps {
  params: Promise<{ productId: string }>;
}

export async function GET(
  request: Request,
  { params }: RouteProps,
) {
  const context = requestContext(request);

  try {
    const { productId } = await params;
    const data = await inventoryApplication.get(context, productId);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
