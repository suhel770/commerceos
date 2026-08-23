import { db } from "@/lib/db";
import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { inventoryApplication } from "@/lib/application/inventory.application";
import { channelAllocationEngine } from "@/lib/inventory/channel-allocation.engine";
import type { ChannelAllocationRule } from "@/lib/inventory/types";

export async function GET(request: Request) {
  const context = requestContext(request);

  try {
    const url = new URL(request.url);
    const productId = url.searchParams.get("productId") || url.searchParams.get("sku");
    const mode = (url.searchParams.get("mode") || "small") as "small" | "growing" | "enterprise";

    if (!productId) {
      return errorResponse(context, new Error("productId or sku query parameter is required."));
    }

    const data = await inventoryApplication.channelAllocations(context, productId, mode);
    return successResponse(context, data);
  } catch (error) {
    return errorResponse(context, error);
  }
}

export async function POST(request: Request) {
  const context = requestContext(request);

  try {
    const body = await request.json();
    const sku = body.sku || body.productId;
    const rules: ChannelAllocationRule[] = Array.isArray(body.rules) ? body.rules : [];
    const mode = body.mode || "growing";
    const totalAts = typeof body.totalAts === "number" ? body.totalAts : 0;

    if (!sku) {
      return errorResponse(context, new Error("sku or productId is required."));
    }

    const result = channelAllocationEngine.validateAndSaveRules({
      sku,
      totalAts,
      rules,
      mode,
      actorId: context.actor?.id ?? "usr-current",
      actorName: "CommerceOS User",
    });

    if (!result.success) {
      return errorResponse(context, new Error(result.error || "Channel allocation validation failed."));
    }

    try {
      await db.channelAllocationRule.deleteMany({
        where: {
          workspaceId: context.workspaceId,
          sku: { equals: sku, mode: "insensitive" },
        },
      });

      for (const rule of rules) {
        await db.channelAllocationRule.create({
          data: {
            workspaceId: context.workspaceId,
            sku: sku.toLowerCase().trim(),
            channel: rule.channel,
            allocationPercent: rule.percentage || null,
            fixedCap: rule.fixedCap || null,
            priority: rule.priority || null,
            safetyBuffer: rule.safetyBuffer || null,
            active: rule.active,
          },
        });
      }
    } catch (err) {
      console.warn("Failed to persist channel allocation rules to DB:", err);
    }

    return successResponse(context, {
      message: "Channel allocation saved successfully.",
      sku,
      unallocated: result.unallocated,
      totalAllocated: result.totalAllocated,
      event: result.event,
    });
  } catch (error) {
    return errorResponse(context, error);
  }
}
