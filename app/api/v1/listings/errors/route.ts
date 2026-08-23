import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { listingApplication } from "@/lib/application/listing.application";
import { listingRetrySchema } from "@/lib/validation/listings.schema";

export async function GET(request: Request) {
  const context = requestContext(request);

  try {
    const data = await listingApplication.errors(context);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}

export async function POST(request: Request) {
  const context = requestContext(request);

  try {
    const body = listingRetrySchema.parse(await request.json());
    const data = await listingApplication.retry(
      context,
      body.jobId,
    );
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
