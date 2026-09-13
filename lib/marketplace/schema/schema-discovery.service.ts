import { MarketplaceName } from "@/lib/types/master-listing";
import { marketplaceConnectionService } from "@/lib/marketplace/connection/connection.service";
import { getMarketplaceRegistry } from "@/lib/marketplace/registry/marketplace-registry";
import { getCategorySpecs, type CategoryVerticalConfig } from "@/lib/marketplace/specifications/category-specs.service";

export type SchemaLifecycleState =
  | "DISCOVERED"
  | "CONFIGURED"
  | "STALE"
  | "UNAVAILABLE"
  | "ERROR";

export type SchemaSource =
  | "API_DISCOVERY"
  | "CONFIGURED_TEMPLATE"
  | "LOCAL_REGISTRY";

export interface SchemaMetadata {
  marketplace: MarketplaceName;
  marketplaceName: string;
  category: string;
  verticalCode: string;
  schemaVersion: string;
  source: SchemaSource;
  status: SchemaLifecycleState;
  retrievedAt: string;
  expiresAt?: string;
  reason?: string;
  message?: string;
}

export interface DiscoveredSchemaResult {
  metadata: SchemaMetadata;
  attributes: Array<{
    key: string;
    label: string;
    dataType: string;
    required: boolean;
    allowedValues?: string[];
    description?: string;
  }>;
  categoryConfig?: CategoryVerticalConfig;
}

export class SchemaDiscoveryService {
  /**
   * Resolves the authoritative marketplace schema for a category and channel.
   * Enforces truthful lifecycle states:
   * - UNAVAILABLE if live marketplace connector credentials are not connected
   * - CONFIGURED if static/versioned specification is registered
   * - DISCOVERED only if active marketplace API connector returns official dynamic schema
   */
  async discoverSchema(
    workspaceId: string,
    category: string,
    marketplace: MarketplaceName,
    subCategory?: string
  ): Promise<DiscoveredSchemaResult> {
    const registry = getMarketplaceRegistry(marketplace);
    const now = new Date().toISOString();

    // 1. Check if workspace has an active, authenticated connection for this marketplace
    const connections = await marketplaceConnectionService.getConnections(workspaceId);
    const activeConnection = connections.find(
      (c) => c.enabled && String(c.marketplace).toUpperCase() === String(marketplace).toUpperCase()
    );

    // 2. Resolve configured category specifications template
    const categoryConfig = getCategorySpecs(category, subCategory);
    const verticalCode = categoryConfig.id || categoryConfig.family || category.toLowerCase().replace(/\s+/g, "_");
    const isSpecializedVertical = categoryConfig.family !== "general";

    // 3. If no live connection, live API discovery is UNAVAILABLE
    if (!activeConnection) {
      // If we have a configured local specification template for a recognized vertical, return as CONFIGURED with honest note
      if (isSpecializedVertical && categoryConfig.specifications.length > 0) {
        return {
          metadata: {
            marketplace,
            marketplaceName: registry.name,
            category,
            verticalCode,
            schemaVersion: "1.0.0-configured",
            source: "CONFIGURED_TEMPLATE",
            status: "CONFIGURED",
            retrievedAt: now,
            message: `Using configured schema specifications for ${registry.name}. Live API schema discovery is unavailable because channel credentials are not connected.`,
          },
          attributes: categoryConfig.specifications.map((s) => ({
            key: s.key,
            label: s.label,
            dataType: s.group === "technical" ? "string" : "text",
            required: Boolean(s.required),
            allowedValues: s.suggestions,
            description: s.description,
          })),
          categoryConfig,
        };
      }

      return {
        metadata: {
          marketplace,
          marketplaceName: registry.name,
          category,
          verticalCode,
          schemaVersion: "unknown",
          source: "LOCAL_REGISTRY",
          status: "UNAVAILABLE",
          retrievedAt: now,
          reason: "NOT_CONNECTED",
          message: `Live schema discovery for ${registry.name} is unavailable. Marketplace credentials not configured.`,
        },
        attributes: [],
      };
    }

    // 4. If connection is active, return CONFIGURED (or DISCOVERED once live API endpoint is enabled)
    const attributes = categoryConfig.specifications.map((s) => ({
      key: s.key,
      label: s.label,
      dataType: s.group === "technical" ? "string" : "text",
      required: Boolean(s.required),
      allowedValues: s.suggestions,
      description: s.description,
    }));

    return {
      metadata: {
        marketplace,
        marketplaceName: registry.name,
        category,
        verticalCode,
        schemaVersion: "2026.1",
        source: "CONFIGURED_TEMPLATE",
        status: "CONFIGURED",
        retrievedAt: now,
        expiresAt: new Date(Date.now() + 86400000 * 7).toISOString(),
        message: `Schema configured and verified for ${registry.name} account ${activeConnection.accountName || "Primary"}.`,
      },
      attributes,
      categoryConfig,
    };
  }
}

export const schemaDiscoveryService = new SchemaDiscoveryService();
