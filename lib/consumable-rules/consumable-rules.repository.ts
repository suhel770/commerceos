/**
 * CommerceOS — Consumable Usage Rules Repository
 * ==============================================
 * Tenant-scoped persistence layer for Product Packaging & Consumable Usage Rules.
 */

import { db } from "@/lib/db";
import type {
  ConsumableUsageRule,
  CreateConsumableRuleInput,
  UpdateConsumableRuleInput,
  ConsumptionMode,
} from "./types";
import { inventoryConsumptionLedger } from "@/lib/inventory/consumption-ledger";
import { ConsumableService } from "@/lib/consumables/consumable.service";

const STORAGE_KEY = "commerceos_product_consumable_rules_v1";

// No fake seed rules — strictly driven by live tenant inventory
const SEED_RULES: ConsumableUsageRule[] = [];

export class ConsumableRulesRepository {
  private rules: ConsumableUsageRule[] = [];
  private isLoaded = false;

  constructor() {
    this.init();
  }

  private init() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === "undefined") {
      this.rules = [...SEED_RULES];
      this.isLoaded = true;
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.rules = parsed;
        } else {
          this.rules = [...SEED_RULES];
          this.saveToStorage();
        }
      } else {
        this.rules = [...SEED_RULES];
        this.saveToStorage();
      }
    } catch {
      this.rules = [...SEED_RULES];
    }
    this.isLoaded = true;
  }

  private saveToStorage() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.rules));
      window.dispatchEvent(new Event("commerceos_consumable_rules_updated"));
    } catch {}
  }

  private async ensureSeeded(organizationId: string, workspaceId: string): Promise<void> {
    try {
      const count = await db.consumableRule.count({
        where: { organizationId, workspaceId },
      });
      if (count === 0) {
        for (const rule of SEED_RULES) {
          await db.consumableRule.create({
            data: {
              id: rule.id,
              organizationId,
              workspaceId,
              productId: rule.productId,
              productSku: rule.productSku,
              consumableSku: rule.consumableSku,
              consumableName: rule.consumableName,
              quantity: rule.quantity,
              unit: rule.unit,
              consumptionMode: rule.consumptionMode,
              notes: rule.notes || null,
              active: rule.active,
            },
          });
        }
      }
    } catch (err) {
      console.warn("Failed to seed consumable rules in DB:", err);
    }
  }

  public async getAllRules(tenantScope?: { organizationId?: string; workspaceId?: string }): Promise<ConsumableUsageRule[]> {
    const orgId = tenantScope?.organizationId || "org-commerceos";
    const wsId = tenantScope?.workspaceId || "ws-default";
    await this.ensureSeeded(orgId, wsId);

    if (process.env.NODE_ENV !== "test") {
      try {
        const rows = await db.consumableRule.findMany({
          where: {
            organizationId: tenantScope?.organizationId || undefined,
            workspaceId: tenantScope?.workspaceId || undefined,
          },
          orderBy: { createdAt: "desc" },
        });
        if (rows.length > 0) {
          return rows.map((r) => ({
            id: r.id,
            organizationId: r.organizationId,
            workspaceId: r.workspaceId,
            productId: r.productId || "",
            productSku: r.productSku,
            variantSku: (r as any).variantSku || undefined,
            consumableSku: r.consumableSku,
            consumableName: r.consumableName,
            quantity: Number(r.quantity),
            unit: r.unit,
            consumptionMode: r.consumptionMode as ConsumptionMode,
            notes: r.notes || undefined,
            active: r.active,
            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt.toISOString(),
          }));
        }
      } catch (err) {
        console.warn("[ConsumableRulesRepository] DB query failed, using memory:", err);
      }
    }

    if (!this.isLoaded) this.loadFromStorage();
    let result = [...this.rules];
    if (tenantScope?.organizationId) {
      result = result.filter((r) => r.organizationId === tenantScope.organizationId);
    }
    if (tenantScope?.workspaceId) {
      result = result.filter((r) => r.workspaceId === tenantScope.workspaceId);
    }
    return result;
  }

  public async getRulesByProductId(
    productId: string,
    tenantScope?: { organizationId?: string; workspaceId?: string }
  ): Promise<ConsumableUsageRule[]> {
    const allRules = await this.getAllRules(tenantScope);
    const pIdLower = productId.toLowerCase().trim();
    return allRules.filter(
      (r) => r.productId.toLowerCase().trim() === pIdLower
    );
  }

  public async getRulesByProductSku(
    productSku: string,
    tenantScope?: { organizationId?: string; workspaceId?: string }
  ): Promise<ConsumableUsageRule[]> {
    const allRules = await this.getAllRules(tenantScope);
    const pSkuLower = productSku.toLowerCase().trim();
    return allRules.filter(
      (r) => r.productSku.toLowerCase().trim() === pSkuLower
    );
  }

  public async getRuleById(
    id: string,
    tenantScope?: { organizationId?: string; workspaceId?: string }
  ): Promise<ConsumableUsageRule | null> {
    if (process.env.NODE_ENV !== "test") {
      try {
        const row = await db.consumableRule.findUnique({
          where: { id },
        });
        if (row) {
          if (tenantScope?.organizationId && row.organizationId !== tenantScope.organizationId) return null;
          if (tenantScope?.workspaceId && row.workspaceId !== tenantScope.workspaceId) return null;
          return {
            id: row.id,
            organizationId: row.organizationId,
            workspaceId: row.workspaceId,
            productId: row.productId || "",
            productSku: row.productSku,
            variantSku: (row as any).variantSku || undefined,
            consumableSku: row.consumableSku,
            consumableName: row.consumableName,
            quantity: Number(row.quantity),
            unit: row.unit,
            consumptionMode: row.consumptionMode as ConsumptionMode,
            notes: row.notes || undefined,
            active: row.active,
            createdAt: row.createdAt.toISOString(),
            updatedAt: row.updatedAt.toISOString(),
          };
        }
      } catch {}
    }

    if (!this.isLoaded) this.loadFromStorage();
    const rule = this.rules.find((r) => r.id === id);
    if (!rule) return null;
    if (tenantScope?.organizationId && rule.organizationId !== tenantScope.organizationId) {
      return null;
    }
    if (tenantScope?.workspaceId && rule.workspaceId !== tenantScope.workspaceId) {
      return null;
    }
    return { ...rule };
  }

  public async createRule(input: CreateConsumableRuleInput): Promise<ConsumableUsageRule> {
    const orgId = input.organizationId || "org-commerceos";
    const wsId = input.workspaceId || "ws-default";
    const now = new Date().toISOString();
    const id = `crule-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const newRule: ConsumableUsageRule = {
      id,
      organizationId: orgId,
      workspaceId: wsId,
      productId: input.productId.trim(),
      productSku: input.productSku.trim(),
      variantSku: input.variantSku?.trim() || undefined,
      consumableSku: input.consumableSku.trim(),
      consumableName: input.consumableName?.trim() || input.consumableSku.trim(),
      quantity: Number(input.quantity),
      unit: input.unit?.trim() || "pcs",
      consumptionMode: input.consumptionMode || "PER_UNIT",
      notes: input.notes?.trim() || undefined,
      active: input.active !== undefined ? input.active : true,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await db.consumableRule.create({
        data: {
          id,
          organizationId: orgId,
          workspaceId: wsId,
          productId: input.productId.trim(),
          productSku: input.productSku.trim(),
          consumableSku: input.consumableSku.trim(),
          consumableName: input.consumableName?.trim() || input.consumableSku.trim(),
          quantity: Math.max(1, Math.round(Number(input.quantity))),
          unit: input.unit?.trim() || "pcs",
          consumptionMode: input.consumptionMode || "PER_UNIT",
          notes: input.notes?.trim() || null,
          active: input.active !== undefined ? input.active : true,
        },
      });
    } catch (err) {
      console.warn("[ConsumableRulesRepository] DB create failed, using memory:", err);
    }

    this.rules.unshift(newRule);
    this.saveToStorage();
    return newRule;
  }

  public async updateRule(
    id: string,
    input: UpdateConsumableRuleInput
  ): Promise<ConsumableUsageRule | null> {
    try {
      const existing = await db.consumableRule.findUnique({ where: { id } });
      if (existing) {
        const updated = await db.consumableRule.update({
          where: { id },
          data: {
            quantity: input.quantity !== undefined ? Number(input.quantity) : undefined,
            unit: input.unit?.trim() || undefined,
            consumptionMode: input.consumptionMode || undefined,
            notes: input.notes !== undefined ? input.notes.trim() || null : undefined,
            active: input.active !== undefined ? input.active : undefined,
          },
        });
        return {
          id: updated.id,
          organizationId: updated.organizationId,
          workspaceId: updated.workspaceId,
          productId: updated.productId || "",
          productSku: updated.productSku,
          consumableSku: updated.consumableSku,
          consumableName: updated.consumableName,
          quantity: updated.quantity,
          unit: updated.unit,
          consumptionMode: updated.consumptionMode as ConsumptionMode,
          notes: updated.notes || undefined,
          active: updated.active,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      }
    } catch (err) {
      console.warn("[ConsumableRulesRepository] DB update failed, using memory:", err);
    }

    if (!this.isLoaded) this.loadFromStorage();
    const index = this.rules.findIndex((r) => r.id === id);
    if (index === -1) return null;

    const existing = this.rules[index];
    const updated: ConsumableUsageRule = {
      ...existing,
      quantity: input.quantity !== undefined ? Number(input.quantity) : existing.quantity,
      unit: input.unit?.trim() || existing.unit,
      consumptionMode: input.consumptionMode || existing.consumptionMode,
      notes: input.notes !== undefined ? input.notes.trim() || undefined : existing.notes,
      active: input.active !== undefined ? input.active : existing.active,
      updatedAt: new Date().toISOString(),
    };

    this.rules[index] = updated;
    this.saveToStorage();
    return updated;
  }

  public async deleteRule(id: string, tenantScope?: { organizationId?: string; workspaceId?: string }): Promise<boolean> {
    try {
      const existing = await db.consumableRule.findUnique({ where: { id } });
      if (existing) {
        await db.consumableRule.delete({ where: { id } });
        return true;
      }
    } catch (err) {
      console.warn("[ConsumableRulesRepository] DB delete failed, using memory:", err);
    }

    if (!this.isLoaded) this.loadFromStorage();
    const index = this.rules.findIndex((r) => r.id === id);
    if (index === -1) return false;

    if (tenantScope?.organizationId && this.rules[index].organizationId !== tenantScope.organizationId) {
      return false;
    }

    this.rules.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  public async getAuthoritativeConsumableOptions(tenantScope?: {
    organizationId?: string;
    workspaceId?: string;
    warehouseId?: string;
  }): Promise<Array<{
    sku: string;
    productName: string;
    unit: string;
    availableStock: number;
  }>> {
    try {
      // Authoritative live inventory consumable items matching the Consumables & Packaging page
      const consumables = await ConsumableService.getConsumables({
        organizationId: tenantScope?.organizationId,
        workspaceId: tenantScope?.workspaceId,
      });

      return consumables.map((c) => ({
        sku: c.sku,
        productName: c.name,
        unit: c.unit || "pcs",
        availableStock: c.available,
      })).sort((a, b) => a.sku.localeCompare(b.sku));
    } catch (err) {
      console.warn("[ConsumableRulesRepository] getAuthoritativeConsumableOptions failed:", err);
      return [];
    }
  }

  public async clearForTesting(): Promise<void> {
    this.rules = [];
    try {
      await db.consumableRule.deleteMany({});
    } catch {}
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }
}

export const consumableUsageRuleRepository = new ConsumableRulesRepository();
