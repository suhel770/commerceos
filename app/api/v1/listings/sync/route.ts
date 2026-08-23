import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { listingApplication } from "@/lib/application/listing.application";
import { listingSyncSchema } from "@/lib/validation/listings.schema";

export async function POST(request: Request) {
  const context = requestContext(request);

  try {
    const body = listingSyncSchema.parse(await request.json());
    const data = await listingApplication.sync(
      context,
      body.productId,
      body.type,
      body.marketplace,
    );
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
