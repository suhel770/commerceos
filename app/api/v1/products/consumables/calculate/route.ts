import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { consumableRulesService } from "@/lib/consumable-rules/consumable-rules.service";
import { consumableCalculationQuerySchema } from "@/lib/validation/consumable-rule.schema";

export async function GET(request: Request) {
  const commerceContext = requestContext(request);

  try {
    const url = new URL(request.url);
    const searchParams = Object.fromEntries(url.searchParams.entries());

    const parsed = consumableCalculationQuerySchema.parse(searchParams);

    const proposals = await consumableRulesService.calculateExpectedUsage({
      productSku: parsed.productSku,
      variantSku: parsed.variantSku,
      orderQuantity: parsed.orderQuantity,
      shipmentCount: parsed.shipmentCount,
      packCount: parsed.packCount,
      tenantScope: {
        organizationId: commerceContext.organizationId,
        workspaceId: commerceContext.workspaceId,
      },
    });

    return successResponse(commerceContext, {
      productSku: parsed.productSku,
      variantSku: parsed.variantSku,
      orderQuantity: parsed.orderQuantity,
      proposals,
    });
  } catch (error) {
    return errorResponse(commerceContext, error);
  }
}
