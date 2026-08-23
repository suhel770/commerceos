import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { listingApplication } from "@/lib/application/listing.application";
import { idempotencyStore } from "@/lib/platform/idempotency";
import { listingPublishSchema } from "@/lib/validation/listings.schema";

export async function POST(request: Request) {
  const context = requestContext(request);

  try {
    const idempotencyKey = request.headers.get("idempotency-key");

    if (!idempotencyKey) {
      return Response.json(
        {
          success: false,
          error: {
            code: "IDEMPOTENCY_KEY_REQUIRED",
            message: "Idempotency-Key header is required.",
          },
          requestId: context.requestId,
        },
        {
          status: 400,
          headers: {
            "x-request-id": context.requestId,
          },
        },
      );
    }

    const body = listingPublishSchema.parse(await request.json());
    const result = await idempotencyStore.execute(
      idempotencyKey,
      `listing-publish:${context.organizationId}:${body.productId}:${body.marketplace ?? "all"}`,
      () =>
        listingApplication.publish(
          context,
          body.productId,
          body.marketplace,
        ),
    );

    return successResponse(context, result);
  } catch (error) {
    return errorResponse(context, error);
  }
}
