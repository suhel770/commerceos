import { ZodError } from "zod";

import {
  apiFailure,
  apiSuccess,
} from "@/lib/contracts/api.contract";
import { AuthorizationError } from "@/lib/platform/authorization";
import {
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
    request.headers.get("x-request-id") ?? crypto.randomUUID();

  // Parse the server-verified context injected by Next.js middleware.
  // This header is set by middleware after session validation; client-supplied
  // x-user-id / x-workspace-id / x-organization-id are explicitly stripped
  // by the middleware so they CANNOT be used to spoof identity.
  const correlationId =
    request.headers.get("x-correlation-id") ?? crypto.randomUUID();

  const raw = request.headers.get("x-verified-commerce-context");
  if (raw) {
    try {
      const verified = JSON.parse(raw);
      return {
        organizationId: verified.organizationId || "org-commerceos",
        workspaceId: verified.workspaceId || "ws-default",
        requestId,
        correlationId,
        actor: {
          id: verified.actor?.id || "user-unknown",
          name: verified.actor?.name || "Unknown",
          role: verified.actor?.role || "read_only",
          permissions: verified.actor?.permissions || [],
        },
      };
    } catch {
      // Fall through to unauthenticated context
    }
  }

  // No verified context present: return an empty/anonymous context.
  // Route handlers that require auth will fail authorization checks.
  return {
    organizationId: "org-anonymous",
    workspaceId: "ws-anonymous",
    requestId,
    actor: {
      id: "user-anonymous",
      name: "Anonymous",
      role: "read_only",
      permissions: [],
    },
  };
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
