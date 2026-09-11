import crypto from "crypto";
import { db } from "@/lib/db";
import type { MarketplaceName } from "@/lib/types/master-listing";

const ENCRYPTION_KEY = process.env.MARKETPLACE_SECRET_KEY || "commerceos-marketplace-vault-key-32b";
const ALGORITHM = "aes-256-gcm";

export interface MarketplaceConnectionSummary {
  id: string;
  marketplace: MarketplaceName;
  accountName?: string;
  sellerId?: string;
  region: string;
  enabled: boolean;
  healthStatus: "HEALTHY" | "WARNING" | "DISCONNECTED" | "DEGRADED";
  lastHealthCheckAt?: string;
  hasCredentials: boolean;
  createdAt: string;
}

export interface ConnectionCredentials {
  apiKey?: string;
  apiSecret?: string;
  accessToken?: string;
  refreshToken?: string;
  merchantId?: string;
  appId?: string;
}

export class MarketplaceConnectionService {
  /**
   * Encrypts connection secrets with AES-256-GCM before saving to DB.
   */
  private encrypt(credentials: ConnectionCredentials): string {
    const iv = crypto.randomBytes(12);
    const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    const json = JSON.stringify(credentials);
    let encrypted = cipher.update(json, "utf8", "hex");
    encrypted += cipher.final("hex");
    const tag = cipher.getAuthTag();

    return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`;
  }

  /**
   * Decrypts connection secrets securely on server-side only.
   */
  private decrypt(encryptedPayload: string): ConnectionCredentials {
    try {
      const parts = encryptedPayload.split(":");
      if (parts.length !== 3) return {};

      const iv = Buffer.from(parts[0], "hex");
      const tag = Buffer.from(parts[1], "hex");
      const encryptedText = parts[2];

      const key = crypto.createHash("sha256").update(ENCRYPTION_KEY).digest();
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(tag);

      let decrypted = decipher.update(encryptedText, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return JSON.parse(decrypted);
    } catch (err) {
      return {};
    }
  }

  /**
   * Lists all active connections for a workspace (secrets masked/sanitized).
   */
  async getConnections(workspaceId: string): Promise<MarketplaceConnectionSummary[]> {
    try {
      const records = await (db as any).marketplaceConnection?.findMany({
        where: { workspaceId },
        orderBy: { createdAt: "desc" },
      }).catch(() => []);

      if (!records || !Array.isArray(records)) {
        return [];
      }

      return records.map((r: any) => ({
        id: r.id,
        marketplace: r.marketplace,
        accountName: r.accountName || undefined,
        sellerId: r.sellerId || undefined,
        region: r.region || "IN",
        enabled: r.enabled ?? true,
        healthStatus: (r.healthStatus as any) || "HEALTHY",
        lastHealthCheckAt: r.lastHealthCheckAt ? (r.lastHealthCheckAt instanceof Date ? r.lastHealthCheckAt.toISOString() : String(r.lastHealthCheckAt)) : undefined,
        hasCredentials: Boolean(r.encryptedCredentials),
        createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt || new Date().toISOString()),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Saves or updates a marketplace connection with AES encrypted credentials.
   */
  async saveConnection(
    workspaceId: string,
    marketplace: MarketplaceName,
    data: {
      sellerId?: string;
      accountName?: string;
      region?: string;
      credentials?: ConnectionCredentials;
      enabled?: boolean;
    },
  ): Promise<string> {
    const encryptedCredentials = data.credentials
      ? this.encrypt(data.credentials)
      : undefined;

    const connection = await (db as any).marketplaceConnection.upsert({
      where: {
        workspaceId_marketplace_sellerId: {
          workspaceId,
          marketplace,
          sellerId: data.sellerId || "default",
        },
      },
      create: {
        workspaceId,
        marketplace,
        sellerId: data.sellerId || "default",
        accountName: data.accountName,
        region: data.region || "IN",
        enabled: data.enabled ?? true,
        healthStatus: "HEALTHY",
        encryptedCredentials,
      },
      update: {
        accountName: data.accountName,
        region: data.region || "IN",
        enabled: data.enabled ?? true,
        healthStatus: "HEALTHY",
        ...(encryptedCredentials ? { encryptedCredentials } : {}),
      },
    });

    return connection.id;
  }

  /**
   * Retrieves decrypted credentials for server-side API execution only.
   */
  async getDecryptedCredentials(
    workspaceId: string,
    marketplace: MarketplaceName,
    sellerId?: string,
  ): Promise<ConnectionCredentials | null> {
    const record = await (db as any).marketplaceConnection.findFirst({
      where: {
        workspaceId,
        marketplace,
        sellerId: sellerId || undefined,
        enabled: true,
      },
    });

    if (!record || !record.encryptedCredentials) {
      return null;
    }

    return this.decrypt(record.encryptedCredentials);
  }
}

export const marketplaceConnectionService = new MarketplaceConnectionService();
