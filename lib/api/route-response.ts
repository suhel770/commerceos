import { ZodError } from "zod";

import {
  apiFailure,
  apiSuccess,
} from "@/lib/contracts/api.contract";
import { AuthorizationError } from "@/lib/platform/authorization";
import {
  createMockCommerceContext,
  type CommerceContext,
} from "@/lib/platform/commerce-context";
import { RevisionConflictError } from "@/lib/repositories/masterListing.repository";
import { MasterProductNotFoundError } from "@/lib/application/master-product.application";
import { InventoryEngineError } from "@/lib/inventory/engine";
import { InventoryNotFoundError } from "@/lib/inventory/service";
import {
  OrderError,
  OrderNotFoundError,
} from "@/lib/orders/types";
import {
  PurchaseError,
  PurchaseNotFoundError,
} from "@/lib/purchase/types";
import { IdempotencyConflictError } from "@/lib/platform/idempotency";

export function requestContext(
  request: Request,
): CommerceContext {
  const requestId =
    request.headers.get(
      "x-request-id",
    ) ?? crypto.randomUUID();
  const organizationId =
    request.headers.get("x-organization-id") ?? "org-commerceos";
  const workspaceId =
    request.headers.get("x-workspace-id") ?? "ws-default";

  const context = createMockCommerceContext(requestId);
  context.organizationId = organizationId;
  context.workspaceId = workspaceId;

  const userId = request.headers.get("x-user-id");
  if (userId) context.actor.id = userId;

  const userName = request.headers.get("x-user-name");
  if (userName) context.actor.name = userName;

  return context;
}

export function successResponse<T>(
  context: CommerceContext,
  data: T,
  status = 200,
) {
  return Response.json(
    apiSuccess(
      data,
      context.requestId,
    ),
    {
      status,
      headers: {
        "x-request-id":
          context.requestId,
      },
    },
  );
}

export function errorResponse(
  context: CommerceContext,
  error: unknown,
) {
  let status = 500;
  let code = "INTERNAL_ERROR";
  let message =
    "An unexpected error occurred.";
  let details:
    | {
        field?: string;
        message: string;
      }[]
    | undefined;

  if (error instanceof ZodError) {
    status = 400;
    code = "VALIDATION_ERROR";
    message =
      "The request payload is invalid.";
    details = error.issues.map(
      (issue) => ({
        field:
          issue.path.join("."),
        message: issue.message,
      }),
    );
  } else if (
    error instanceof AuthorizationError
  ) {
    status = 403;
    code = error.code;
    message = error.message;
  } else if (
    error instanceof
    MasterProductNotFoundError
  ) {
    status = 404;
    code = error.code;
    message = error.message;
  } else if (
    error instanceof InventoryNotFoundError
  ) {
    status = 404;
    code = error.code;
    message = error.message;
  } else if (
    error instanceof InventoryEngineError
  ) {
    status = 400;
    code = error.code;
    message = error.message;
  } else if (
    error instanceof OrderNotFoundError
  ) {
    status = 404;
    code = error.code;
    message = error.message;
  } else if (error instanceof OrderError) {
    status = 400;
    code = error.code;
    message = error.message;
  } else if (
    error instanceof PurchaseNotFoundError
  ) {
    status = 404;
    code = error.code;
    message = error.message;
  } else if (error instanceof PurchaseError) {
    status = 400;
    code = error.code;
    message = error.message;
  } else if (
    error instanceof
    RevisionConflictError
  ) {
    status = 409;
    code = error.code;
    message = error.message;
  } else if (
    error instanceof
    IdempotencyConflictError
  ) {
    status = 409;
    code = error.code;
    message = error.message;
  } else if (
    error instanceof Error
  ) {
    message = error.message;
  }

  return Response.json(
    apiFailure(
      context.requestId,
      code,
      message,
      details,
    ),
    {
      status,
      headers: {
        "x-request-id":
          context.requestId,
      },
    },
  );
}
