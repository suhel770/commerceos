/**
 * CommerceOS Storage Goods Received Notes (GRN) API Route
 * POST /api/v1/storage/receipts - Create Goods Received Note (Purchase -> Storage Integration)
 * GET /api/v1/storage/receipts - List physical stock balances
 */

import { errorResponse, requestContext, successResponse } from "@/lib/api/route-response";
import { storageApplication } from "@/lib/application/storage.application";

export async function GET(request: Request) {
  const context = requestContext(request);
  try {
    const params = new URL(request.url).searchParams;
    const storageLocationId = params.get("storageLocationId") ?? undefined;
    const data = await storageApplication.listStock(
      {
        tenantId: context.organizationId,
        organizationId: context.organizationId,
        workspaceId: context.workspaceId,
        actorId: context.actor?.id || "usr-actor",
      },
      storageLocationId,
    );
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}

export async function POST(request: Request) {
  const context = requestContext(request);
  try {
    const body = await request.json();
    const data = await storageApplication.createReceipt(
      {
        tenantId: context.organizationId,
        organizationId: context.organizationId,
        workspaceId: context.workspaceId,
        actorId: context.actor?.id || "usr-actor",
      },
      {
        purchaseBillId: body.purchaseBillId,
        storageLocationId: body.storageLocationId,
        receiptNumber: body.receiptNumber || `GRN-${Date.now().toString(36).toUpperCase()}`,
        notes: body.notes,
        lines: body.lines || [],
      },
    );
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
