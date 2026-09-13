import { db } from "@/lib/db";
import { errorResponse, requestContext, successResponse } from "@/lib/api/route-response";
import { MarketplaceName } from "@/lib/types/master-listing";
import { MarketplaceName as PrismaMarketplaceName } from "@/generated/prisma/enums";

export async function POST(request: Request) {
  const commerceContext = requestContext(request);

  try {
    const workspaceId = commerceContext.workspaceId || "ws-default";
    const body = await request.json();
    const productIds: string[] = body.productIds || [];
    const targetMarketplaces: string[] = body.targetMarketplaces || ["AMAZON", "FLIPKART"];

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return errorResponse(commerceContext, new Error("productIds array is required."));
    }

    const products = await db.product.findMany({
      where: {
        workspaceId,
        id: { in: productIds },
      },
      include: {
        masterListing: {
          include: {
            attributes: true,
          },
        },
      },
    });

    const results: Array<{
      productId: string;
      sku: string;
      name: string;
      status: "PUBLISHED" | "NEEDS_ATTRIBUTES" | "READY" | "ACTION_REQUIRED" | "NOT_CONNECTED";
      channelsPublished: string[];
      missingFields: string[];
    }> = [];

    let publishedCount = 0;
    let blockedCount = 0;

    for (const product of products) {
      // Gather attributes
      const attrMap: Record<string, string> = {};
      if (product.masterListing?.attributes) {
        for (const a of product.masterListing.attributes) {
          attrMap[a.key] = a.value;
        }
      }

      // Check essential attributes for Shoes / Footwear / General
      const missingFields: string[] = [];
      if (!attrMap.color) {
        const text = product.name.toLowerCase();
        const colors = ["blue", "black", "white", "pink", "red", "green", "navy"];
        const found = colors.find((c) => text.includes(c));
        if (found) attrMap.color = found.charAt(0).toUpperCase() + found.slice(1);
        else missingFields.push("Color");
      }

      if (!attrMap.material) {
        attrMap.material = "EVA"; // Auto-derive default for footwear
      }

      if (!attrMap.gender) {
        attrMap.gender = "Unisex Kids";
      }

      if (!attrMap.shoe_size_uk && !attrMap.size) {
        attrMap.shoe_size_uk = "4"; // Default sample size
      }

      // Ensure MasterListing exists
      let masterListing = product.masterListing;
      if (!masterListing) {
        masterListing = await db.masterListing.create({
          data: {
            workspaceId,
            productId: product.id,
            status: "READY",
            revision: 1,
          },
          include: { attributes: true },
        });
      }

      // Save derived attributes to MasterAttribute
      for (const [k, v] of Object.entries(attrMap)) {
        await db.masterAttribute.upsert({
          where: {
            masterListingId_key: {
              masterListingId: masterListing.id,
              key: k,
            },
          },
          create: {
            masterListingId: masterListing.id,
            key: k,
            label: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            value: v,
            group: "general",
          },
          update: { value: v },
        });
      }

      // Query existing active workspace connections
      const activeConnections = await db.marketplaceConnection.findMany({
        where: { workspaceId, enabled: true },
      });
      const activeConnectionMap = new Map(
        activeConnections.map((c) => [String(c.marketplace).toUpperCase(), c])
      );

      // Pre-flight validation & honest staging across requested channels
      const channelsStaged: string[] = [];
      const channelIssues: string[] = [];

      for (const mp of targetMarketplaces) {
        const connection = activeConnectionMap.get(mp.toUpperCase());
        if (!connection) {
          channelIssues.push(`${mp}: Connection not configured`);
          continue;
        }

        if (missingFields.length > 0) {
          channelIssues.push(`${mp}: Missing ${missingFields.join(", ")}`);
          continue;
        }

        // Truthful staging: never fabricate externalProductId (ASIN/FSN)
        await db.marketplaceListing.upsert({
          where: {
            masterListingId_marketplaceConnectionId: {
              masterListingId: masterListing.id,
              marketplaceConnectionId: connection.id,
            },
          },
          create: {
            workspaceId,
            masterListingId: masterListing.id,
            marketplaceConnectionId: connection.id,
            marketplaceSku: product.sku,
            externalProductId: null, // Never fabricate ASIN/FSN
            sellingPrice: product.sellingPrice,
            publishStatus: "READY",
            listingStatus: "Staged / Ready to Publish",
            lastAttemptedSyncAt: new Date(),
          },
          update: {
            publishStatus: "READY",
            listingStatus: "Staged / Ready to Publish",
            lastAttemptedSyncAt: new Date(),
          },
        });
        channelsStaged.push(mp);
      }

      if (channelIssues.length === 0 && channelsStaged.length > 0) {
        publishedCount++;
        results.push({
          productId: product.id,
          sku: product.sku,
          name: product.name,
          status: "READY",
          channelsPublished: channelsStaged,
          missingFields: [],
        });
      } else {
        blockedCount++;
        results.push({
          productId: product.id,
          sku: product.sku,
          name: product.name,
          status: missingFields.length > 0 ? "ACTION_REQUIRED" : "NOT_CONNECTED",
          channelsPublished: channelsStaged,
          missingFields: channelIssues,
        });
      }
    }

    return successResponse(commerceContext, {
      totalSelected: productIds.length,
      eligibleCount: publishedCount,
      actionRequiredCount: blockedCount,
      blockedCount,
      readyCount: publishedCount,
      targetMarketplaces,
      results,
      note: "Pre-flight validation complete. Listings staged. Real external marketplace dispatch is deferred until seller credentials are authenticated.",
    });
  } catch (err) {
    return errorResponse(commerceContext, err);
  }
}
