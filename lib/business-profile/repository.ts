import { DEMO_BUSINESS } from "@/lib/demo-business";
import {
  stateCodeFromGstin,
  stateName,
} from "@/lib/purchase/gst";

import type {
  BusinessProfile,
  UpdateBusinessProfileInput,
} from "./types";

function nowIso() {
  return new Date().toISOString();
}

function seedProfile(): BusinessProfile {
  return {
    organizationId: DEMO_BUSINESS.organizationId,
    workspaceId: DEMO_BUSINESS.workspaceId,
    legalName: DEMO_BUSINESS.legalName,
    brand: DEMO_BUSINESS.brand,
    tradeName: DEMO_BUSINESS.tradeName,
    gstin: DEMO_BUSINESS.gstin,
    pan: DEMO_BUSINESS.pan,
    buyerStateCode: DEMO_BUSINESS.buyerStateCode,
    buyerState: DEMO_BUSINESS.buyerState,
    address: DEMO_BUSINESS.address,
    city: DEMO_BUSINESS.city,
    pincode: DEMO_BUSINESS.pincode,
    phone: DEMO_BUSINESS.phone,
    email: DEMO_BUSINESS.email,
    ownerName: DEMO_BUSINESS.ownerName,
    updatedAt: nowIso(),
  };
}

function normalizeGstin(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function applyGstinState(profile: BusinessProfile): BusinessProfile {
  const fromGstin = stateCodeFromGstin(profile.gstin);
  if (!fromGstin) return profile;
  return {
    ...profile,
    buyerStateCode: fromGstin,
    buyerState: stateName(fromGstin),
  };
}

class BusinessProfileRepository {
  private profile: BusinessProfile = applyGstinState(seedProfile());

  get(): BusinessProfile {
    return structuredClone(this.profile);
  }

  /** Buyer state for purchase tax mode — always prefer GSTIN prefix. */
  getBuyerStateCode(): string {
    return (
      stateCodeFromGstin(this.profile.gstin) ||
      this.profile.buyerStateCode ||
      DEMO_BUSINESS.buyerStateCode
    );
  }

  getBuyerGstin(): string {
    return this.profile.gstin;
  }

  update(input: UpdateBusinessProfileInput): BusinessProfile {
    const next: BusinessProfile = {
      ...this.profile,
      legalName:
        input.legalName !== undefined
          ? input.legalName.trim()
          : this.profile.legalName,
      brand:
        input.brand !== undefined ? input.brand.trim() : this.profile.brand,
      tradeName:
        input.tradeName !== undefined
          ? input.tradeName.trim()
          : this.profile.tradeName,
      gstin:
        input.gstin !== undefined
          ? normalizeGstin(input.gstin)
          : this.profile.gstin,
      pan:
        input.pan !== undefined
          ? input.pan.trim().toUpperCase()
          : this.profile.pan,
      address:
        input.address !== undefined
          ? input.address.trim()
          : this.profile.address,
      city: input.city !== undefined ? input.city.trim() : this.profile.city,
      pincode:
        input.pincode !== undefined
          ? input.pincode.trim()
          : this.profile.pincode,
      phone:
        input.phone !== undefined ? input.phone.trim() : this.profile.phone,
      email:
        input.email !== undefined
          ? input.email.trim().toLowerCase()
          : this.profile.email,
      ownerName:
        input.ownerName !== undefined
          ? input.ownerName.trim()
          : this.profile.ownerName,
      updatedAt: nowIso(),
    };

    if (input.gstin !== undefined && next.gstin && next.gstin.length !== 15) {
      throw new Error("GSTIN must be 15 characters.");
    }
    if (input.gstin !== undefined && next.gstin && !stateCodeFromGstin(next.gstin)) {
      throw new Error("GSTIN must start with a valid 2-digit state code.");
    }

    this.profile = applyGstinState(next);
    return this.get();
  }
}

export const businessProfileRepository = new BusinessProfileRepository();
