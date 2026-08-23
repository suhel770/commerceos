import {
  errorResponse,
  requestContext,
} from "@/lib/api/route-response";
import { ordersApplication } from "@/lib/application/orders.application";

export async function GET(request: Request) {
  const context = requestContext(request);

  try {
    const params = new URL(request.url).searchParams;
    const productId = params.get("productId") ?? undefined;
    const dateFrom = params.get("dateFrom") ?? undefined;
    const dateTo = params.get("dateTo") ?? undefined;

    const { document } = await ordersApplication.exportExcel(context, {
      productId,
      dateFrom,
      dateTo,
    });

    return new Response(document.body, {
      status: 200,
      headers: {
        "Content-Type": document.contentType,
        "Content-Disposition": `attachment; filename="${document.filename}"`,
        "x-request-id": context.requestId,
      },
    });
  } catch (error) {
    return errorResponse(context, error);
  }
}
