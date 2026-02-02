import { NextResponse } from "next/server";
import { getDashboardMetrics } from "@/lib/firebase-db";

export async function GET() {
  try {
    const metrics = await getDashboardMetrics();
    return NextResponse.json(metrics);
  } catch (e) {
    console.error("Dashboard metrics fetch error:", e);
    return NextResponse.json({ error: "failed to fetch metrics" }, { status: 500 });
  }
}
