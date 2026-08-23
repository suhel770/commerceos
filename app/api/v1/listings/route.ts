import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { listingApplication } from "@/lib/application/listing.application";

export async function GET(request: Request) {
  const context = requestContext(request);

  try {
    const data = await listingApplication.list(context);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
