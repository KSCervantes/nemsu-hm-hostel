import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail, sendOrderPickupConfirmationEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const archivedParam = searchParams.get('archived');
    const statusParam = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Handle archived, status and date range parameters
    let whereClause: any = {};

    if (archivedParam === 'true') {
      whereClause.archived = true;
    } else if (archivedParam === 'false') {
      whereClause.archived = false;
    }

    if (statusParam) {
      whereClause.status = statusParam;
    }

    if (dateFrom || dateTo) {
      whereClause.createdAt = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (!isNaN(from.getTime())) whereClause.createdAt.gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        if (!isNaN(to.getTime())) {
          // If only a date (YYYY-MM-DD) was provided, extend to end of day
          if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
            to.setHours(23, 59, 59, 999);
          }
          whereClause.createdAt.lte = to;
        }
      }
      // If createdAt ended up empty, delete it
      if (Object.keys(whereClause.createdAt).length === 0) delete whereClause.createdAt;
    }
    // If archivedParam is null, whereClause remains {} (fetch all)

    console.log('Fetching orders with archived param:', archivedParam, 'where clause:', whereClause);

    const orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { id: "desc" },
      include: { items: true },
    });

    // Attach a stable frontend UID to each order for display/export purposes.
    // We keep the underlying numeric `id` as the PK in the DB.
    const mapped = orders.map((o) => ({
      ...o,
      uid: `ORD${String(o.id).padStart(6, '0')}`,
    }));

    console.log(`Found ${orders.length} orders`);
    return NextResponse.json(mapped);
  } catch (e) {
    console.error("Order fetch error:", e);
    return NextResponse.json({ error: "failed to fetch orders" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customer, contactNumber, email, address, date, time, items, orderType } = (body ?? {}) as {
      customer?: string;
      contactNumber?: string;
      email?: string;
      address?: string;
      date?: string; // yyyy-mm-dd
      time?: string; // HH:mm
      items?: Array<{ foodId: number; name: string; quantity: number; unitPrice: number; notes?: string }>;
      orderType?: 'DELIVERY' | 'PICKUP';
    };

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items required" }, { status: 400 });
    }

    const total = items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);

    // Ensure each FoodItem exists; upsert by id with latest name/price
    await Promise.all(
      items.map((it) =>
        prisma.foodItem.upsert({
          where: { id: it.foodId },
          update: { name: it.name, price: it.unitPrice },
          create: { id: it.foodId, name: it.name, price: it.unitPrice },
        })
      )
    );

    let desiredAt: Date | null = null;
    try {
      if (date) {
        const iso = `${date}T${time ? time : "00:00"}:00`;
        const dt = new Date(iso);
        if (!isNaN(dt.getTime())) desiredAt = dt;
      }
    } catch (e) {}

    const order = await prisma.order.create({
      data: {
        customer: customer ?? null,
        contactNumber: contactNumber ?? null,
        email: email ?? null,
        address: address ?? null,
        desiredAt: desiredAt,
        orderType: (orderType === 'PICKUP' ? 'PICKUP' : 'DELIVERY') as any,
        total,
        items: {
          create: items.map((it) => ({
            foodId: it.foodId,
            name: it.name,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            lineTotal: it.quantity * it.unitPrice,
            notes: it.notes ?? null,
          })),
        },
      },
      include: { items: true },
    });

    // Send confirmation email if email is provided
    if (email) {
      try {
        const common = {
          customerName: customer || "Guest",
          email: email,
          orderId: order.id,
          items: items.map(it => ({
            name: it.name,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            notes: it.notes,
          })),
          total: total,
          contactNumber: contactNumber || "N/A",
          date: date,
          time: time,
        };
        const emailResult = orderType === 'PICKUP' 
          ? await sendOrderPickupConfirmationEmail({
              ...common,
              address: 'Pick up at: Hostel Restaurant, 123 Hostel Ave, Barangay Central, City, Province',
            })
          : await sendOrderConfirmationEmail({
              ...common,
              address: address || "N/A",
            });
        
        if (!emailResult.success) {
          console.error(`⚠️ Order #${order.id} created successfully, but email notification failed:`, emailResult.error);
        }
      } catch (emailError: any) {
        console.error(`⚠️ Order #${order.id} created successfully, but email notification failed:`, emailError?.message || emailError);
        // Don't fail the order creation if email fails
      }
    } else {
      console.log(`ℹ️ Order #${order.id} created without email notification (no email provided)`);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    console.error("Order creation error:", e);
    return NextResponse.json({ error: "failed to create order", details: String(e) }, { status: 500 });
  }
}
