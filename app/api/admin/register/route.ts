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

    const existing = await prisma.adminUser.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "username already exists" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.adminUser.create({ data: { username, passwordHash } });
    return NextResponse.json({ id: user.id, username: user.username }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "failed to register" }, { status: 500 });
  }
}
