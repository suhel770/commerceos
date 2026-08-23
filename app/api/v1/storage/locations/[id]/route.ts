/**
 * CommerceOS Storage Location Single Detail API Route
 * GET /api/v1/storage/locations/[id] - Get Location by ID
 * PUT /api/v1/storage/locations/[id] - Update Location
 * DELETE /api/v1/storage/locations/[id] - Archive Location
 */

import { errorResponse, requestContext, successResponse } from "@/lib/api/route-response";
import { storageApplication } from "@/lib/application/storage.application";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = requestContext(request);
  const { id } = await params;
  try {
    const data = await storageApplication.getLocationById(id, {
      tenantId: context.organizationId,
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      actorId: context.actor?.id || "usr-actor",
    });
    if (!data) {
      return errorResponse(context, new Error(`Storage location ${id} not found.`));
    }
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = requestContext(request);
  const { id } = await params;
  try {
    const body = await request.json();
    const data = await storageApplication.updateLocation(
      id,
      {
        name: body.name,
        code: body.code,
        parentLocationId: body.parentLocationId,
        address: body.address,
        marketplace: body.marketplace,
        isDefault: body.isDefault,
        capabilities: body.capabilities,
        metadata: body.metadata,
      },
      {
        tenantId: context.organizationId,
        organizationId: context.organizationId,
        workspaceId: context.workspaceId,
        actorId: context.actor?.id || "usr-actor",
      },
    );
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const context = requestContext(request);
  const { id } = await params;
  try {
    const success = await storageApplication.archiveLocation(id, {
      tenantId: context.organizationId,
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
      actorId: context.actor?.id || "usr-actor",
    });
    return successResponse(context, { archived: success });
  } catch (error) {
    return errorResponse(context, error);
  }
}
