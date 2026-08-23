import {
  errorResponse,
  requestContext,
} from "@/lib/api/route-response";
import { ordersApplication } from "@/lib/application/orders.application";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(
  request: Request,
  routeContext: RouteContext,
) {
  const context = requestContext(request);

  try {
    const { id } = await routeContext.params;
    const courier = new URL(request.url).searchParams.get("courier") ?? undefined;
    const { document } = await ordersApplication.downloadLabel(context, id, {
      courier: courier?.trim() || undefined,
    });

    return new Response(document.body, {
      status: 200,
      headers: {
        "Content-Type": document.contentType,
        "Content-Disposition": `attachment; filename="${document.filename}"`,
        "x-request-id": context.requestId,
        "x-label-source": document.source,
        "x-label-channel": document.channel,
      },
    });
  } catch (error) {
    return errorResponse(context, error);
  }
}
