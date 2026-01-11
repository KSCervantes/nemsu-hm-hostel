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

    // Permanently delete the order (cascades to order items)
    await prisma.order.delete({
      where: { id: orderId },
    });

    return NextResponse.json({ message: "Order permanently deleted" });
  } catch (error) {
    console.error("Error permanently deleting order:", error);
    return NextResponse.json(
      { error: "Failed to permanently delete order" },
      { status: 500 }
    );
  }
}
