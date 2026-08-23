import { NextResponse } from "next/server";
import { ConsumableService } from "@/lib/consumables/consumable.service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const status = searchParams.get("status") || undefined;

    const items = await ConsumableService.getConsumables({ search, status });

    return NextResponse.json({
      success: true,
      data: items,
      count: items.length,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch consumables",
      },
      { status: 500 },
    );
  }
}
