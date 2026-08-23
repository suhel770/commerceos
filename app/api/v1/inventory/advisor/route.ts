import {
  errorResponse,
  requestContext,
  successResponse,
} from "@/lib/api/route-response";
import { hasAiCredits, consumeAiCredit, getAiCreditsRemaining } from "@/lib/ai/credits";
import { inventoryService } from "@/lib/inventory/service";
import { inventoryAdvisorEngine } from "@/lib/inventory/inventory-advisor-engine";
import { locationStockRepository } from "@/lib/storage/engine/receiving.engine";

export async function GET(request: Request) {
  const context = requestContext(request);

  try {
    const creditsRemaining = getAiCreditsRemaining();
    const canUseAi = hasAiCredits(1);

    // Graceful degradation when AI credits are 0
    if (!canUseAi) {
      return successResponse(context, {
        status: "CREDITS_EXHAUSTED",
        message: "AI insights temporarily unavailable. Inventory operations continue normally.",
        creditsRemaining: 0,
        recommendations: [],
      });
    }

    // Fetch real balances and storage records
    const balances = await inventoryService.listBalances({
      organizationId: context.organizationId,
      workspaceId: context.workspaceId,
    });

    let storageLocations: Array<{ storageLocationId: string; locationName?: string; sku: string; availableQty: number }> = [];
    try {
      const storageRecords = locationStockRepository.getAllBalances();
      storageLocations = storageRecords.map((s) => ({
        storageLocationId: s.storageLocationId,
        locationName: s.storageLocationId,
        sku: s.sku,
        availableQty: s.availableQty,
      }));
    } catch {}

    const recommendations = inventoryAdvisorEngine.generateRecommendations({
      balances,
      storageLocations,
      connectedMarketplaces: [
        { channel: "Amazon SP-API", connected: false },
        { channel: "Flipkart FBF", connected: false },
        { channel: "Shopify Store", connected: false },
      ],
    });

    // Consume 1 AI credit for generating the advisor report
    consumeAiCredit(1);

    return successResponse(context, {
      status: "ACTIVE",
      creditsRemaining: getAiCreditsRemaining(),
      recommendations,
    });
  } catch (error) {
    return errorResponse(context, error);
  }
}
