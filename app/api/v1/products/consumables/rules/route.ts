import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { consumableUsageRuleRepository } from "@/lib/consumable-rules/consumable-rules.repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = requestContext(request);

  try {
    const rules = await consumableUsageRuleRepository.getAllRules({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
    });

    return successResponse(context, rules);
  } catch (error) {
    return errorResponse(context, error);
  }
}
