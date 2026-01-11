import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.foodItem.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json(items);
  } catch (e) {
    console.error("Food items fetch error:", e);
    return NextResponse.json({ error: "failed to fetch food items" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, price, category, code, img, available } = body;

    if (!name || !price) {
      return NextResponse.json({ error: "name and price are required" }, { status: 400 });
    }

    // Check if code already exists (if code is provided)
    if (code) {
      const existing = await prisma.foodItem.findUnique({
        where: { code },
      });
      if (existing) {
        return NextResponse.json({ error: "Code already exists" }, { status: 400 });
      }
    }

    const item = await prisma.foodItem.create({
      data: {
        name,
        description: description ?? null,
        price: parseFloat(price),
        category: category ?? null,
        code: code ?? null,
        img: img ?? null,
        available: available ?? true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (e: any) {
    console.error("Food item creation error:", e);

    // Handle Prisma unique constraint error
    if (e.code === 'P2002') {
      return NextResponse.json({ error: "Code already exists" }, { status: 400 });
    }

    return NextResponse.json({ error: "failed to create food item" }, { status: 500 });
  }
}
