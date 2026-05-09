import { NextResponse } from "next/server";
import { processPendingOrderExpirations } from "@/lib/order-expiration";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured" },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await processPendingOrderExpirations();
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    console.error("Pending order expiration cron failed:", error);
    return NextResponse.json(
      { error: "Failed to process pending order expirations" },
      { status: 500 }
    );
  }
}
