import { describe, it, expect } from "vitest";
import { ConsumableService } from "../consumable.service";

describe("ConsumableService Unit Cost Verification", () => {
  it("fetches consumables with real unitCost from database instead of hardcoded 15", async () => {
    const consumables = await ConsumableService.getConsumables({
      organizationId: "org-commerceos",
      workspaceId: "ws-default",
    });

    console.log("Returned Consumables:", consumables.map((c) => ({
      sku: c.sku,
      name: c.name,
      available: c.available,
      unitCost: c.unitCost,
    })));

    expect(consumables.length).toBeGreaterThan(0);

    for (const c of consumables) {
      if (c.sku === "BUBWRP750") {
        expect(c.unitCost).toBe(245);
      }
      if (c.sku === "PCKTAP872") {
        expect(c.unitCost).toBe(62);
      }
      if (c.sku === "THRLPR") {
        expect(c.unitCost).toBe(185);
      }
    }
  });
});
