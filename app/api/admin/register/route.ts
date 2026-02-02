import { NextRequest, NextResponse } from "next/server";
import {
  getAllAdminUsers,
  findAdminUserByUsername,
  createAdminUser,
} from "@/lib/firebase-db";

export async function GET() {
  try {
    const users = await getAllAdminUsers();
    // Map to exclude passwordHash
    const safeUsers = users.map(u => ({
      id: u.id,
      username: u.username,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));
    return NextResponse.json(safeUsers, { status: 200 });
  } catch (e) {
    console.error("Failed to fetch admin users:", e);
    return NextResponse.json({ error: "failed to fetch admin users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body ?? {};
    if (!username || !password) {
      return NextResponse.json({ error: "username and password required" }, { status: 400 });
    }

    const existing = await findAdminUserByUsername(username);
    if (existing) {
      return NextResponse.json({ error: "username already exists" }, { status: 409 });
    }

    const user = await createAdminUser(username, password);
    return NextResponse.json({ id: user.id, username: user.username }, { status: 201 });
  } catch (e) {
    console.error("Failed to register admin user:", e);
    return NextResponse.json({ error: "failed to register" }, { status: 500 });
  }
}
