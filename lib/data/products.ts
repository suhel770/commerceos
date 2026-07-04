import { Product } from "../types/product";

export const products: Product[] = [
  {
    id: 1,

    sku: "LW-001",

    name: "LilWalk Dino Clogs",

    category: "Kids Clogs",

    image: "🩴",

    costPrice: 350,

    stock: 152,

    sold30Days: 48,

    listings: [
      {
        id: "list_000001",

        marketplace: "amazon",

        title: "LilWalk Dino Clogs",

        sellingPrice: 699,

        stockSync: true,

        status: "Live",
      },

      {
        id: "list_000002",

        marketplace: "flipkart",

        title: "LilWalk Dino Clogs",

        sellingPrice: 729,

        stockSync: true,

        status: "Draft",
      },

      {
        id: "list_000003",

        marketplace: "meesho",

        title: "LilWalk Dino Clogs",

        sellingPrice: 649,

        stockSync: true,

        status: "Live",
      },

      {
        id: "list_000004",

        marketplace: "shopify",

        title: "LilWalk Dino Clogs",

        sellingPrice: 699,

        stockSync: true,

        status: "Live",
      },
    ],
  },

  {
    id: 2,

    sku: "LW-002",

    name: "LilWalk Panda Clogs",

    category: "Kids Clogs",

    image: "🩴",

    costPrice: 390,

    stock: 54,

    sold30Days: 21,

    listings: [
      {
        id: "list_000005",

        marketplace: "amazon",

        title: "LilWalk Panda Clogs",

        sellingPrice: 749,

        stockSync: true,

        status: "Live",
      },
    ],
  },

  {
    id: 3,

    sku: "LW-003",

    name: "LilWalk Shark Clogs",

    category: "Kids Clogs",

    image: "🩴",

    costPrice: 420,

    stock: 0,

    sold30Days: 0,

    listings: [
      {
        id: "list_000006",

        marketplace: "shopify",

        title: "LilWalk Shark Clogs",

        sellingPrice: 799,

        stockSync: true,

        status: "Inactive",
      },

      {
        id: "list_000007",

        marketplace: "meesho",

        title: "LilWalk Shark Clogs",

        sellingPrice: 749,

        stockSync: true,

        status: "Draft",
      },
    ],
  },
];