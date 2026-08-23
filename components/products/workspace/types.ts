export type ProductWorkspaceTab =
  | "overview"
  | "listings"
  | "performance"
  | "inventory"
  | "consumables"
  | "activity"
  | "orders"
  | "returns"
  | "ai";

export type ProductWorkspaceNavigate = (
  tab: ProductWorkspaceTab,
) => void;
