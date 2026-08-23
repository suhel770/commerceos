import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { authorize } from "@/lib/platform/authorization";
import { mediaUploadRequestSchema } from "@/lib/validation/media-upload.schema";

export async function POST(
  request: Request,
) {
  const context =
    requestContext(request);

  try {
    authorize(
      context,
      "products.edit",
    );
    const file =
      mediaUploadRequestSchema.parse(
        await request.json(),
      );

    return successResponse(
      context,
      {
        accepted: true,
        file,
        upload: {
          provider:
            "not-configured",
          requiresVirusScan: true,
          requiresSignedUrl: true,
        },
      },
    );
  } catch (error) {
    return errorResponse(
      context,
      error,
    );
  }
}
