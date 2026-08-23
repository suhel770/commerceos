import { NextResponse } from "next/server";
import { checkDatabaseHealth } from "@/lib/db-health";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await checkDatabaseHealth();
  if (!result.ok) {
    return NextResponse.json(result, { status: 500 });
  }
  return NextResponse.json(result, { status: 200 });
}
