import { MarketplaceName } from "@/lib/types/master-listing";
import {
  getAllMarketplaceRegistries,
  getMarketplaceRegistry,
} from "@/lib/marketplace/registry/marketplace-registry";

export type ApprovalState =
  | "APPROVED"
  | "ACTION_REQUIRED"
  | "PENDING_REVIEW"
  | "GENERIC_EXEMPTION"
  | "NOT_REQUIRED";

export interface ChannelApprovalInfo {
  marketplace: MarketplaceName;
  marketplaceName: string;
  status: ApprovalState;
  requiresPriorApproval: boolean;
  errorReference?: string; // e.g., "Error 5665" or "Brand Authorization Letter"
  portalUrl?: string;
  notes?: string;
  approvedAt?: string;
  isGenericOverride?: boolean;
}

export interface BrandApprovalRecord {
  brandName: string;
  isGeneric: boolean;
  channels: Record<string, ChannelApprovalInfo>;
  updatedAt: string;
}

const STORAGE_KEY_PREFIX = "commerceos_brand_approval_";

export const CUSTOM_CHANNEL_HINTS: Record<
  string,
  {
    errorReference?: string;
    portalUrl?: string;
    guidelines: string[];
  }
> = {
  [MarketplaceName.AMAZON]: {
    errorReference: "Error 5665 / Brand Registry",
    portalUrl: "https://sellercentral.amazon.in/brand-registry",
    guidelines: [
      "Product and packaging must have the brand name permanently affixed (stamped, printed, engraved, or stitched).",
      "Stickers, tags, or removable labels are not permitted under Error 5665 guidelines.",
      "Images must be real photos of the product held in hand or placed on a table (no computer-generated mockups).",
    ],
  },
  [MarketplaceName.FLIPKART]: {
    errorReference: "Brand Authorization / TM Certificate",
    portalUrl: "https://seller.flipkart.com/index.html#dashboard/brand-approval",
    guidelines: [
      "Requires valid Trademark Certificate (Class matching category) or Brand Authorization Letter / NOC from brand owner.",
      "If reseller, purchase invoice from authorized distributor within the last 6 months is mandatory.",
    ],
  },
  [MarketplaceName.MYNTRA]: {
    errorReference: "Brand Agreement / Tier Gate",
    portalUrl: "https://partners.myntra.com/",
    guidelines: [
      "Requires pre-onboarded brand code in Myntra Partner Portal.",
      "Strict catalog and brand size charts verification applies.",
    ],
  },
  [MarketplaceName.AJIO]: {
    errorReference: "Brand Authorization & Agreement",
    portalUrl: "https://supplier.ajio.com/",
    guidelines: [
      "Requires category buyer sign-off and brand distribution clearance.",
    ],
  },
  [MarketplaceName.NYKAA]: {
    errorReference: "Brand Onboarding Approval",
    portalUrl: "https://www.nykaa.com/",
    guidelines: [
      "Requires authentic manufacturer authorization or direct brand onboarding.",
    ],
  },
  [MarketplaceName.TATACLIQ]: {
    errorReference: "Brand Distribution NOC",
    portalUrl: "https://www.tatacliq.com/",
    guidelines: [
      "Requires authorized brand distribution certificate or trademark license.",
    ],
  },
  [MarketplaceName.MEESHO]: {
    portalUrl: "https://supplier.meesho.com/",
    guidelines: [
      "Open catalog platform — no prior brand certificate or trademark required for standard categories.",
    ],
  },
  [MarketplaceName.SHOPIFY]: {
    guidelines: [
      "Self-hosted store — full catalog ownership with zero brand restrictions.",
    ],
  },
};

class BrandApprovalService {
  private memoryCache: Map<string, BrandApprovalRecord> = new Map();

  private getStorageKey(brand: string): string {
    return `${STORAGE_KEY_PREFIX}${brand.trim().toLowerCase()}`;
  }

  private loadRecord(brand: string): BrandApprovalRecord | null {
    const clean = brand.trim();
    if (!clean) return null;

    const normalizedKey = clean.toLowerCase();
    if (this.memoryCache.has(normalizedKey)) {
      return this.memoryCache.get(normalizedKey)!;
    }

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(this.getStorageKey(clean));
        if (raw) {
          const parsed = JSON.parse(raw) as BrandApprovalRecord;
          this.memoryCache.set(normalizedKey, parsed);
          return parsed;
        }
      } catch {
        // Fallback gracefully if localStorage is disabled or corrupted
      }
    }

    return null;
  }

  private saveRecord(record: BrandApprovalRecord): void {
    const normalizedKey = record.brandName.trim().toLowerCase();
    this.memoryCache.set(normalizedKey, record);

    if (typeof window !== "undefined" && window.localStorage) {
      try {
        window.localStorage.setItem(
          this.getStorageKey(record.brandName),
          JSON.stringify(record)
        );
        window.dispatchEvent(
          new CustomEvent("commerceos_brand_approval_updated", {
            detail: { brand: record.brandName },
          })
        );
      } catch {}
    }
  }

  /**
   * Retrieves approval status across all supported marketplaces dynamically.
   */
  getBrandRecord(brandName: string): BrandApprovalRecord {
    const clean = (brandName || "").trim();
    const existing = this.loadRecord(clean);

    const isGeneric = clean.toLowerCase() === "generic" || clean.toLowerCase() === "unbranded";
    const allRegistries = getAllMarketplaceRegistries();

    if (existing) {
      // Ensure any newly added registries in the system are backfilled into existing record
      let changed = false;
      allRegistries.forEach((reg) => {
        const channelKey = String(reg.code).toLowerCase();
        if (!existing.channels[channelKey]) {
          const customHint = CUSTOM_CHANNEL_HINTS[reg.code];
          const requiresApproval = reg.requiresBrandApproval;
          existing.channels[channelKey] = {
            marketplace: reg.code,
            marketplaceName: reg.name,
            status: isGeneric ? "GENERIC_EXEMPTION" : requiresApproval ? "ACTION_REQUIRED" : "NOT_REQUIRED",
            requiresPriorApproval: requiresApproval,
            errorReference: customHint?.errorReference || (requiresApproval ? "Brand Authorization" : undefined),
            portalUrl: customHint?.portalUrl || reg.documentationUrl,
            isGenericOverride: isGeneric,
          };
          changed = true;
        }
      });
      if (changed) {
        this.saveRecord(existing);
      }
      return existing;
    }

    // Default seed record for a new brand dynamically across all registries
    const channels: Record<string, ChannelApprovalInfo> = {};

    allRegistries.forEach((reg) => {
      const channelKey = String(reg.code).toLowerCase();
      const customHint = CUSTOM_CHANNEL_HINTS[reg.code];
      const requiresApproval = reg.requiresBrandApproval;

      let status: ApprovalState = "APPROVED";
      if (isGeneric) {
        status = "GENERIC_EXEMPTION";
      } else if (requiresApproval) {
        status = "ACTION_REQUIRED";
      } else {
        status = "NOT_REQUIRED";
      }

      channels[channelKey] = {
        marketplace: reg.code,
        marketplaceName: reg.name,
        status,
        requiresPriorApproval: requiresApproval,
        errorReference: customHint?.errorReference || (requiresApproval ? "Brand Authorization" : undefined),
        portalUrl: customHint?.portalUrl || reg.documentationUrl,
        isGenericOverride: isGeneric,
      };
    });

    const newRecord: BrandApprovalRecord = {
      brandName: clean || "Unbranded",
      isGeneric,
      channels,
      updatedAt: new Date().toISOString(),
    };

    return newRecord;
  }

  /**
   * Updates approval status for a single marketplace channel.
   */
  updateChannelStatus(
    brandName: string,
    channel: MarketplaceName,
    status: ApprovalState,
    notes?: string
  ): BrandApprovalRecord {
    const record = this.getBrandRecord(brandName);
    const channelKey = String(channel).toLowerCase();

    const reg = getMarketplaceRegistry(channel);
    const existingChannel = record.channels[channelKey] || {
      marketplace: channel,
      marketplaceName: reg.name,
      status: "ACTION_REQUIRED",
      requiresPriorApproval: Boolean(reg.requiresBrandApproval),
    };

    record.channels[channelKey] = {
      ...existingChannel,
      status,
      notes: notes !== undefined ? notes : existingChannel.notes,
      approvedAt: status === "APPROVED" ? new Date().toISOString() : existingChannel.approvedAt,
    };

    record.updatedAt = new Date().toISOString();
    this.saveRecord(record);
    return record;
  }

  /**
   * Toggles whether this brand should be sold as 'Generic' (bypassing brand restrictions).
   */
  setGenericMode(brandName: string, isGeneric: boolean): BrandApprovalRecord {
    const record = this.getBrandRecord(brandName);
    record.isGeneric = isGeneric;

    Object.keys(record.channels).forEach((ch) => {
      const channelInfo = record.channels[ch];
      if (!channelInfo) return;

      if (isGeneric) {
        channelInfo.status = "GENERIC_EXEMPTION";
        channelInfo.isGenericOverride = true;
      } else if (channelInfo.requiresPriorApproval) {
        // Reset to ACTION_REQUIRED if it was not previously approved
        if (channelInfo.status === "GENERIC_EXEMPTION") {
          channelInfo.status = channelInfo.approvedAt ? "APPROVED" : "ACTION_REQUIRED";
        }
        channelInfo.isGenericOverride = false;
      }
    });

    record.updatedAt = new Date().toISOString();
    this.saveRecord(record);
    return record;
  }

  /**
   * Quick check whether a brand is approved or exempt on a given marketplace.
   */
  isBrandApproved(brandName: string, channel: MarketplaceName): boolean {
    const clean = (brandName || "").trim().toLowerCase();
    if (clean === "generic" || clean === "unbranded") return true;

    const record = this.getBrandRecord(brandName);
    if (record.isGeneric) return true;

    const channelKey = String(channel).toLowerCase();
    const ch = record.channels[channelKey];
    if (!ch) return true;

    return ch.status === "APPROVED" || ch.status === "NOT_REQUIRED" || ch.status === "GENERIC_EXEMPTION";
  }
}

export const brandApprovalService = new BrandApprovalService();
