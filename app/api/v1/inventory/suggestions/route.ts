import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { inventoryApplication } from "@/lib/application/inventory.application";
import { z } from "zod";

const saveSuggestionSchema = z
  .object({
    productId: z.string().trim().min(1),
  })
  .strict();

export async function POST(request: Request) {
  const context = requestContext(request);

  try {
    const body = saveSuggestionSchema.parse(await request.json());
    const data = await inventoryApplication.savePurchaseSuggestion(
      context,
      body.productId,
    );
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
