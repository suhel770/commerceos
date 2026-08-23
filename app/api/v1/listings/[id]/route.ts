import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { listingApplication } from "@/lib/application/listing.application";

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  },
) {
  const commerceContext = requestContext(request);

  try {
    const { id } = await context.params;
    const data = await listingApplication.get(
      commerceContext,
      decodeURIComponent(id),
    );
    return successResponse(commerceContext, data);
  } catch (error) {
    return errorResponse(commerceContext, error);
  }
}
