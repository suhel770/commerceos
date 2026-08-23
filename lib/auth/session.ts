import crypto from "crypto";
import { db } from "@/lib/db";
import { CommerceRole } from "@prisma/generated/prisma";

const SESSION_SECRET = process.env.SESSION_SECRET || "commerceos_default_secure_session_secret_2026_key";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: string;
  organizationId: string;
  workspaceId: string;
  expiresAt: string;
}

/**
 * Creates a cryptographically signed session token string.
 */
export function signSession(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(data)
    .digest("hex");
  return `${data}.${signature}`;
}

/**
 * Verifies a signed session token. Returns parsed payload on success, null on failure/expiry.
 */
export function verifySession(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [data, signature] = parts;
    const expectedSig = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(data)
      .digest("hex");
    if (signature !== expectedSig) return null;

    const payload = JSON.parse(Buffer.from(data, "base64").toString("utf-8")) as SessionPayload;
    if (new Date(payload.expiresAt) < new Date()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Ensures baseline organization, default workspace, and demo users with RBAC exist in the DB.
 */
export async function ensureDemoUsersExist(): Promise<void> {
  const orgId = "org-commerceos";
  const wsId = "ws-default";

  try {
    // Ensure default organization exists
    let org = await db.organization.findUnique({ where: { id: orgId } });
    if (!org) {
      org = await db.organization.create({
        data: {
          id: orgId,
          name: "CommerceOS Org",
          slug: "org-org-commerceos",
        },
      });
    }

    // Ensure default workspace exists
    let ws = await db.workspace.findUnique({ where: { id: wsId } });
    if (!ws) {
      ws = await db.workspace.create({
        data: {
          id: wsId,
          organizationId: orgId,
          name: "Default Workspace",
          code: "ws-default",
        },
      });
    }

    const demoUsers = [
      {
        email: "owner@demo.local",
        name: "Owner",
        role: "OWNER" as CommerceRole,
      },
      {
        email: "ops@demo.local",
        name: "Ops User",
        role: "WAREHOUSE_MANAGER" as CommerceRole,
      },
      {
        email: "viewer@demo.local",
        name: "Viewer",
        role: "READ_ONLY" as CommerceRole,
      },
    ];

    for (const demo of demoUsers) {
      let user = await db.user.findUnique({ where: { email: demo.email } });
      if (!user) {
        user = await db.user.create({
          data: {
            email: demo.email,
            name: demo.name,
            active: true,
          },
        });
      }

      let orgMember = await db.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: orgId,
            userId: user.id,
          },
        },
      });
      if (!orgMember) {
        orgMember = await db.organizationMember.create({
          data: {
            organizationId: orgId,
            userId: user.id,
            role: demo.role,
          },
        });
      }

      let wsMember = await db.workspaceMember.findUnique({
        where: {
          workspaceId_organizationMemberId: {
            workspaceId: wsId,
            organizationMemberId: orgMember.id,
          },
        },
      });
      if (!wsMember) {
        await db.workspaceMember.create({
          data: {
            workspaceId: wsId,
            organizationId: orgId,
            organizationMemberId: orgMember.id,
          },
        });
      }
    }
  } catch (err) {
    console.warn("Failed to seed dynamic demo users/memberships:", err);
  }
}
