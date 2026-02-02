import { NextRequest, NextResponse } from "next/server";
import {
  getAllFoodItems,
  createFoodItem,
  getFoodItemByCode,
} from "@/lib/firebase-db";
import { validateFoodItem } from "@/lib/validators";

export async function GET() {
  try {
    const items = await getAllFoodItems();
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

    // Validate input
    const validation = validateFoodItem({ name, description, price, category, code, img, available });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join("; ") }, { status: 400 });
    }

    // Check if code already exists (if code is provided)
    if (code) {
      const existing = await getFoodItemByCode(code);
      if (existing) {
        return NextResponse.json({ error: "Code already exists" }, { status: 400 });
      }
    }

    const item = await createFoodItem({
      name,
      description: description ?? null,
      price: parseFloat(price),
      category: category ?? null,
      code: code ?? null,
      img: img ?? null,
      available: available ?? true,
    });

    return NextResponse.json(item, { status: 201 });
  } catch (e: any) {
    console.error("Food item creation error:", e);
    return NextResponse.json({ error: "failed to create food item" }, { status: 500 });
  }
}
