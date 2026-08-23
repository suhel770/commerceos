/**
 * CommerceOS Storage Receiving Reversal API Route
 * POST /api/v1/storage/receipts/reverse - Correct/Reverse an existing storage receipt
 */

import { errorResponse, requestContext, successResponse } from '@/lib/api/route-response';
import { storageApplication } from '@/lib/application/storage.application';

export async function POST(request: Request) {
  const context = requestContext(request);
  try {
    const body = await request.json();

    if (!body.purchaseBillId) {
      throw new Error('purchaseBillId is required for receiving reversal.');
    }
    if (!body.reason || body.reason.trim().length === 0) {
      throw new Error('A mandatory reason is required for receiving reversal.');
    }
    if (!Array.isArray(body.lines) || body.lines.length === 0) {
      throw new Error('At least one line item with reverseQty > 0 is required.');
    }

    const data = await storageApplication.reverseReceipt(
      {
        tenantId: context.organizationId,
        organizationId: context.organizationId,
        workspaceId: context.workspaceId,
        actorId: context.actor?.id || 'usr-actor',
        actorName: context.actor?.name || 'System User',
      },
      {
        receiptId: body.receiptId,
        purchaseBillId: body.purchaseBillId,
        reason: body.reason,
        lines: body.lines.map((l: any) => ({
          lineId: l.lineId,
          sku: l.sku,
          reverseQty: Number(l.reverseQty) || 0,
          storageLocationId: l.storageLocationId,
        })),
      },
    );

    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
