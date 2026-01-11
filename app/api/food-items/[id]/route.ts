import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const item = await prisma.foodItem.findUnique({ where: { id } });
    if (!item) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (e) {
    console.error("Food item fetch error:", e);
    return NextResponse.json({ error: "failed to fetch food item" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await req.json();
    const { name, description, price, category, code, img, available } = body;

    // Get current item to check if code is actually changing
    const currentItem = await prisma.foodItem.findUnique({
      where: { id },
    });

    if (!currentItem) {
      return NextResponse.json({ error: "Food item not found" }, { status: 404 });
    }

    // Check if code is being changed and if it already exists (case-insensitive comparison)
    const currentCode = currentItem.code?.toLowerCase() || "";
    const newCode = code?.toLowerCase() || "";

    if (code !== undefined && code !== null && code !== "" && newCode !== currentCode) {
      const existing = await prisma.foodItem.findUnique({
        where: { code },
      });
      if (existing) {
        return NextResponse.json({ error: "Code already exists" }, { status: 400 });
      }
    }

    // Build update data object
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (price !== undefined) {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice)) {
        return NextResponse.json({ error: "Invalid price value" }, { status: 400 });
      }
      updateData.price = parsedPrice;
    }
    if (category !== undefined) updateData.category = category || null;
    if (code !== undefined) updateData.code = code || null;
    if (img !== undefined) updateData.img = img || null;
    if (available !== undefined) updateData.available = available;

    const item = await prisma.foodItem.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(item);
  } catch (e: any) {
    console.error("Food item update error:", e);

    // Handle Prisma unique constraint error
    if (e.code === 'P2002') {
      return NextResponse.json({ error: "Code already exists" }, { status: 400 });
    }

    // Handle record not found
    if (e.code === 'P2025') {
      return NextResponse.json({ error: "Food item not found" }, { status: 404 });
    }

    return NextResponse.json({ error: e.message || "failed to update food item" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    await prisma.foodItem.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Food item delete error:", e);
    return NextResponse.json({ error: "failed to delete food item" }, { status: 500 });
  }
}
