import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface AuthPayload {
  userId: string;
  username: string;
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    return payload;
  } catch (e) {
    return null;
  }
}

export function getTokenFromRequest(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.slice(7);
}

export function verifyAdminRequest(req: NextRequest): AuthPayload | null {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  return verifyToken(token);
}

export function requireAdmin(req: NextRequest): { user: AuthPayload } | null {
  const user = verifyAdminRequest(req);
  if (!user) {
    return null;
  }
  return { user };
}
