export const MARKETPLACES = {
  amazon: {
    id: "amazon",
    name: "Amazon",
    color: "orange",
    enabled: true,
  },

  flipkart: {
    id: "flipkart",
    name: "Flipkart",
    color: "blue",
    enabled: true,
  },

  meesho: {
    id: "meesho",
    name: "Meesho",
    color: "pink",
    enabled: true,
  },

  shopify: {
    id: "shopify",
    name: "Shopify",
    color: "green",
    enabled: true,
  },
} as const;

export type MarketplaceId = keyof typeof MARKETPLACES;