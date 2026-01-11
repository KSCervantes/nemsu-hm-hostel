import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const orderId = parseInt(id, 10);

    if (isNaN(orderId)) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    // Delete all order items for this order
    await prisma.orderItem.deleteMany({
      where: { orderId: orderId },
    });

    return NextResponse.json({ message: "Order items deleted" });
  } catch (error) {
    console.error("Error deleting order items:", error);
    return NextResponse.json(
      { error: "Failed to delete order items" },
      { status: 500 }
    );
  }
}
