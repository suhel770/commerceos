import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { inventoryApplication } from "@/lib/application/inventory.application";

export async function POST(request: Request) {
  const context = requestContext(request);

  try {
    const body = await request.json();
    const action = body.action || "quarantine"; // "quarantine" | "release"
    const productId = body.productId || body.sku;
    const quantity = Number(body.quantity) || 1;
    const reason = body.reason || "Quality Control Inspection";

    if (action === "release" || action === "unquarantine") {
      const data = await inventoryApplication.unquarantine(context, {
        productId,
        warehouseId: body.warehouseId,
        quantity,
        reason,
      });
      return successResponse(context, data);
    } else {
      const data = await inventoryApplication.quarantine(context, {
        productId,
        warehouseId: body.warehouseId,
        quantity,
        reason,
      });
      return successResponse(context, data);
    }
  } catch (error) {
    return errorResponse(context, error);
  }
}
