import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { purchaseApplication } from "@/lib/application/purchase.application";
import { updateVendorSchema } from "@/lib/validation/purchase.schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, routeContext: RouteContext) {
  const context = requestContext(request);

  try {
    const { id } = await routeContext.params;
    const body = updateVendorSchema.parse(await request.json());
    const data = await purchaseApplication.updateVendor(context, id, body);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
