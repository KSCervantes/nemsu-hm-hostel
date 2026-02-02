import { NextResponse } from "next/server";
import { getAllAdminUsers, getAppSettings } from "@/lib/firebase-db";
import { db } from "@/lib/firebase";

export async function GET() {
  try {
    // Test Firebase connection
    console.log("Testing Firebase connection...");

    // Try to get admin users
    const adminUsers = await getAllAdminUsers();
    console.log("Found admin users:", adminUsers.length);

    // Try to get app settings
    const settings = await getAppSettings();
    console.log("App settings found:", !!settings);

    return NextResponse.json({
      status: "ok",
      database: "Firebase connected",
      adminUsers: adminUsers.length,
      appSettings: !!settings
    });
  } catch (error) {
    console.error("Test failed:", error);
    return NextResponse.json({
      status: "error",
      error: String(error)
    }, { status: 500 });
  }
}
