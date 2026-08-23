import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { listingApplication } from "@/lib/application/listing.application";
import { listingValidateSchema } from "@/lib/validation/listings.schema";

export async function POST(request: Request) {
  const context = requestContext(request);

  try {
    const body = listingValidateSchema.parse(await request.json());
    const data = await listingApplication.validate(
      context,
      body.productId,
    );
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
