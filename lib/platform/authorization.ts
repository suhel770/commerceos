import type {
  CommerceContext,
  ProductPermission,
} from "./commerce-context";

export class AuthorizationError extends Error {
  readonly code = "FORBIDDEN";

  constructor(
    readonly permission: ProductPermission,
  ) {
    super(
      `Missing required permission: ${permission}`,
    );
    this.name = "AuthorizationError";
  }
}

export function can(
  context: CommerceContext,
  permission: ProductPermission,
) {
  return context.actor.permissions.includes(
    permission,
  );
}

export function authorize(
  context: CommerceContext,
  permission: ProductPermission,
) {
  if (!can(context, permission)) {
    throw new AuthorizationError(
      permission,
    );
  }
}

export function assertWorkspaceAccess(
  context: CommerceContext,
  workspaceId: string,
) {
  if (
    context.workspaceId !== workspaceId
  ) {
    throw new AuthorizationError(
      "products.view",
    );
  }
}
