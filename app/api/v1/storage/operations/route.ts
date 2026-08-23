/**
 * CommerceOS Storage Physical Stock Operations API Route
 * POST /api/v1/storage/operations - Execute Putaway, Transfer, Cycle Count Adjustment, Damage Flag
 */

import { errorResponse, requestContext, successResponse } from "@/lib/api/route-response";
import { storageApplication } from "@/lib/application/storage.application";

export async function POST(request: Request) {
  const context = requestContext(request);
  try {
    const body = await request.json();
    const data = await storageApplication.executeStockOperation(
      {
        tenantId: context.organizationId,
        organizationId: context.organizationId,
        workspaceId: context.workspaceId,
        actorId: context.actor?.id || "usr-actor",
      },
      {
        operationType: body.operationType,
        sku: body.sku,
        qty: Number(body.qty),
        sourceLocationId: body.sourceLocationId,
        targetLocationId: body.targetLocationId,
        actorId: context.actor?.id || "system",
        actorName: context.actor?.id || "System User",
        reason: body.reason,
        metadata: body.metadata || {},
      },
    );
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
