import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { purchaseApplication } from "@/lib/application/purchase.application";

export async function GET(request: Request) {
  const context = requestContext(request);

  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get("vendorId") || undefined;
    const status = searchParams.get("status") || undefined;

    const data = await purchaseApplication.listApprovalRequests(context, {
      vendorId,
      status: status as any,
    });
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}

export async function POST(request: Request) {
  const context = requestContext(request);

  try {
    const body = await request.json();
    const { vendorId, reason, amount, purchaseType } = body;

    if (!vendorId) {
      return errorResponse(context, new Error("Vendor ID is required for approval request."));
    }
    if (!reason?.trim()) {
      return errorResponse(context, new Error("Reason is required for owner approval request."));
    }

    const created = await purchaseApplication.requestVendorApproval(
      context,
      vendorId,
      reason,
      amount,
      purchaseType,
    );

    return successResponse(context, created, 201);
  } catch (error) {
    return errorResponse(context, error);
  }
}

export async function PUT(request: Request) {
  const context = requestContext(request);

  try {
    const body = await request.json();
    const { approvalId, action, reason } = body;

    if (!approvalId) {
      return errorResponse(context, new Error("Approval ID is required."));
    }

    if (action === "approve") {
      const updated = await purchaseApplication.approveVendorRequest(context, approvalId);
      return successResponse(context, updated);
    }

    if (action === "reject") {
      const updated = await purchaseApplication.rejectVendorRequest(context, approvalId, reason);
      return successResponse(context, updated);
    }

    return errorResponse(context, new Error("Valid action ('approve' or 'reject') is required."));
  } catch (error) {
    return errorResponse(context, error);
  }
}
