import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth/session";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("commerceos-session")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Not authenticated." },
        { status: 401 }
      );
    }

    const payload = verifySession(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Session expired or invalid." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: payload.userId,
        email: payload.email,
        name: payload.name,
        role: payload.role,
        organizationId: payload.organizationId,
        workspaceId: payload.workspaceId,
        expiresAt: payload.expiresAt,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Internal session error." },
      { status: 500 }
    );
  }
}
