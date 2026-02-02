import { NextRequest, NextResponse } from "next/server";
import {
  getOrderById,
  updateOrder,
  updateOrderItems,
  deleteOrder,
} from "@/lib/firebase-db";
import { toDate, serializeOrder } from "@/lib/firebase";
import { sendOrderAcceptedEmail, sendOrderCompletedEmail, sendOrderCancelledEmail } from "@/lib/email";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, archived, archivedAt, customer, contactNumber, email, address, desiredAt, items } = body;

    // Fetch existing order
    const existing = await getOrderById(id);
    if (!existing) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Prepare update data
    const updateData: any = {};
    if (status) {
      updateData.status = status;
    }
    if (archived !== undefined) {
      updateData.archived = archived;
      if (archived) {
        updateData.archivedAt = archivedAt ? new Date(archivedAt) : new Date();
      } else {
        updateData.archivedAt = null;
      }
    }
    if (customer !== undefined) updateData.customer = customer;
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (desiredAt !== undefined) updateData.desiredAt = desiredAt ? new Date(desiredAt) : null;

    // Apply scalar updates
    await updateOrder(id, updateData);

    // If items present, sync them
    if (Array.isArray(items)) {
      await updateOrderItems(id, items.map((it: any) => ({
        id: it.id,
        foodId: it.foodId,
        name: it.name,
        quantity: Number(it.quantity || 0),
        unitPrice: Number(it.unitPrice || 0),
        notes: it.notes ?? undefined,
      })));
    }

    // Re-fetch updated order
    const order = await getOrderById(id);

    // Send notifications based on status
    if (status === 'ACCEPTED' && order?.email) {
      try {
        const desiredDate = order.desiredAt ? toDate(order.desiredAt as any) : null;
        await sendOrderAcceptedEmail({
          customerName: order.customer || 'Guest',
          email: order.email,
          orderId: order.numericId || 0,
          items: (order.items || []).map(item => ({ name: item.name, quantity: item.quantity, unitPrice: item.unitPrice, notes: item.notes || undefined })),
          total: order.total,
          address: order.address || 'N/A',
          contactNumber: order.contactNumber || 'N/A',
          date: desiredDate ? desiredDate.toLocaleDateString() : undefined,
          time: desiredDate ? desiredDate.toLocaleTimeString() : undefined,
        });
      } catch (emailError) { console.error('Failed to send order accepted email:', emailError); }
    }

    if (status === 'COMPLETED' && order?.email) {
      try {
        const desiredDate = order.desiredAt ? toDate(order.desiredAt as any) : null;
        await sendOrderCompletedEmail({
          customerName: order.customer || 'Guest',
          email: order.email,
          orderId: order.numericId || 0,
          items: (order.items || []).map(item => ({ name: item.name, quantity: item.quantity, unitPrice: item.unitPrice, notes: item.notes || undefined })),
          total: order.total,
          address: order.address || 'N/A',
          contactNumber: order.contactNumber || 'N/A',
          date: desiredDate ? desiredDate.toLocaleDateString() : undefined,
          time: desiredDate ? desiredDate.toLocaleTimeString() : undefined,
        });
      } catch (emailError) { console.error('Failed to send order completed email:', emailError); }
    }

    if (status === 'CANCELLED' && order?.email) {
      try {
        const desiredDate = order.desiredAt ? toDate(order.desiredAt as any) : null;
        await sendOrderCancelledEmail({
          customerName: order.customer || 'Guest',
          email: order.email,
          orderId: order.numericId || 0,
          items: (order.items || []).map(item => ({ name: item.name, quantity: item.quantity, unitPrice: item.unitPrice, notes: item.notes || undefined })),
          total: order.total,
          address: order.address || 'N/A',
          contactNumber: order.contactNumber || 'N/A',
          date: desiredDate ? desiredDate.toLocaleDateString() : undefined,
          time: desiredDate ? desiredDate.toLocaleTimeString() : undefined,
        });
      } catch (emailError) { console.error('Failed to send order cancelled email:', emailError); }
    }

    return NextResponse.json(order ? serializeOrder(order) : null);
  } catch (e: any) {
    console.error('Order update error:', e);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Get order details before archiving for email notification
    const order = await getOrderById(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Prevent deletion of ACCEPTED or COMPLETED orders
    if (order.status === "ACCEPTED" || order.status === "COMPLETED") {
      return NextResponse.json({
        error: "Cannot delete orders that have been accepted or completed"
      }, { status: 400 });
    }

    // Archive the order instead of permanently deleting
    await updateOrder(id, {
      archived: true,
      archivedAt: new Date(),
      status: "CANCELLED"
    });

    // Send cancellation email if email is provided
    if (order.email) {
      try {
        const desiredDate = order.desiredAt ? toDate(order.desiredAt as any) : null;
        await sendOrderCancelledEmail({
          customerName: order.customer || "Guest",
          email: order.email,
          orderId: order.numericId || 0,
          items: (order.items || []).map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            notes: item.notes || undefined,
          })),
          total: order.total,
          address: order.address || "N/A",
          contactNumber: order.contactNumber || "N/A",
          date: desiredDate ? desiredDate.toLocaleDateString() : undefined,
          time: desiredDate ? desiredDate.toLocaleTimeString() : undefined,
        });
      } catch (emailError) {
        console.error("Failed to send order cancelled email:", emailError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Order delete error:", e);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
