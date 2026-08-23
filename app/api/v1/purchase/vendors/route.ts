import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { purchaseApplication } from "@/lib/application/purchase.application";
import { createVendorSchema } from "@/lib/validation/purchase.schema";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = requestContext(request);

  try {
    const data = await purchaseApplication.listVendors(context);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}

export async function POST(request: Request) {
  const context = requestContext(request);

  try {
    const raw = await request.json();
    if (Array.isArray(raw)) {
      const createdList = [];
      let index = 1;
      for (const item of raw) {
        try {
          const body = createVendorSchema.parse(item);
          const vendor = await purchaseApplication.createVendor(context, body);
          createdList.push(vendor);
        } catch (itemErr: any) {
          const msg = itemErr?.errors?.[0]?.message || itemErr?.message || "Invalid vendor record";
          throw new Error(`Row ${index} (${item?.name || "Vendor"}): ${msg}`);
        }
        index++;
      }
      return successResponse(context, createdList, 201);
    }

    const body = createVendorSchema.parse(raw);
    const data = await purchaseApplication.createVendor(context, body);
    return successResponse(context, data, 201);
  } catch (error) {
    return errorResponse(context, error);
  }
}

export async function PUT(request: Request) {
  const context = requestContext(request);

  try {
    const body = await request.json();
    const { id, ...patch } = body;
    if (!id) {
      return errorResponse(context, new Error("Vendor ID is required for update."));
    }
    const data = await purchaseApplication.updateVendor(context, id, patch);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}

export async function DELETE(request: Request) {
  const context = requestContext(request);

  try {
    const body = await request.json();
    const { ids, id } = body || {};
    const targetIds = Array.isArray(ids) ? ids : id ? [id] : [];
    if (!targetIds.length) {
      return errorResponse(context, new Error("Vendor ID(s) required for deletion."));
    }
    const count = await purchaseApplication.deleteVendors(context, targetIds);
    return successResponse(context, { deletedCount: count });
  } catch (error) {
    return errorResponse(context, error);
  }
}
