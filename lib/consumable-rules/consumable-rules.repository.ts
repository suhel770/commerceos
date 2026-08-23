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

const STORAGE_KEY = "commerceos_product_consumable_rules_v1";

// Baseline initial seed rules for standard catalog items
const SEED_RULES: ConsumableUsageRule[] = [
  {
    id: "crule-seed-001",
    organizationId: "org-commerceos",
    workspaceId: "ws-default",
    productId: "prod-1",
    productSku: "SKU-NOVA-SAND-PNK",
    consumableSku: "SKU-BOX-S",
    consumableName: "Courier Box Small",
    quantity: 1,
    unit: "pcs",
    consumptionMode: "PER_UNIT",
    notes: "Primary individual shoebox",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "crule-seed-002",
    organizationId: "org-commerceos",
    workspaceId: "ws-default",
    productId: "prod-1",
    productSku: "SKU-NOVA-SAND-PNK",
    consumableSku: "SKU-POLY-M",
    consumableName: "Polybag Medium 12x16",
    quantity: 1,
    unit: "pcs",
    consumptionMode: "PER_UNIT",
    notes: "Dust protection wrap",
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

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

    try {
      const rows = await db.consumableRule.findMany({
        where: {
          organizationId: tenantScope?.organizationId || undefined,
          workspaceId: tenantScope?.workspaceId || undefined,
        },
        orderBy: { createdAt: "desc" },
      });
      return rows.map((r) => ({
        id: r.id,
        organizationId: r.organizationId,
        workspaceId: r.workspaceId,
        productId: r.productId || "",
        productSku: r.productSku,
        consumableSku: r.consumableSku,
        consumableName: r.consumableName,
        quantity: r.quantity,
        unit: r.unit,
        consumptionMode: r.consumptionMode as ConsumptionMode,
        notes: r.notes || undefined,
        active: r.active,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
      }));
    } catch (err) {
      console.warn("[ConsumableRulesRepository] DB query failed, using memory:", err);
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
          consumableSku: row.consumableSku,
          consumableName: row.consumableName,
          quantity: row.quantity,
          unit: row.unit,
          consumptionMode: row.consumptionMode as ConsumptionMode,
          notes: row.notes || undefined,
          active: row.active,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        };
      }
    } catch {}

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

    try {
      const created = await db.consumableRule.create({
        data: {
          id,
          organizationId: orgId,
          workspaceId: wsId,
          productId: input.productId.trim(),
          productSku: input.productSku.trim(),
          consumableSku: input.consumableSku.trim(),
          consumableName: input.consumableName?.trim() || input.consumableSku.trim(),
          quantity: Number(input.quantity),
          unit: input.unit?.trim() || "pcs",
          consumptionMode: input.consumptionMode || "PER_UNIT",
          notes: input.notes?.trim() || null,
          active: input.active !== undefined ? input.active : true,
        },
      });
      return {
        id: created.id,
        organizationId: created.organizationId,
        workspaceId: created.workspaceId,
        productId: created.productId || "",
        productSku: created.productSku,
        consumableSku: created.consumableSku,
        consumableName: created.consumableName,
        quantity: created.quantity,
        unit: created.unit,
        consumptionMode: created.consumptionMode as ConsumptionMode,
        notes: created.notes || undefined,
        active: created.active,
        createdAt: created.createdAt.toISOString(),
        updatedAt: created.updatedAt.toISOString(),
      };
    } catch (err) {
      console.warn("[ConsumableRulesRepository] DB create failed, using memory:", err);
    }

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

  public async getAuthoritativeConsumableOptions(): Promise<Array<{
    sku: string;
    productName: string;
    unit: string;
    availableStock: number;
  }>> {
    const consumableMap = new Map<string, { sku: string; productName: string; unit: string; availableStock: number }>();
    try {
      const dbInv = await db.inventory.findMany({
        where: { intent: "consumable" },
        include: { product: true }
      });
      for (const b of dbInv) {
        const key = b.sku.toLowerCase().trim();
        if (consumableMap.has(key)) {
          const existing = consumableMap.get(key)!;
          existing.availableStock += b.available;
        } else {
          consumableMap.set(key, {
            sku: b.sku,
            productName: b.product?.name || b.sku,
            unit: "pcs",
            availableStock: b.available,
          });
        }
      }
    } catch {
      // ignore
    }

    // Default known standard packaging consumables if storage is currently unseeded
    const standardDefaults = [
      { sku: "SKU-BOX-S", productName: "Courier Box Small", unit: "pcs", availableStock: 0 },
      { sku: "SKU-BOX-M", productName: "Courier Box Medium", unit: "pcs", availableStock: 0 },
      { sku: "SKU-BOX-L", productName: "Courier Box Large", unit: "pcs", availableStock: 0 },
      { sku: "SKU-POLY-M", productName: "Polybag Medium 12x16", unit: "pcs", availableStock: 0 },
      { sku: "SKU-STICKER-QC", productName: "Barcode & QC Sticker Label", unit: "pcs", availableStock: 0 },
      { sku: "SKU-TAPE-BROWN", productName: "Packaging Tape Roll (meters)", unit: "meters", availableStock: 0 },
      { sku: "SKU-BUBBLE-WRAP", productName: "Protective Bubble Wrap (meters)", unit: "meters", availableStock: 0 },
    ];

    for (const def of standardDefaults) {
      const key = def.sku.toLowerCase();
      if (!consumableMap.has(key)) {
        consumableMap.set(key, def);
      }
    }

    return Array.from(consumableMap.values()).sort((a, b) => a.sku.localeCompare(b.sku));
  }

  public clearForTesting(): void {
    this.rules = [];
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
  }
}

export const consumableUsageRuleRepository = new ConsumableRulesRepository();
