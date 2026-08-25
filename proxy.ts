import { NextRequest, NextResponse } from "next/server";
import { verifySessionEdge } from "@/lib/auth/session.edge";
import type { ProductPermission } from "@/lib/platform/commerce-context";

// ---------------------------------------------------------------------------
// Public routes that do NOT require authentication
// ---------------------------------------------------------------------------
const PUBLIC_API_PATHS = [
  "/api/v1/auth/login",
  "/api/v1/auth/logout",
  "/api/v1/auth/session",
  "/api/health/db",
];

// ---------------------------------------------------------------------------
// Role → Permissions mapping (mirrors commerce-context.ts ownerPermissions)
// ---------------------------------------------------------------------------
const ALL_PERMISSIONS: readonly ProductPermission[] = [
  "products.view",
  "products.create",
  "products.edit",
  "products.delete",
  "products.publish",
  "products.archive",
  "products.export",
  "inventory.view",
  "inventory.adjust",
  "inventory.reserve",
  "inventory.transfer",
  "orders.view",
  "orders.create",
  "orders.cancel",
  "orders.fulfil",
  "orders.settle",
  "orders.return",
  "purchase.view",
  "purchase.bills.read",
  "purchase.vendors.manage",
  "purchase.bills.create",
  "purchase.bills.transition",
  "finance.view",
  "reports.view",
];

const READ_ONLY_PERMISSIONS: readonly ProductPermission[] = [
  "products.view",
  "products.export",
  "inventory.view",
  "orders.view",
  "purchase.view",
  "purchase.bills.read",
  "finance.view",
  "reports.view",
];

const OPS_PERMISSIONS: readonly ProductPermission[] = [
  "products.view",
  "products.create",
  "products.edit",
  "products.export",
  "inventory.view",
  "inventory.adjust",
  "inventory.reserve",
  "inventory.transfer",
  "orders.view",
  "orders.create",
  "orders.cancel",
  "orders.fulfil",
  "orders.settle",
  "orders.return",
  "purchase.view",
  "purchase.bills.read",
  "purchase.bills.create",
  "purchase.bills.transition",
  "reports.view",
];

function getPermissionsForRole(role: string): readonly ProductPermission[] {
  switch (role) {
    case "owner":
    case "super_admin":
    case "admin":
      return ALL_PERMISSIONS;
    case "ops":
    case "warehouse_manager":
    case "order_manager":
    case "inventory_manager":
    case "WAREHOUSE_MANAGER":
    case "ORDER_MANAGER":
    case "INVENTORY_MANAGER":
      return OPS_PERMISSIONS;
    case "viewer":
    case "read_only":
    case "READ_ONLY":
    case "analyst":
    case "ANALYST":
    case "customer_support":
    case "CUSTOMER_SUPPORT":
      return READ_ONLY_PERMISSIONS;
    default:
      return READ_ONLY_PERMISSIONS;
  }
}

// ---------------------------------------------------------------------------
// Proxy (Next.js 16 canary renames middleware → proxy)
// ---------------------------------------------------------------------------
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip for static assets, Next.js internals, and public auth routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/public") ||
    PUBLIC_API_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  // For API routes: enforce authentication
  if (pathname.startsWith("/api/")) {
    const token = request.cookies.get("commerceos-session")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
        { status: 401 }
      );
    }

    const payload = await verifySessionEdge(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: { code: "SESSION_EXPIRED", message: "Session expired or invalid. Please log in again." } },
        { status: 401 }
      );
    }

    // Build verified context and forward to route handlers
    const permissions = getPermissionsForRole(payload.role);
    const verifiedContext = {
      organizationId: payload.organizationId,
      workspaceId: payload.workspaceId,
      actor: {
        id: payload.userId,
        name: payload.name,
        role: payload.role,
        permissions,
      },
    };

    const requestHeaders = new Headers(request.headers);
    // Remove any client-supplied identity headers to prevent spoofing
    requestHeaders.delete("x-user-id");
    requestHeaders.delete("x-user-name");
    requestHeaders.delete("x-organization-id");
    requestHeaders.delete("x-workspace-id");
    // Generate or forward correlation ID for end-to-end tracing
    const correlationId = request.headers.get("x-correlation-id") || crypto.randomUUID();
    requestHeaders.set("x-correlation-id", correlationId);
    // Inject the server-verified context as a single header
    requestHeaders.set("x-verified-commerce-context", JSON.stringify(verifiedContext));

    const response = NextResponse.next({ request: { headers: requestHeaders } });
    response.headers.set("x-correlation-id", correlationId);
    return addSecurityHeaders(response);
  }

  // For page routes: redirect to login if no valid session
  const token = request.cookies.get("commerceos-session")?.value;
  const isLoginPage = pathname === "/login";

  const pageVerified = await verifySessionEdge(token ?? "");
  if (!token || !pageVerified) {
    if (!isLoginPage) {
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
    return addSecurityHeaders(NextResponse.next());
  }

  // Valid session: if they try to visit /login, redirect to home
  if (isLoginPage) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires unsafe-inline/eval for dev
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; ")
  );
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
