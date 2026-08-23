import { db } from "@/lib/db";
import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { type InventoryType, type UsageType } from "@/lib/inventory/consumption-ledger";

export async function GET(request: Request) {
  const context = requestContext(request);

  try {
    const { searchParams } = new URL(request.url);
    const sku = searchParams.get("sku") || undefined;
    const inventoryType = (searchParams.get("inventoryType") as InventoryType) || undefined;
    const search = searchParams.get("search") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const where: any = {
      workspaceId: context.workspaceId,
      type: { in: ["Consumption", "Reversal"] },
    };

    if (sku) {
      where.sku = sku;
    }
    if (inventoryType) {
      where.intent = inventoryType.toLowerCase() === "consumable" ? "consumable" : "sellable";
    }
    if (search) {
      where.OR = [
        { sku: { contains: search, mode: "insensitive" } },
        { reason: { contains: search, mode: "insensitive" } },
        { reference: { contains: search, mode: "insensitive" } },
      ];
    }

    const totalCount = await db.inventoryMovement.count({ where });
    const movements = await db.inventoryMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const records = movements.map((m) => {
      const isReversal = m.type === "Reversal";
      return {
        id: m.id,
        organizationId: m.organizationId,
        workspaceId: m.workspaceId,
        sku: m.sku,
        productName: m.sku,
        inventoryType: m.intent === "consumable" ? "CONSUMABLE" : "SELLABLE",
        quantity: Math.abs(m.quantity),
        unit: "pcs",
        usageType: isReversal ? "REVERSAL" : "MANUAL_CONSUMPTION",
        reason: m.reason || "",
        reference: m.reference || "",
        actorName: m.actorName || "System",
        occurredAt: m.createdAt.toISOString(),
        beforeQuantity: 0,
        afterQuantity: 0,
        isReversal,
        createdAt: m.createdAt.toISOString(),
      };
    });

    let skuSummary = undefined;
    if (sku) {
      const aggregateUsed = await db.inventoryMovement.aggregate({
        where: {
          workspaceId: context.workspaceId,
          sku,
          type: "Consumption",
        },
        _sum: { quantity: true }
      });
      skuSummary = {
        sku,
        totalConsumed: Math.abs(aggregateUsed._sum.quantity || 0),
        totalReversed: 0,
        activeRulesCount: 0,
      };
    }

    const aggregateNetworkUsed = await db.inventoryMovement.aggregate({
      where: {
        workspaceId: context.workspaceId,
        type: "Consumption",
      },
      _sum: { quantity: true }
    });

    return successResponse(context, {
      records,
      totalCount,
      page,
      limit,
      skuSummary,
      totalNetworkConsumed: Math.abs(aggregateNetworkUsed._sum.quantity || 0),
    });
  } catch (error) {
    return errorResponse(context, error);
  }
}
