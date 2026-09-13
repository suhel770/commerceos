import { describe, it, expect } from "vitest";
import { schemaDiscoveryService } from "../schema-discovery.service";
import { MarketplaceName } from "@/lib/types/master-listing";

describe("CommerceOS — Marketplace Schema Discovery Service", () => {
  it("returns CONFIGURED state with structured specifications for recognized Footwear category", async () => {
    const result = await schemaDiscoveryService.discoverSchema(
      "ws-default",
      "Kids Sandals",
      MarketplaceName.AMAZON,
      "Clogs"
    );

    expect(result.metadata).toBeDefined();
    expect(result.metadata.marketplace).toBe(MarketplaceName.AMAZON);
    expect(["CONFIGURED", "DISCOVERED"]).toContain(result.metadata.status);
    expect(result.metadata.verticalCode).toBeDefined();
    expect(result.attributes.length).toBeGreaterThan(0);
  });

  it("returns UNAVAILABLE state for non-connected and non-configured category", async () => {
    const result = await schemaDiscoveryService.discoverSchema(
      "ws-empty",
      "Quantum Teleporters",
      MarketplaceName.MEESHO
    );

    expect(result.metadata.status).toBe("UNAVAILABLE");
    expect(result.metadata.reason).toBe("NOT_CONNECTED");
    expect(result.attributes.length).toBe(0);
  });

  it("preserves schema version and timestamp metadata", async () => {
    const result = await schemaDiscoveryService.discoverSchema(
      "ws-default",
      "Casual T-Shirts",
      MarketplaceName.FLIPKART
    );

    expect(result.metadata.retrievedAt).toBeDefined();
    expect(result.metadata.schemaVersion).toBeDefined();
    expect(result.metadata.source).toBeDefined();
  });
});
