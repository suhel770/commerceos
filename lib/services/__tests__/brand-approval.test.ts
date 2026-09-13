import { describe, it, expect, beforeEach } from "vitest";
import { brandApprovalService } from "../brand-approval.service";
import { MarketplaceName } from "@/lib/types/master-listing";

describe("BrandApprovalService", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  it("should initialize default policies for a new custom brand", () => {
    const record = brandApprovalService.getBrandRecord("AlphaTech");
    expect(record.brandName).toBe("AlphaTech");
    expect(record.isGeneric).toBe(false);

    // Amazon and Flipkart require approval
    expect(record.channels[MarketplaceName.AMAZON].status).toBe("ACTION_REQUIRED");
    expect(record.channels[MarketplaceName.FLIPKART].status).toBe("ACTION_REQUIRED");

    // Meesho does not require prior approval
    expect(record.channels[MarketplaceName.MEESHO].status).toBe("NOT_REQUIRED");
  });

  it("should automatically exempt 'Generic' or 'Unbranded' brands", () => {
    const genericRecord = brandApprovalService.getBrandRecord("Generic");
    expect(genericRecord.isGeneric).toBe(true);
    expect(genericRecord.channels[MarketplaceName.AMAZON].status).toBe("GENERIC_EXEMPTION");
    expect(brandApprovalService.isBrandApproved("Generic", MarketplaceName.AMAZON)).toBe(true);
  });

  it("should mark a channel as approved and reflect in isBrandApproved", () => {
    const brand = "ZestyWear";
    expect(brandApprovalService.isBrandApproved(brand, MarketplaceName.AMAZON)).toBe(false);

    brandApprovalService.updateChannelStatus(brand, MarketplaceName.AMAZON, "APPROVED", "Approved via Seller Central");
    expect(brandApprovalService.isBrandApproved(brand, MarketplaceName.AMAZON)).toBe(true);

    const updatedRecord = brandApprovalService.getBrandRecord(brand);
    expect(updatedRecord.channels[MarketplaceName.AMAZON].status).toBe("APPROVED");
    expect(updatedRecord.channels[MarketplaceName.AMAZON].notes).toBe("Approved via Seller Central");
    expect(updatedRecord.channels[MarketplaceName.AMAZON].approvedAt).toBeDefined();
  });

  it("should toggle generic mode for an existing brand", () => {
    const brand = "EcoGoods";
    brandApprovalService.setGenericMode(brand, true);

    expect(brandApprovalService.isBrandApproved(brand, MarketplaceName.AMAZON)).toBe(true);
    expect(brandApprovalService.isBrandApproved(brand, MarketplaceName.FLIPKART)).toBe(true);

    const record = brandApprovalService.getBrandRecord(brand);
    expect(record.isGeneric).toBe(true);
    expect(record.channels[MarketplaceName.AMAZON].status).toBe("GENERIC_EXEMPTION");
  });
});
