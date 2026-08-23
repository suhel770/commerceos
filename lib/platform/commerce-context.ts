export type CommerceRole =
  | "owner"
  | "super_admin"
  | "admin"
  | "product_manager"
  | "listing_manager"
  | "inventory_manager"
  | "warehouse_manager"
  | "order_manager"
  | "finance_manager"
  | "customer_support"
  | "analyst"
  | "read_only";

export type ProductPermission =
  | "products.view"
  | "products.create"
  | "products.edit"
  | "products.delete"
  | "products.publish"
  | "products.archive"
  | "products.export"
  | "inventory.view"
  | "inventory.adjust"
  | "inventory.reserve"
  | "inventory.transfer"
  | "orders.view"
  | "orders.create"
  | "orders.cancel"
  | "orders.fulfil"
  | "orders.settle"
  | "orders.return"
  | "purchase.view"
  | "purchase.bills.read"
  | "purchase.vendors.manage"
  | "purchase.bills.create"
  | "purchase.bills.transition"
  | "finance.view"
  | "reports.view";

export interface CommerceActor {
  id: string;
  name: string;
  role: CommerceRole;
  permissions: readonly ProductPermission[];
}

export interface CommerceContext {
  organizationId: string;
  workspaceId: string;
  actor: CommerceActor;
  requestId: string;
}

const ownerPermissions: readonly ProductPermission[] = [
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
  "purchase.vendors.manage",
  "purchase.bills.create",
  "purchase.bills.transition",
];

export function createMockCommerceContext(
  requestId = crypto.randomUUID(),
): CommerceContext {
  return {
    organizationId: "org-commerceos",
    workspaceId: "ws-default",
    requestId,
    actor: {
      id: "user-owner",
      name: "Amir",
      role: "owner",
      permissions: ownerPermissions,
    },
  };
}
