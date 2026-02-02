import { NextRequest, NextResponse } from "next/server";
import { getOrderById, deleteOrder, createAuditLog } from "@/lib/firebase-db";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Fetch the order before deletion for audit logging
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Create audit log entry
    await createAuditLog({
      action: "DELETE",
      tableName: "order",
      recordId: id,
      userId: null,
      details: JSON.stringify({
        orderId: order.id,
        numericId: order.numericId,
        customer: order.customer,
        total: order.total,
        itemsCount: order.items?.length || 0,
        status: order.status,
        deletedAt: new Date().toISOString()
      })
    });

    // Permanently delete the order (also deletes order items)
    await deleteOrder(id);

    console.log(`✓ Order #${order.numericId} permanently deleted and logged to audit trail`);

    return NextResponse.json({
      message: "Order permanently deleted and logged",
      auditId: order.id
    });
  } catch (error) {
    console.error("Error permanently deleting order:", error);
    return NextResponse.json(
      { error: "Failed to permanently delete order" },
      { status: 500 }
    );
  }
}
