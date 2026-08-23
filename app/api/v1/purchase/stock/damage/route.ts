import { errorResponse, requestContext } from "@/lib/api/route-response";
import { PurchaseError } from "@/lib/purchase";

export async function POST(request: Request) {
  const context = requestContext(request);
  return errorResponse(
    context,
    new PurchaseError(
      "Purchase > Stock damage endpoint deprecated. Stock damage belongs exclusively to Inventory Engine (/api/v1/inventory).",
    ),
  );
}
