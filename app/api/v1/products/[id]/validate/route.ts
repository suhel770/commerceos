import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { masterProductApplication } from "@/lib/application/master-product.application";

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
    const result =
      await masterProductApplication.validate(
        commerceContext,
        id,
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
