import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { inventoryApplication } from "@/lib/application/inventory.application";
import { inventoryConsumeSchema } from "@/lib/validation/inventory.schema";
import { inventoryConsumptionLedger } from "@/lib/inventory/consumption-ledger";

export async function POST(request: Request) {
  const context = requestContext(request);

  try {
    const body = inventoryConsumeSchema.parse(await request.json());
    const targetSku = body.sku || body.productId || "";

    // 1. Authoritative Ledger Execution & Storage Balance Decrement
    const ledgerResult = inventoryConsumptionLedger.recordConsumption({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      sku: targetSku,
      productName: body.productName,
      inventoryType: body.inventoryType,
      quantity: body.quantity,
      unit: body.unit,
      usageType: body.usageType,
      reason: body.reason,
      customReason: body.customReason,
      notes: body.notes,
      sourceLocationId: body.sourceLocationId,
      sourceLocationName: body.sourceLocationName,
      relatedProductSku: body.relatedProductSku,
      relatedProductName: body.relatedProductName,
      relatedOrderId: body.relatedOrderId,
      relatedShipmentId: body.relatedShipmentId,
      relatedPurchaseBillId: body.relatedPurchaseBillId,
      reference: body.reference,
      actorName: body.actorName || context.actor.id || "Warehouse Staff",
    });

    if (!ledgerResult.success) {
      throw new Error(ledgerResult.error || "Inventory consumption failed.");
    }

    // 2. Application-level Sync
    if (body.productId) {
      try {
        await inventoryApplication.consume(context, {
          productId: body.productId,
          warehouseId: body.warehouseId,
          quantity: body.quantity,
          reason: body.customReason ? `${body.reason}: ${body.customReason}` : body.reason,
          reference: body.reference,
        });
      } catch {}
    }

    return successResponse(context, ledgerResult);
  } catch (error) {
    return errorResponse(context, error);
  }
}
