import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { masterProductApplication } from "@/lib/application/master-product.application";
import { idempotencyStore } from "@/lib/platform/idempotency";
import { publishCommandSchema } from "@/lib/validation/master-listing.schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(
  request: Request,
  context: RouteContext,
) {
  const commerceContext =
    requestContext(request);

  try {
    const { id } =
      await context.params;
    const idempotencyKey =
      request.headers.get(
        "idempotency-key",
      );

    if (!idempotencyKey) {
      return Response.json(
        {
          success: false,
          error: {
            code: "IDEMPOTENCY_KEY_REQUIRED",
            message:
              "Idempotency-Key header is required.",
          },
          requestId:
            commerceContext.requestId,
        },
        {
          status: 400,
          headers: {
            "x-request-id":
              commerceContext.requestId,
          },
        },
      );
    }

    const command =
      publishCommandSchema.parse(
        await request.json(),
      );
    const result =
      await idempotencyStore.execute(
        idempotencyKey,
        `publish:${commerceContext.organizationId}:${id}`,
        () =>
          masterProductApplication.publish(
            commerceContext,
            id,
            command.marketplace,
          ),
      );

    return successResponse(
      commerceContext,
      result,
    );
  } catch (error) {
    return errorResponse(
      commerceContext,
      error,
    );
  }
}
