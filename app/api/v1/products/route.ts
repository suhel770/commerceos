import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { productRepository } from "@/lib/repositories/product.repository";
import { masterProductApplication } from "@/lib/application/master-product.application";

export async function GET(
  request: Request,
) {
  const context = requestContext(request);
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || undefined;
  const category = searchParams.get("category") || undefined;
  const brand = searchParams.get("brand") || undefined;
  const status = searchParams.get("status") || undefined;

  try {
    const products = await productRepository.findAll({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      search,
      category: category !== "all" ? category : undefined,
      brand,
      status: status !== "all" ? status : undefined,
    });

    return successResponse(
      context,
      products,
    );
  } catch (error) {
    return errorResponse(
      context,
      error,
    );
  }
}

export async function POST(
  request: Request,
) {
  const context =
    requestContext(request);

  try {
    const body = await request.json();
    const product =
      await masterProductApplication.create(
        context,
        body,
      );

    return successResponse(
      context,
      product,
    );
  } catch (error) {
    return errorResponse(
      context,
      error,
    );
  }
}
