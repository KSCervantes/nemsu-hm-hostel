import { NextRequest, NextResponse } from "next/server";
import {
  findAdminUserById,
  findAdminUserByUsername,
  verifyAdminPassword,
  updateAdminUser,
} from "@/lib/firebase-db";
import { verifyAdminRequest } from "@/lib/auth";

// GET - Fetch current admin profile
export async function GET(req: NextRequest) {
  try {
    const auth = verifyAdminRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await findAdminUserById(auth.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: (user as any).email || "",
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (e) {
    console.error("Profile fetch error:", e);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// PUT - Update admin profile
export async function PUT(req: NextRequest) {
  try {
    const auth = verifyAdminRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { username, email, currentPassword, newPassword } = body ?? {};

    // Get current user
    const currentUser = await findAdminUserById(auth.userId);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If changing password, verify current password first
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "Current password is required to change password" },
          { status: 400 }
        );
      }

      const passwordValid = await verifyAdminPassword(currentUser, currentPassword);
      if (!passwordValid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 401 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }
    }

    // If changing username, check if new username is already taken
    if (username && username !== currentUser.username) {
      const existingUser = await findAdminUserByUsername(username);
      if (existingUser && existingUser.id !== currentUser.id) {
        return NextResponse.json(
          { error: "Username already taken" },
          { status: 409 }
        );
      }
    }

    // Update user
    const updatedUser = await updateAdminUser(currentUser.id!, {
      username: username || undefined,
      email: email || undefined,
      newPassword: newPassword || undefined,
    });

    return NextResponse.json({
      ok: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: (updatedUser as any).email || "",
      },
    });
  } catch (e) {
    console.error("Profile update error:", e);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
