/** CommerceOS Purchase Bills Route API */
import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { purchaseApplication } from "@/lib/application/purchase.application";
import type {
  PaymentStatus,
  PurchaseStatus,
  PurchaseType,
} from "@/lib/purchase";
import { createPurchaseBillSchema } from "@/lib/validation/purchase.schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = requestContext(request);

  try {
    const params = new URL(request.url).searchParams;
    const purchaseType = (params.get("purchaseType") ??
      params.get("category")) as PurchaseType | null;
    const vendorId = params.get("vendorId") ?? undefined;
    const status = params.get("status") as PurchaseStatus | null;
    const paymentStatus = params.get("paymentStatus") as PaymentStatus | null;
    const search = params.get("search") ?? undefined;
    const data = await purchaseApplication.listBills(context, {
      purchaseType: purchaseType ?? undefined,
      vendorId,
      status: status ?? undefined,
      paymentStatus: paymentStatus ?? undefined,
      search,
    });
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}

export async function POST(request: Request) {
  const context = requestContext(request);

  try {
    const body = createPurchaseBillSchema.parse(await request.json());
    const data = await purchaseApplication.createBill(context, body);
    return successResponse(context, data, 201);
  } catch (error) {
    return errorResponse(context, error);
  }
}
