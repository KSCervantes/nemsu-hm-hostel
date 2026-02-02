import { NextRequest, NextResponse } from "next/server";
import { getAppSettings, updateAppSettings } from "@/lib/firebase-db";

interface AdminSettings {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  dangerColor: string;
  fontFamily: string;
  fontSize: string;
  siteName: string;
  itemsPerPage: string;
  dateFormat: string;
  timeFormat: string;
  emailNotifications: boolean;
  orderNotifications: boolean;
  systemNotifications: boolean;
  enableDebugMode: boolean;
  sessionTimeout: string;
}

const defaultSettings: AdminSettings = {
  primaryColor: "#667eea",
  secondaryColor: "#764ba2",
  accentColor: "#10b981",
  dangerColor: "#dc2626",
  fontFamily: "system-ui",
  fontSize: "14",
  siteName: "Hostel Admin",
  itemsPerPage: "10",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h",
  emailNotifications: true,
  orderNotifications: true,
  systemNotifications: true,
  enableDebugMode: false,
  sessionTimeout: "30",
};

export async function GET() {
  try {
    console.log("Fetching settings from Firebase");
    const settings = await getAppSettings();
    console.log("Returning settings");
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching settings:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to fetch settings", details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const settings = await request.json() as AdminSettings;
    console.log("Saving settings:", JSON.stringify(settings).substring(0, 100));

    const saved = await updateAppSettings(settings);

    console.log("Settings saved successfully");
    return NextResponse.json(saved);
  } catch (error) {
    console.error("Error saving settings:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to save settings",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { action?: string };
    console.log("POST request with action:", body.action);

    if (body.action === "reset") {
      console.log("Resetting settings to defaults");

      await updateAppSettings(defaultSettings);

      console.log("Settings reset successfully");
      return NextResponse.json(defaultSettings);
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error resetting settings:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Failed to reset settings",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
