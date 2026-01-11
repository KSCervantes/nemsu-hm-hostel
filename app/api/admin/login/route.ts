import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body ?? {};
    if (!username || !password) {
      return NextResponse.json({ error: "username and password required" }, { status: 400 });
    }

    const user = await prisma.adminUser.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "invalid credentials" }, { status: 401 });
    }

    // You would normally create a session/JWT here
    return NextResponse.json({ ok: true, username: user.username });
  } catch (e) {
    return NextResponse.json({ error: "failed to login" }, { status: 500 });
  }
}
