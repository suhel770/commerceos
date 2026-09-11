import { NextResponse } from "next/server";
import { ConsumableService } from "@/lib/consumables/consumable.service";
import { businessProfileRepository } from "@/lib/business-profile/repository";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const profile = businessProfileRepository.get();
    if (profile.trackConsumables === false) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;

    const items = await ConsumableService.getConsumables({ search, status });

    return NextResponse.json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch consumables",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const profile = businessProfileRepository.get();
    if (profile.trackConsumables === false) {
      return NextResponse.json(
        { success: false, error: "Consumables tracking is disabled for this workspace." },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { sku, name, category, available, unitCost, unit, reorderPoint } = body;

    if (!sku || !name) {
      return NextResponse.json(
        { success: false, error: "SKU and Name are required" },
        { status: 400 }
      );
    }

    const orgId = "org-commerceos";
    const wsId = "ws-default";

    // Check if product SKU already exists
    const existing = await db.product.findFirst({
      where: { workspaceId: wsId, sku: { equals: sku, mode: "insensitive" } }
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: `SKU ${sku} already exists` },
        { status: 400 }
      );
    }

    const productId = `prod-${Date.now()}`;

    // 1. Create the product
    await db.product.create({
      data: {
        id: productId,
        workspaceId: wsId,
        sku,
        slug: productId,
        name,
        category: category || "Packaging Supplies",
        intent: "consumable",
        sellingPrice: 0,
        costPrice: Number(unitCost) || 0,
        mrp: Number(unitCost) || 0,
        status: "Active",
      }
    });

    // 2. Fetch the default primary storage location
    const primaryLoc = await db.storageLocation.findFirst({
      where: { workspaceId: wsId, isDefault: true }
    });
    const storageLocationId = primaryLoc?.id || "loc-hom-901190";

    // 3. Create StorageStock record
    const qty = parseInt(available) || 0;
    await db.storageStock.create({
      data: {
        organizationId: orgId,
        workspaceId: wsId,
        storageLocationId,
        productId,
        sku,
        productName: name,
        availableQty: qty,
        reservedQty: 0,
        damagedQty: 0,
        intent: "consumable",
      }
    });

    // 4. Create InventoryMovement record for audit timeline
    if (qty > 0) {
      await db.inventoryMovement.create({
        data: {
          organizationId: orgId,
          workspaceId: wsId,
          sku,
          productId,
          storageLocationId,
          quantity: qty,
          direction: "IN",
          type: "Inwarding",
          reason: "Initial Seeding",
          actorName: "System",
          intent: "consumable",
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: productId,
        sku,
        name,
        available: qty,
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create consumable" },
      { status: 500 }
    );
  }
}
