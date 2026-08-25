import { db } from "@/lib/db";
import { Product, ProductStatus } from "@/lib/types/product";
import { inventoryRepository } from "@/lib/inventory/repository";
import { isConsumableCatalogItem } from "@/lib/catalog/item-classification";
import { locationStockRepository } from "@/lib/storage/engine/receiving.engine";

export interface ProductListOptions {
  organizationId?: string;
  workspaceId?: string;
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
  onlySellable?: boolean;
}

export function isConsumableItem(sku: string, name = ""): boolean {
  return isConsumableCatalogItem(sku, name);
}

class ProductRepository {
  // In-memory registered catalog products
  private memoryProducts: Map<string, Product> = new Map();

  public clearForTesting() {
    this.memoryProducts.clear();
  }

  /**
   * Purchase/receiving intent is the business classification source of truth.
   * Keys cover a product id, purchase line id (legacy line-* SKUs), and SKU.
   */
  private async getInventoryIntentByKey(workspaceId?: string): Promise<Map<string, string>> {
    const intents = new Map<string, string>();
    try {
      const lines = await db.purchaseBillLine.findMany({
        where: { workspaceId: workspaceId || "ws-default" },
        select: {
          id: true,
          sku: true,
          productId: true,
          intent: true,
          bill: { select: { purchaseType: true } },
        },
      });
      for (const line of lines) {
        const intent = line.intent === "sellable" && line.bill.purchaseType === "packaging_material"
          ? "consumable"
          : line.intent;
        for (const key of [line.id, line.sku, line.productId]) {
          if (key) intents.set(key.toLowerCase(), intent);
        }
      }
    } catch {
      // Legacy/local-only data falls back to the shared text classifier.
    }
    return intents;
  }

  /**
   * Discover and project sellable catalog items from live inventory
   */
  private async getInventoryDrivenProducts(options?: {
    organizationId?: string;
    workspaceId?: string;
    inventoryIntentByKey?: Map<string, string>;
  }): Promise<Product[]> {
    const discoveredMap = new Map<string, Product>();

    // Product Control Center is inventory-driven: products without available
    // physical inventory must never appear merely because master data exists.
    let inventoryBalances: any[] = [];
    try {
      inventoryBalances = await inventoryRepository.listBalances();
    } catch {
      inventoryBalances = [];
    }

    // Also include any receiving-engine location stock (populated in tests and
    // when the DB is not yet hydrated with purchase stock data).
    const locationBalances = locationStockRepository.getAllBalances().map((b) => ({
      productId: b.productId,
      sku: b.sku,
      productName: b.productName,
      intent: b.intent,
      available: b.availableQty,
      reserved: 0,
      incoming: 0,
      damaged: 0,
      inTransit: 0,
    }));

    // Merge: prefer inventoryRepository data but supplement with locationStock
    const seenSkus = new Set(inventoryBalances.map((b: any) => String(b.sku).toLowerCase()));
    for (const lb of locationBalances) {
      if (!seenSkus.has(lb.sku.toLowerCase())) {
        inventoryBalances.push(lb);
      }
    }

    const combinedBalances = [...inventoryBalances];

    for (const b of combinedBalances) {
      // Strictly ignore consumables and packaging supplies
      const intent = b.intent || options?.inventoryIntentByKey?.get(String(b.productId || b.sku).toLowerCase()) ||
        options?.inventoryIntentByKey?.get(String(b.sku).toLowerCase());
      if (b.available <= 0 || isConsumableCatalogItem(b.sku, b.productName, intent)) {
        continue;
      }

      const skuKey = b.sku.toLowerCase();
      const existing = discoveredMap.get(skuKey);

      if (existing) {
        existing.inventory.available = Math.max(existing.inventory.available, b.available || 0);
        existing.inventory.reserved += b.reserved || 0;
        existing.inventory.incoming += b.incoming || 0;
        existing.inventory.damaged += b.damaged || 0;
        existing.inventory.inTransit += b.inTransit || 0;
      } else {
        // Create inventory-driven product entry
        const cat =
          b.productName.toLowerCase().includes("shoe") || b.productName.toLowerCase().includes("sandal")
            ? "Footwear"
            : "Apparel";

        discoveredMap.set(skuKey, {
          id: b.productId || `prod-${b.sku}`,
          sku: b.sku,
          slug: b.sku.toLowerCase(),
          name: b.productName || b.sku,
          brand: "CommerceOS",
          category: cat,
          image: "/images/products/placeholder.jpg",
          gallery: [],
          status: "Active",
          pricing: {
            mrp: 1999,
            sellingPrice: 1499,
            costPrice: 650,
            profit: 849,
            margin: 57,
          },
          inventory: {
            available: b.available || 0,
            reserved: b.reserved || 0,
            incoming: b.incoming || 0,
            damaged: b.damaged || 0,
            inTransit: b.inTransit || 0,
          },
          performance: {
            ordersToday: 0,
            revenueToday: 0,
            returnsPercentage: 0,
            healthScore: 95,
          },
          aiRecommendations: [],
          listings: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return Array.from(discoveredMap.values());
  }

  async findAll(options?: ProductListOptions): Promise<Product[]> {
    let list: Product[] = [];
    const inventoryIntentByKey = await this.getInventoryIntentByKey(options?.workspaceId);

    // 1. Try PostgreSQL via Prisma if available
    try {
      const dbProducts = await db.product.findMany({
        where: {
          workspaceId: options?.workspaceId || undefined,
          status: options?.status || undefined,
          category: options?.category || undefined,
          brand: options?.brand || undefined,
          intent: "sellable",
        },
        include: {
          masterListing: {
            include: {
              attributes: true,
              marketplaceListings: true,
            },
          },
        },
      });

      if (dbProducts && dbProducts.length > 0) {
        list = dbProducts.map((p) => ({
          id: p.id,
          sku: p.sku,
          slug: p.slug || p.id,
          name: p.name,
          brand: p.brand || "CommerceOS",
          category: p.category,
          subCategory: p.subCategory || undefined,
          barcode: p.barcode || undefined,
          hsn: p.hsn || undefined,
          gstRate: Number(p.gstRate || 18),
          image: p.images?.[0] || "/images/products/placeholder.jpg",
          gallery: p.images || [],
          status: (p.status as ProductStatus) || "Active",
          pricing: {
            mrp: Number(p.mrp || 0),
            sellingPrice: Number(p.sellingPrice || 0),
            costPrice: Number(p.costPrice || 0),
            profit: Number(p.sellingPrice || 0) - Number(p.costPrice || 0),
            margin:
              Number(p.sellingPrice || 0) > 0
                ? Math.round(((Number(p.sellingPrice) - Number(p.costPrice)) / Number(p.sellingPrice)) * 100)
                : 0,
          },
          inventory: {
            available: 0,
            reserved: 0,
            incoming: 0,
            damaged: 0,
            inTransit: 0,
          },
          performance: {
            ordersToday: 0,
            revenueToday: 0,
            returnsPercentage: 0,
            healthScore: 90,
          },
          aiRecommendations: [],
          listings: (p.masterListing?.marketplaceListings || []).map((ml) => ({
            id: ml.id,
            marketplace: ml.marketplaceSku.toLowerCase().includes("amz") ? "amazon" : "flipkart",
            title: ml.title || p.name,
            marketplaceSku: ml.marketplaceSku,
            listingIdLabel: "SKU",
            listingId: ml.externalListingId || ml.marketplaceSku,
            sellingPrice: Number(ml.sellingPrice),
            availableStock: 0,
            orders30Days: 0,
            revenue30Days: 0,
            status: ml.listingStatus as any,
            listingStatus: (ml.listingStatus as any) || "Live",
            stockSync: ml.stockSync,
            lastSync: ml.lastSyncedAt?.toISOString() || new Date().toISOString(),
            healthScore: 90,
          })),
          createdAt: p.createdAt.toISOString(),
          updatedAt: p.updatedAt.toISOString(),
        }));
      }
    } catch {
      // Fallback to inventory-driven discovery
    }

    if (list.length === 0) {
      list = await this.getInventoryDrivenProducts({
        organizationId: options?.organizationId,
        workspaceId: options?.workspaceId,
        inventoryIntentByKey,
      });
    } else {
      // Hydrate DB products with live Inventory balances
      try {
        const inventoryBalances = await inventoryRepository.listBalances({
          organizationId: options?.organizationId,
          workspaceId: options?.workspaceId,
        });

        for (const p of list) {
          const skuLower = p.sku.toLowerCase().trim();
          const invMatch = inventoryBalances.find((b) => b.sku.toLowerCase().trim() === skuLower);

          if (invMatch) {
            p.inventory.available = invMatch.available || 0;
            p.inventory.reserved = invMatch.reserved || 0;
            p.inventory.incoming = invMatch.incoming || 0;
            p.inventory.damaged = invMatch.damaged || 0;
            p.inventory.inTransit = invMatch.inTransit || 0;
          }
        }
      } catch {
        // Continue with current inventory
      }
    }


    // The Products page is a live projection of available inventory, not a
    // master-data directory. Keep packaging/consumables out of this tab.
    list = list.filter(
      (p) =>
        p.inventory.available > 0 &&
        !isConsumableCatalogItem(
          p.sku,
          p.name,
          inventoryIntentByKey.get(p.id.toLowerCase()) || inventoryIntentByKey.get(p.sku.toLowerCase()),
        ),
    );

    // 3. Search and text filters
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.barcode && p.barcode.toLowerCase().includes(q))
      );
    }

    if (options?.category) {
      const cat = options.category.toLowerCase().trim();
      list = list.filter((p) => p.category.toLowerCase() === cat);
    }

    if (options?.brand) {
      const b = options.brand.toLowerCase().trim();
      list = list.filter((p) => p.brand.toLowerCase() === b);
    }

    return list;
  }

  async findById(
    id: string,
    options?: { organizationId?: string; workspaceId?: string }
  ): Promise<Product | undefined> {
    const list = await this.findAll(options);
    return list.find((p) => p.id === id || p.slug === id);
  }

  async findBySku(
    sku: string,
    options?: { organizationId?: string; workspaceId?: string }
  ): Promise<Product | undefined> {
    const list = await this.findAll(options);
    const s = sku.toLowerCase().trim();
    return list.find((p) => p.sku.toLowerCase().trim() === s);
  }

  async create(
    product: Product,
    options?: { organizationId?: string; workspaceId?: string }
  ): Promise<Product> {
    // Reject consumable items from being created as sellable catalog products
    if (isConsumableItem(product.sku, product.name)) {
      throw new Error(`Cannot create sellable product for consumable SKU: ${product.sku}`);
    }

    const fullProduct: Product = {
      ...product,
      performance: product.performance || {
        ordersToday: 0,
        revenueToday: 0,
        returnsPercentage: 0,
        healthScore: 90,
      },
      aiRecommendations: product.aiRecommendations || [],
      listings: product.listings || [],
      createdAt: product.createdAt || new Date().toISOString(),
      updatedAt: product.updatedAt || new Date().toISOString(),
    };

    try {
      await db.product.create({
        data: {
          id: fullProduct.id,
          workspaceId: options?.workspaceId || "ws-default",
          sku: fullProduct.sku,
          slug: fullProduct.slug || fullProduct.id,
          name: fullProduct.name,
          brand: fullProduct.brand,
          category: fullProduct.category,
          subCategory: fullProduct.subCategory,
          barcode: fullProduct.barcode,
          hsn: fullProduct.hsn,
          gstRate: fullProduct.gstRate || 18,
          sellingPrice: fullProduct.pricing?.sellingPrice || 0,
          costPrice: fullProduct.pricing?.costPrice || 0,
          mrp: fullProduct.pricing?.mrp || 0,
          status: fullProduct.status || "Active",
          images: fullProduct.gallery && fullProduct.gallery.length > 0 ? fullProduct.gallery : [fullProduct.image],
        },
      });
    } catch {
      // Memory fallback
    }

    this.memoryProducts.set(fullProduct.id, structuredClone(fullProduct));
    return fullProduct;
  }

  async update(
    id: string,
    updates: Partial<Product>,
    options?: { organizationId?: string; workspaceId?: string }
  ): Promise<Product | undefined> {
    try {
      await db.product.update({
        where: { id },
        data: {
          name: updates.name,
          brand: updates.brand,
          category: updates.category,
          subCategory: updates.subCategory,
          barcode: updates.barcode,
          hsn: updates.hsn,
          status: updates.status,
          sellingPrice: updates.pricing?.sellingPrice,
          costPrice: updates.pricing?.costPrice,
          mrp: updates.pricing?.mrp,
        },
      });
    } catch {
      // Memory fallback
    }

    const existing = this.memoryProducts.get(id);
    if (existing) {
      const merged = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      this.memoryProducts.set(id, merged);
      return merged;
    }

    return undefined;
  }
}

export const productRepository = new ProductRepository();
