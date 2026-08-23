/**
 * CommerceOS Storage Locations API Route
 * GET /api/v1/storage/locations - List Storage Locations
 * POST /api/v1/storage/locations - Create Storage Location
 */

import { errorResponse, requestContext, successResponse } from "@/lib/api/route-response";
import { storageApplication } from "@/lib/application/storage.application";
import type { StorageLocationType } from "@/lib/storage";

export async function GET(request: Request) {
  const context = requestContext(request);
  try {
    const params = new URL(request.url).searchParams;
    const type = params.get("type") as StorageLocationType | null;
    const search = params.get("search") ?? undefined;
    const isArchived = params.has("isArchived") ? params.get("isArchived") === "true" : false;

    const data = await storageApplication.listLocations(
      {
        tenantId: context.organizationId,
        organizationId: context.organizationId,
        workspaceId: context.workspaceId,
        actorId: context.actor?.id || "usr-actor",
      },
      {
        type: type ?? undefined,
        search,
        isArchived,
      },
    );

    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}

export async function POST(request: Request) {
  const context = requestContext(request);
  try {
    const body = await request.json();
    const data = await storageApplication.createLocation({
      name: body.name,
      code: body.code || `LOC-${Date.now().toString(36).toUpperCase()}`,
      type: body.type || "warehouse",
      parentLocationId: body.parentLocationId || undefined,
      address: body.address || undefined,
      marketplace: body.marketplace || undefined,
      isDefault: body.isDefault || false,
      capabilities: body.capabilities || undefined,
      metadata: body.metadata || {},
      securityContext: {
        tenantId: context.organizationId,
        organizationId: context.organizationId,
        workspaceId: context.workspaceId,
        actorId: context.actor?.id || "usr-actor",
      },
    });

    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}
