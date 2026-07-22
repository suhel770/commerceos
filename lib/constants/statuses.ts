export const PRODUCT_STATUS = [
  "Active",
  "Inactive",
  "Draft",
] as const;

export type ProductStatus =
  typeof PRODUCT_STATUS[number];