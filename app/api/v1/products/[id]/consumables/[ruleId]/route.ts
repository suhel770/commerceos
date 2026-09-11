import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { consumableRulesService } from "@/lib/consumable-rules/consumable-rules.service";
import { consumableRuleUpdateSchema } from "@/lib/validation/consumable-rule.schema";
import { businessProfileRepository } from "@/lib/business-profile/repository";

type RouteContext = {
  params: Promise<{ id: string; ruleId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const commerceContext = requestContext(request);

  try {
    const profile = businessProfileRepository.get();
    if (profile.trackConsumables === false) {
      throw new Error("Consumables tracking is disabled for this workspace.");
    }

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
    const profile = businessProfileRepository.get();
    if (profile.trackConsumables === false) {
      throw new Error("Consumables tracking is disabled for this workspace.");
    }

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
