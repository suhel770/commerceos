import { DEMO_ORG_ID, DEMO_WS_ID } from "./ids";

/**
 * StrideKids — Phase 1 demo ecommerce company (Procurement SSOT).
 * Future Inventory / Listings / Orders must reuse this identity.
 */
export const DEMO_BUSINESS = {
  organizationId: DEMO_ORG_ID,
  workspaceId: DEMO_WS_ID,
  legalName: "StrideKids Retail Private Limited",
  brand: "StrideKids",
  tradeName: "StrideKids",
  gstin: "27AABCS4821R1ZM",
  pan: "AABCS4821R",
  buyerStateCode: "27",
  buyerState: "Maharashtra",
  address: "Unit 12, Bhiwandi Logistics Park, Near Kalyan Bypass",
  city: "Bhiwandi",
  pincode: "421302",
  phone: "+91 98765 41020",
  email: "ops@stridekids.in",
  ownerName: "Amir",
  marketplaces: ["Amazon", "Flipkart", "Meesho", "Shopify"] as const,
  description:
    "Indian ecommerce seller of kids footwear, women's footwear, socks, rainwear and accessories across major marketplaces and D2C Shopify.",
} as const;

export type DemoBusiness = typeof DEMO_BUSINESS;
