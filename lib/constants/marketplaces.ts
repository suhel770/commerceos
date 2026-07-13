export const MARKETPLACES = [
  "Amazon",
  "Flipkart",
  "Meesho",
  "Shopify",
  "WooCommerce",
] as const;

export type Marketplace =
  typeof MARKETPLACES[number];

export const MARKETPLACE_COLORS = {
  Amazon: "#FF9900",
  Flipkart: "#2874F0",
  Meesho: "#F43397",
  Shopify: "#95BF47",
  WooCommerce: "#7F54B3",
};