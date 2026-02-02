import { NextRequest, NextResponse } from "next/server";
import { findAdminUserByUsernameOrEmail, verifyAdminPassword } from "@/lib/firebase-db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body ?? {};
    if (!username || !password) {
      return NextResponse.json({ error: "username/email and password required" }, { status: 400 });
    }

    // Find user by username OR email
    const user = await findAdminUserByUsernameOrEmail(username);
    if (!user) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    }

    const ok = await verifyAdminPassword(user, password);
    if (!ok) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    return NextResponse.json({
      ok: true,
      username: user.username,
      token: token,
      userId: user.id
    });
  } catch (e) {
    console.error("Login error:", e);
    return NextResponse.json({ error: "failed to login" }, { status: 500 });
  }
}
