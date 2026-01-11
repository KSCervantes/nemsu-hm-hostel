import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderAcceptedEmail, sendOrderCompletedEmail, sendOrderCancelledEmail } from "@/lib/email";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await req.json();
    const { status, archived, archivedAt, customer, contactNumber, email, address, desiredAt, items } = body;

    // Fetch existing order
    const existing = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!existing) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Prepare scalar update data
    const updateData: any = {};
    if (status) {
      updateData.status = status;
      const shouldArchive = status === 'COMPLETED' || status === 'CANCELLED';
      if (shouldArchive) {
        updateData.archived = true;
        updateData.archivedAt = new Date();
      }
    }
    if (archived !== undefined) {
      updateData.archived = archived;
      updateData.archivedAt = archived ? (archivedAt || new Date()) : null;
    }
    if (customer !== undefined) updateData.customer = customer
    if (contactNumber !== undefined) updateData.contactNumber = contactNumber
    if (email !== undefined) updateData.email = email
    if (address !== undefined) updateData.address = address
    if (desiredAt !== undefined) updateData.desiredAt = desiredAt ? new Date(desiredAt) : null

    // Apply scalar updates
    await prisma.order.update({ where: { id }, data: updateData })

    // If items present, sync them (update existing, create new, delete removed)
    if (Array.isArray(items)) {
      const providedIds = items.filter((it: any) => typeof it.id === 'number').map((it: any) => it.id)

      const toDelete = existing.items.filter((it) => !providedIds.includes(it.id)).map((it) => it.id)
      if (toDelete.length > 0) {
        await prisma.orderItem.deleteMany({ where: { id: { in: toDelete } } })
      }

      for (const it of items) {
        const qty = Number(it.quantity || 0)
        const unit = Number(it.unitPrice || 0)
        const lineTotal = Number((qty * unit).toFixed(2))

        if (typeof it.id === 'number') {
          await prisma.orderItem.update({ where: { id: it.id }, data: { name: it.name, quantity: qty, unitPrice: unit, lineTotal, notes: it.notes ?? null } })
        } else {
          // optional upsert for food item if foodId provided
          let createData: any = { order: { connect: { id } }, name: it.name, quantity: qty, unitPrice: unit, lineTotal, notes: it.notes ?? null }
          
          if (typeof it.foodId === 'number') {
            const fid = Number(it.foodId)
            await prisma.foodItem.upsert({ where: { id: fid }, update: { name: it.name, price: unit }, create: { id: fid, name: it.name, price: unit } })
            createData.foodId = fid
          }

          await prisma.orderItem.create({ data: createData })
        }
      }

      // recompute total
      const fresh = await prisma.order.findUnique({ where: { id }, include: { items: true } })
      const total = fresh?.items.reduce((s, x) => s + Number(x.lineTotal), 0) ?? 0
      await prisma.order.update({ where: { id }, data: { total } })
    }

    // Re-fetch updated order
    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } })

    // Send notifications based on status
    if (status === 'ACCEPTED' && order?.email) {
      try {
        await sendOrderAcceptedEmail({
          customerName: order.customer || 'Guest',
          email: order.email,
          orderId: order.id,
          items: order.items.map(item => ({ name: item.name, quantity: item.quantity, unitPrice: parseFloat(item.unitPrice.toString()), notes: item.notes || undefined })),
          total: parseFloat(order.total.toString()),
          address: order.address || 'N/A',
          contactNumber: order.contactNumber || 'N/A',
          date: order.desiredAt ? new Date(order.desiredAt).toLocaleDateString() : undefined,
          time: order.desiredAt ? new Date(order.desiredAt).toLocaleTimeString() : undefined,
        })
      } catch (emailError) { console.error('Failed to send order accepted email:', emailError) }
    }

    if (status === 'COMPLETED' && order?.email) {
      try {
        await sendOrderCompletedEmail({
          customerName: order.customer || 'Guest',
          email: order.email,
          orderId: order.id,
          items: order.items.map(item => ({ name: item.name, quantity: item.quantity, unitPrice: parseFloat(item.unitPrice.toString()), notes: item.notes || undefined })),
          total: parseFloat(order.total.toString()),
          address: order.address || 'N/A',
          contactNumber: order.contactNumber || 'N/A',
          date: order.desiredAt ? new Date(order.desiredAt).toLocaleDateString() : undefined,
          time: order.desiredAt ? new Date(order.desiredAt).toLocaleTimeString() : undefined,
        })
      } catch (emailError) { console.error('Failed to send order completed email:', emailError) }
    }

    if (status === 'CANCELLED' && order?.email) {
      try {
        await sendOrderCancelledEmail({
          customerName: order.customer || 'Guest',
          email: order.email,
          orderId: order.id,
          items: order.items.map(item => ({ name: item.name, quantity: item.quantity, unitPrice: parseFloat(item.unitPrice.toString()), notes: item.notes || undefined })),
          total: parseFloat(order.total.toString()),
          address: order.address || 'N/A',
          contactNumber: order.contactNumber || 'N/A',
          date: order.desiredAt ? new Date(order.desiredAt).toLocaleDateString() : undefined,
          time: order.desiredAt ? new Date(order.desiredAt).toLocaleTimeString() : undefined,
        })
      } catch (emailError) { console.error('Failed to send order cancelled email:', emailError) }
    }

    return NextResponse.json(order)
  } catch (e: any) {
    console.error('Order update error:', e)
    if (e.code === 'P2025') return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);

    // Get order details before archiving for email notification
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });

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
    await prisma.order.update({
      where: { id },
      data: {
        archived: true,
        archivedAt: new Date(),
        status: "CANCELLED" // Mark as cancelled when deleted
      }
    });

    // Send cancellation email if email is provided
    if (order.email) {
      try {
        await sendOrderCancelledEmail({
          customerName: order.customer || "Guest",
          email: order.email,
          orderId: order.id,
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            unitPrice: parseFloat(item.unitPrice.toString()),
            notes: item.notes || undefined,
          })),
          total: parseFloat(order.total.toString()),
          address: order.address || "N/A",
          contactNumber: order.contactNumber || "N/A",
          date: order.desiredAt ? new Date(order.desiredAt).toLocaleDateString() : undefined,
          time: order.desiredAt ? new Date(order.desiredAt).toLocaleTimeString() : undefined,
        });
      } catch (emailError) {
        console.error("Failed to send order cancelled email:", emailError);
        // Don't fail the delete if email fails
      }
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Order delete error:", e);

    if (e.code === 'P2025') {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
