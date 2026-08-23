/**
 * Seller / organization business profile (buyer for purchase GST).
 * Tax mode compares this GSTIN state vs vendor GSTIN state.
 */
export type BusinessProfile = {
  organizationId: string;
  workspaceId: string;
  legalName: string;
  brand: string;
  tradeName: string;
  /** 15-char GSTIN — state code is the first 2 digits */
  gstin: string;
  pan: string;
  /** Derived from GSTIN when present; used for CGST+SGST vs IGST */
  buyerStateCode: string;
  buyerState: string;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  email: string;
  ownerName: string;
  updatedAt: string;
};

export type UpdateBusinessProfileInput = {
  legalName?: string;
  brand?: string;
  tradeName?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  ownerName?: string;
};
