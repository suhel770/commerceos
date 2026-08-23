import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ensureDemoUsersExist, signSession } from "@/lib/auth/session";
import { db } from "@/lib/db";

const DEMO_CREDENTIALS = [
  { email: "owner@demo.local", password: "demo123", role: "owner" },
  { email: "ops@demo.local", password: "demo123", role: "ops" },
  { email: "viewer@demo.local", password: "demo123", role: "viewer" },
];

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Missing email or password." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const creds = DEMO_CREDENTIALS.find(
      (c) => c.email === trimmedEmail && c.password === password
    );

    if (!creds) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Ensure database demo records are populated
    await ensureDemoUsersExist();

    // Query resolved user to retrieve database ID
    const user = await db.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User resolved successfully but database record not found." },
        { status: 500 }
      );
    }

    // Set expiration to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const payload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: creds.role,
      organizationId: "org-commerceos",
      workspaceId: "ws-default",
      expiresAt,
    };

    const token = signSession(payload);

    const cookieStore = await cookies();
    cookieStore.set("commerceos-session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 24 * 60 * 60, // 24h
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: creds.role,
        organizationId: "org-commerceos",
        workspaceId: "ws-default",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "Internal login failure" },
      { status: 500 }
    );
  }
}
