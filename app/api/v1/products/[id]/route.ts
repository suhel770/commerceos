import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import {
  masterProductApplication,
  MasterProductNotFoundError,
} from "@/lib/application/master-product.application";
import { masterListingPatchSchema } from "@/lib/validation/master-listing.schema";
import { productRepository } from "@/lib/repositories/product.repository";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: Request,
  context: RouteContext,
) {
  const commerceContext =
    requestContext(request);

  try {
    const { id } =
      await context.params;
    let product: any;
    try {
      product =
        await masterProductApplication.get(
          commerceContext,
          id,
        );
    } catch {
      product = await productRepository.findById(id, {
        organizationId: commerceContext.organizationId,
        workspaceId: commerceContext.workspaceId,
      });
    }

    if (!product) {
      return errorResponse(commerceContext, new MasterProductNotFoundError(id));
    }

    return successResponse(
      commerceContext,
      product,
    );
  } catch (error) {
    return errorResponse(
      commerceContext,
      error,
    );
  }
}

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  const commerceContext =
    requestContext(request);

  try {
    const { id } =
      await context.params;
    const payload =
      masterListingPatchSchema.parse(
        await request.json(),
      );
    const expectedRevision =
      payload.revision;

    const {
      revision: _revision,
      ...updates
    } = payload;

    const product =
      await masterProductApplication.update(
        commerceContext,
        id,
        updates,
        expectedRevision,
      );

    return successResponse(
      commerceContext,
      product,
    );
  } catch (error) {
    return errorResponse(
      commerceContext,
      error,
    );
  }
}
