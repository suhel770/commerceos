import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { consumableRulesService } from "@/lib/consumable-rules/consumable-rules.service";
import { consumableRuleUpdateSchema } from "@/lib/validation/consumable-rule.schema";

type RouteContext = {
  params: Promise<{ id: string; ruleId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const commerceContext = requestContext(request);

  try {
    const { ruleId } = await context.params;
    const body = await request.json();

    const parsed = consumableRuleUpdateSchema.parse(body);

    const updated = await consumableRulesService.updateRule(ruleId, {
      ...parsed,
      organizationId: commerceContext.organizationId,
      workspaceId: commerceContext.workspaceId,
      notes: parsed.notes || undefined,
    });

    return successResponse(commerceContext, updated);
  } catch (error) {
    return errorResponse(commerceContext, error);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const commerceContext = requestContext(request);

  try {
    const { ruleId } = await context.params;

    const success = await consumableRulesService.deleteRule(ruleId, {
      organizationId: commerceContext.organizationId,
      workspaceId: commerceContext.workspaceId,
    });

    return successResponse(commerceContext, { success, id: ruleId });
  } catch (error) {
    return errorResponse(commerceContext, error);
  }
}
