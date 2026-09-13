import { describe, it, expect, beforeEach } from "vitest";
import { taxonomySyncService } from "../taxonomy-sync.service";
import { MarketplaceName } from "@/lib/types/master-listing";

describe("TaxonomySyncService", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      window.localStorage.clear();
    }
  });

  it("should initialize default 7-day automated refresh schedule", () => {
    const status = taxonomySyncService.getSyncStatus();

    expect(status.syncIntervalDays).toBe(7);
    expect(status.status).toBe("UP_TO_DATE");
    expect(status.channelsSynced).toBeGreaterThanOrEqual(10);
    expect(new Date(status.nextSyncDueAt).getTime()).toBeGreaterThan(new Date(status.lastSyncedAt).getTime());
  });

  it("should trigger on-demand sync and update timestamps", () => {
    const prevStatus = taxonomySyncService.getSyncStatus();
    const updated = taxonomySyncService.triggerAutomatedSync();

    expect(new Date(updated.lastSyncedAt).getTime()).toBeGreaterThanOrEqual(new Date(prevStatus.lastSyncedAt).getTime());
    expect(updated.status).toBe("UP_TO_DATE");
  });

  it("should resolve master category across all channels in parallel", async () => {
    const results = await taxonomySyncService.resolveAllConnectedChannels("Kids Sandals", [
      MarketplaceName.AMAZON,
      MarketplaceName.FLIPKART,
      MarketplaceName.MEESHO,
    ]);

    expect(results[MarketplaceName.AMAZON]).toBeDefined();
    expect(results[MarketplaceName.AMAZON].marketplaceCategoryId).toBe("amzn.cat.shoes.sandals.kids");

    expect(results[MarketplaceName.FLIPKART]).toBeDefined();
    expect(results[MarketplaceName.FLIPKART].marketplaceVertical).toBe("footwear_kids");

    expect(results[MarketplaceName.MEESHO]).toBeDefined();
  });

  it("should detect marketplace drift and record auto-healing alerts", () => {
    const oldNode = "amzn.cat.legacy.123";
    const newNode = "amzn.cat.active.456";

    const ledger = taxonomySyncService.simulateMarketplaceDrift(
      MarketplaceName.AMAZON,
      oldNode,
      newNode
    );

    expect(ledger.status).toBe("DRIFT_DETECTED");
    expect(ledger.driftAlerts.length).toBeGreaterThan(0);
    expect(ledger.driftAlerts[0].previousNodeId).toBe(oldNode);
    expect(ledger.driftAlerts[0].successorNodeId).toBe(newNode);
    expect(ledger.driftAlerts[0].autoHealed).toBe(true);

    // Clear alerts
    const cleared = taxonomySyncService.clearDriftAlerts();
    expect(cleared.status).toBe("UP_TO_DATE");
    expect(cleared.driftAlerts.length).toBe(0);
  });
});
