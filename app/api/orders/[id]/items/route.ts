import { NextResponse } from "next/server";
import { updateOrderItems } from "@/lib/firebase-db";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Delete all order items for this order by passing empty array
    await updateOrderItems(id, []);

    return NextResponse.json({ message: "Order items deleted" });
  } catch (error) {
    console.error("Error deleting order items:", error);
    return NextResponse.json(
      { error: "Failed to delete order items" },
      { status: 500 }
    );
  }
}
