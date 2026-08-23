import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { purchaseApplication } from "@/lib/application/purchase.application";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = requestContext(request);
  try {
    const { id } = await params;
    const data = await purchaseApplication.getBill(context, id);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = requestContext(request);
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const permanent = url.searchParams.get("permanent") === "true";
    const success = permanent
      ? await purchaseApplication.permanentDeleteBill(context, id)
      : await purchaseApplication.deleteBill(context, id);
    return successResponse(context, { deleted: success });
  } catch (error) {
    return errorResponse(context, error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = requestContext(request);
  try {
    const { id } = await params;
    const body = await request.json();
    const data = await purchaseApplication.updateBill(context, id, body);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}

