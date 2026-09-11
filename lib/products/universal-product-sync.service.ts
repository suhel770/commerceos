/**
 * CommerceOS V4 — Universal Product Metadata & SKU Sync Service
 *
 * Authoritative Single Source of Truth (SSOT) orchestrator for SKU metadata.
 * Ensures that whenever a product name, intent, or metadata is updated in ANY module
 * (Purchase Bill, Receiving / GRN, Inventory, Catalog), it immediately and atomicaly
 * propagates to:
 *   1. Product (Master Catalog)
 *   2. StorageStock (Physical Inventory records across all warehouse locations)
 *   3. StorageReceiptLine (All GRN / Goods Received lines)
 *   4. PurchaseBillLine (All Purchase Bill lines for this SKU)
 */

import { db } from "@/lib/db";
import { generateNextUniversalProductId } from "@/lib/products/product-id-generator";
import { getProductSlug } from "@/lib/products/slug";

export interface SkuMetadataSyncInput {
  workspaceId: string;
  organizationId?: string;
  sku: string;
  name: string;
  intent?: "sellable" | "consumable" | "asset" | string;
  costPrice?: number;
  hsn?: string | null;
  gstRate?: number;
  brand?: string;
  category?: string;
}

export class UniversalProductSyncService {
  /**
   * Synchronizes SKU metadata across all domains in CommerceOS.
   * Can be executed directly or passed an existing Prisma transaction client (`tx`).
   */
  public async syncSkuMetadata(
    client: any,
    input: SkuMetadataSyncInput
  ): Promise<{ productId: string; sku: string; name: string }> {
    const tx = client || db;
    const { workspaceId, sku } = input;
    const cleanSku = (sku || "").trim();
    const cleanName = (input.name || "").trim() || cleanSku;

    if (!cleanSku) {
      throw new Error("SKU is required for Universal Product Sync.");
    }

    // ── 1. Lookup or Upsert Master Product (Canonical Single Source of Truth) ──
    let product = await tx.product.findFirst({
      where: {
        workspaceId,
        sku: { equals: cleanSku, mode: "insensitive" },
      },
    });

    const intent = input.intent || "sellable";
    const productType = intent === "consumable" ? "CONSUMABLE" : "SELLABLE";

    if (product) {
      const slug = getProductSlug({ id: product.id, name: cleanName, sku: cleanSku });
      const updateData: Record<string, any> = {
        name: cleanName,
        slug,
        updatedAt: new Date(),
      };
      if (input.intent) {
        updateData.intent = intent;
        updateData.productType = productType;
      }
      if (input.costPrice !== undefined && input.costPrice > 0) {
        updateData.costPrice = input.costPrice;
      }
      if (input.hsn !== undefined) {
        updateData.hsn = input.hsn;
      }
      if (input.gstRate !== undefined) {
        updateData.gstRate = input.gstRate;
      }

      product = await tx.product.update({
        where: { id: product.id },
        data: updateData,
      });
    } else {
      // Auto-provision fresh Canonical Master Product with unique PRD- ID
      const newPrdId = await generateNextUniversalProductId(productType, workspaceId, tx);
      const newUuid = crypto.randomUUID();
      const slug = getProductSlug({ id: newUuid, name: cleanName, sku: cleanSku });

      product = await tx.product.create({
        data: {
          id: newUuid,
          productId: newPrdId,
          productType,
          workspaceId,
          sku: cleanSku,
          slug,
          name: cleanName,
          brand: input.brand || "CommerceOS",
          category: input.category || (intent === "consumable" ? "Packaging Supplies" : "General"),
          hsn: input.hsn || null,
          gstRate: input.gstRate || 18,
          costPrice: input.costPrice || 0,
          sellingPrice: 0,
          mrp: 0,
          status: "Active",
          images: ["/images/products/placeholder.jpg"],
          intent,
        },
      });
    }

    const resolvedProductId = product.id;

    // ── 2. Atomically synchronize physical StorageStock across all locations ──
    await tx.storageStock.updateMany({
      where: {
        workspaceId,
        sku: { equals: cleanSku, mode: "insensitive" },
      },
      data: {
        productName: cleanName,
        productId: resolvedProductId,
        ...(input.intent ? { intent } : {}),
      },
    });

    // ── 3. Atomically synchronize Goods Received Note (GRN) receipt lines ──────
    await tx.storageReceiptLine.updateMany({
      where: {
        workspaceId,
        sku: { equals: cleanSku, mode: "insensitive" },
      },
      data: {
        description: cleanName,
        productId: resolvedProductId,
      },
    });

    // ── 4. Atomically synchronize all PurchaseBillLines for this SKU ─────────
    await tx.purchaseBillLine.updateMany({
      where: {
        workspaceId,
        sku: { equals: cleanSku, mode: "insensitive" },
      },
      data: {
        description: cleanName,
        productId: resolvedProductId,
      },
    });

    return {
      productId: resolvedProductId,
      sku: cleanSku,
      name: cleanName,
    };
  }

  /**
   * Batch sync for multiple lines/items in a single workspace.
   */
  public async syncBatch(
    client: any,
    workspaceId: string,
    items: Array<Omit<SkuMetadataSyncInput, "workspaceId">>
  ): Promise<void> {
    for (const item of items) {
      if (item.sku) {
        await this.syncSkuMetadata(client, { ...item, workspaceId });
      }
    }
  }
}

export const universalProductSyncService = new UniversalProductSyncService();
