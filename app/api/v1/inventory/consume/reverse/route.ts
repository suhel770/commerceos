import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { inventoryReverseConsumptionSchema } from "@/lib/validation/inventory.schema";
import { inventoryConsumptionLedger } from "@/lib/inventory/consumption-ledger";

export async function POST(request: Request) {
  const context = requestContext(request);

  try {
    const body = inventoryReverseConsumptionSchema.parse(await request.json());

    const result = inventoryConsumptionLedger.reverseConsumption({
      ledgerId: body.ledgerId,
      reason: body.reason,
      notes: body.notes,
      actorId: context.actor.id,
      actorName: body.actorName || context.actor.id || "Warehouse Lead",
    });

    if (!result.success) {
      throw new Error(result.error || "Failed to reverse usage entry.");
    }

    return successResponse(context, result);
  } catch (error) {
    return errorResponse(context, error);
  }
}
