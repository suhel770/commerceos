import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { consumableRulesService } from "@/lib/consumable-rules/consumable-rules.service";
import { consumableRuleCreateSchema } from "@/lib/validation/consumable-rule.schema";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const commerceContext = requestContext(request);

  try {
    const { id } = await context.params;
    const rules = await consumableRulesService.getRulesForProduct(id, {
      organizationId: commerceContext.organizationId,
      workspaceId: commerceContext.workspaceId,
    });

    const availableConsumables = await consumableRulesService.getAvailableConsumables();

    return successResponse(commerceContext, {
      rules,
      availableConsumables,
    });
  } catch (error) {
    return errorResponse(commerceContext, error);
  }
}

export async function POST(request: Request, context: RouteContext) {
  const commerceContext = requestContext(request);

  try {
    const { id } = await context.params;
    const body = await request.json();

    const parsed = consumableRuleCreateSchema.parse({
      ...body,
      productId: id,
    });

    const created = await consumableRulesService.createRule({
      ...parsed,
      organizationId: commerceContext.organizationId,
      workspaceId: commerceContext.workspaceId,
      variantSku: parsed.variantSku || undefined,
      consumableName: parsed.consumableName || undefined,
      notes: parsed.notes || undefined,
    });

    return successResponse(commerceContext, created);
  } catch (error) {
    return errorResponse(commerceContext, error);
  }
}
