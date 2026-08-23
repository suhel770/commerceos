import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { channelAllocationEngine } from "../channel-allocation.engine";
import { consumableRulesService } from "@/lib/consumable-rules/consumable-rules.service";
import { consumableUsageRuleRepository } from "@/lib/consumable-rules/consumable-rules.repository";

describe("CommerceOS — DB Rules Persistence & Authority Tests", () => {
  const wsId = "ws-test-persistence";
  const orgId = "org-test-persistence";
  let isDbAvailable = false;

  beforeEach(async () => {
    try {
      await db.$queryRaw`SELECT 1`;
      isDbAvailable = true;
      if (isDbAvailable) {
        const firstOrg = await db.organization.findFirst();
        const firstWs = await db.workspace.findFirst();
        console.log("DB_DATA:", { firstOrg, firstWs });
      }
      await db.channelAllocationRule.deleteMany({ where: { workspaceId: wsId } });
      await db.consumableRule.deleteMany({ where: { workspaceId: wsId } });
    } catch {
      isDbAvailable = false;
    }
  });

  it("1. Channel Allocation Rules can be written and read from DB / Memory", async () => {
    const sku = "SKU-PERSIST-TEST";
    
    if (isDbAvailable) {
      await db.channelAllocationRule.create({
        data: {
          workspaceId: wsId,
          sku: sku.toLowerCase(),
          channel: "AMAZON",
          allocationPercent: 40,
          fixedCap: 10,
          active: true,
        }
      });

      const dbRules = await db.channelAllocationRule.findMany({
        where: { workspaceId: wsId, sku: sku.toLowerCase() }
      });

      expect(dbRules.length).toBe(1);
      expect(dbRules[0].channel).toBe("AMAZON");
      expect(dbRules[0].allocationPercent).toBe(40);
      expect(dbRules[0].fixedCap).toBe(10);
    } else {
      channelAllocationEngine.setRulesForSku(sku, [
        {
          channel: "AMAZON",
          percentage: 40,
          fixedCap: 10,
          active: true,
        }
      ]);
      const memoryRules = channelAllocationEngine.getRulesForSku(sku);
      expect(memoryRules.length).toBe(1);
      expect(memoryRules[0].channel).toBe("AMAZON");
      expect(memoryRules[0].percentage).toBe(40);
      expect(memoryRules[0].fixedCap).toBe(10);
    }
  });

  it("2. Consumable Rules seed automatically and can be read from DB / Memory", async () => {
    const queryOrg = isDbAvailable ? orgId : "org-commerceos";
    const queryWs = isDbAvailable ? wsId : "ws-default";

    const rules = await consumableUsageRuleRepository.getAllRules({
      organizationId: queryOrg,
      workspaceId: queryWs,
    });

    expect(rules.length).toBeGreaterThan(0);

    if (isDbAvailable) {
      const dbRules = await db.consumableRule.findMany({
        where: { workspaceId: wsId }
      });
      expect(dbRules.length).toBe(rules.length);
    } else {
      expect(rules[0].consumableSku).toBe("SKU-BOX-S");
    }
  });
});
