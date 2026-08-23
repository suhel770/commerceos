import { apiFailure } from "@/lib/contracts/api.contract";
import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { businessProfileRepository } from "@/lib/business-profile";

export async function GET(request: Request) {
  const context = requestContext(request);
  try {
    return successResponse(context, businessProfileRepository.get());
  } catch (error) {
    return errorResponse(context, error);
  }
}

export async function PATCH(request: Request) {
  const context = requestContext(request);
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const data = businessProfileRepository.update({
      legalName:
        typeof body.legalName === "string" ? body.legalName : undefined,
      brand: typeof body.brand === "string" ? body.brand : undefined,
      tradeName:
        typeof body.tradeName === "string" ? body.tradeName : undefined,
      gstin: typeof body.gstin === "string" ? body.gstin : undefined,
      pan: typeof body.pan === "string" ? body.pan : undefined,
      address: typeof body.address === "string" ? body.address : undefined,
      city: typeof body.city === "string" ? body.city : undefined,
      pincode: typeof body.pincode === "string" ? body.pincode : undefined,
      phone: typeof body.phone === "string" ? body.phone : undefined,
      email: typeof body.email === "string" ? body.email : undefined,
      ownerName:
        typeof body.ownerName === "string" ? body.ownerName : undefined,
    });
    return successResponse(context, data);
  } catch (error) {
    if (error instanceof Error) {
      return Response.json(
        apiFailure(context.requestId, "VALIDATION_ERROR", error.message),
        {
          status: 400,
          headers: { "x-request-id": context.requestId },
        },
      );
    }
    return errorResponse(context, error);
  }
}
