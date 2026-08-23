import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { purchaseApplication } from "@/lib/application/purchase.application";
import type { VendorStatus } from "@/lib/purchase";

export async function POST(request: Request) {
  const context = requestContext(request);

  try {
    const body = await request.json();
    const { id, status, reason, action } = body;

    if (!id) {
      return errorResponse(context, new Error("Vendor ID is required."));
    }

    let targetStatus: VendorStatus = status;

    if (action === "block") targetStatus = "blocked";
    if (action === "unblock" || action === "activate") targetStatus = "active";
    if (action === "deactivate") targetStatus = "inactive";

    if (!targetStatus) {
      return errorResponse(context, new Error("Valid vendor status or action is required."));
    }

    if (targetStatus === "blocked" && !reason?.trim()) {
      return errorResponse(context, new Error("Reason is required to block a vendor."));
    }

    const updatedVendor = await purchaseApplication.setVendorStatus(
      context,
      id,
      targetStatus,
      reason || `Vendor status changed to ${targetStatus}`,
    );

    return successResponse(context, updatedVendor);
  } catch (error) {
    return errorResponse(context, error);
  }
}
