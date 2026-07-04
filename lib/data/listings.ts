export interface Listing {
  id: string;
  productId: string;

  productName: string;
  productImage: string;

  marketplace: string;
  status: "Active" | "Draft" | "Inactive";

  sku: string;
  variant: string;
  brand: string;

  sellingPrice: number;
  mrp: number;

  inventory: number;

  stockSync: boolean;

  createdAt: string;
  updatedAt: string;
}

export const listings: Listing[] = [
  {
    id: "list_000001",
    productId: "1",

    productName: "Kids Anti-Slip EVA Clogs",

    productImage:
      "https://placehold.co/120x120/png",

    marketplace: "Amazon",

    status: "Active",

    sku: "LW-CLG-001",

    variant: "Blue • Size 7",

    brand: "LilWalk",

    sellingPrice: 1299,

    mrp: 1999,

    inventory: 45,

    stockSync: true,

    createdAt: "2026-06-18",

    updatedAt: "2026-07-04",
  },

  {
    id: "list_000002",
    productId: "1",

    productName: "Kids Anti-Slip EVA Clogs",

    productImage:
      "https://placehold.co/120x120/png",

    marketplace: "Flipkart",

    status: "Draft",

    sku: "LW-CLG-001",

    variant: "Blue • Size 7",

    brand: "LilWalk",

    sellingPrice: 1259,

    mrp: 1999,

    inventory: 45,

    stockSync: false,

    createdAt: "2026-06-20",

    updatedAt: "2026-07-03",
  },
];