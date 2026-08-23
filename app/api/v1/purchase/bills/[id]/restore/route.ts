import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { purchaseApplication } from "@/lib/application/purchase.application";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = requestContext(request);
  try {
    const { id } = await params;
    const data = await purchaseApplication.restoreBill(context, id);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}

