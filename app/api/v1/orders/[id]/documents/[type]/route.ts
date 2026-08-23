import {
  errorResponse,
  requestContext,
} from "@/lib/api/route-response";
import { ordersApplication } from "@/lib/application/orders.application";
import { buildOrderDocumentStub } from "@/lib/orders/documents";
import type { OrderDocumentType } from "@/lib/orders";

type RouteContext = {
  params: Promise<{ id: string; type: string }>;
};

export async function GET(request: Request, routeContext: RouteContext) {
  const context = requestContext(request);
  try {
    const { id, type } = await routeContext.params;
    const order = await ordersApplication.get(context, id);
    const doc = buildOrderDocumentStub(order, type as OrderDocumentType);
    return new Response(doc.body, {
      status: 200,
      headers: {
        "Content-Type": doc.contentType,
        "Content-Disposition": `attachment; filename="${doc.filename}"`,
      },
    });
  } catch (error) {
    return errorResponse(context, error);
  }
}
