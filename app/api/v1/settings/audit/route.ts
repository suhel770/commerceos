import { db } from "@/lib/db";
import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const context = requestContext(request);

  try {
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get("entityId") || undefined;
    const entityType = searchParams.get("entityType") || undefined;

    const where: any = {
      workspaceId: context.workspaceId,
    };

    if (entityId) {
      where.entityId = entityId;
    }
    if (entityType) {
      where.entityType = entityType;
    }

    const logs = await db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return successResponse(context, logs);
  } catch (error) {
    return errorResponse(context, error);
  }
}
