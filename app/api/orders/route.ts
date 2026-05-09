import { NextRequest, NextResponse } from "next/server";
import {
  getAllOrders,
  createOrder,
} from "@/lib/firebase-db";
import { serializeOrder } from "@/lib/firebase";
import { sendOrderConfirmationEmail, sendOrderPickupConfirmationEmail } from "@/lib/email";
import { validateOrderInput } from "@/lib/validators";
import { getOrderTotal } from "@/lib/order-pricing";
import { resolveOrderItemsFromMenu } from "@/lib/order-items";
import { processPendingOrderExpirations } from "@/lib/order-expiration";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const archivedParam = searchParams.get("archived");

    let archived: boolean | undefined;
    if (archivedParam === "true") {
      archived = true;
    } else if (archivedParam === "false") {
      archived = false;
    }

    console.log("Fetching orders with archived param:", archivedParam);

    if (archived !== true) {
      const expirationSummary = await processPendingOrderExpirations();
      if (
        expirationSummary.warningsSent > 0 ||
        expirationSummary.autoCancelled > 0 ||
        expirationSummary.warningFailures > 0 ||
        expirationSummary.cancellationEmailFailures > 0
      ) {
        console.log("Pending order expiration summary:", expirationSummary);
      }
    }

    const orders = await getAllOrders(archived);

    // Serialize Timestamps and attach a stable frontend UID to each order
    const mapped = orders.map((o) => ({
      ...serializeOrder(o),
      uid: `ORD${String(o.numericId || 0).padStart(6, "0")}`,
    }));

    console.log(`Found ${orders.length} orders`);
    console.log(`📋 Order statuses:`, orders.map(o => `#${o.numericId}: ${o.status}`).join(", "));
    const pendingOrders = mapped.filter(o => o.status === "PENDING");
    console.log(`🔔 PENDING orders:`, pendingOrders.length, pendingOrders.map(o => ({ id: o.id, numericId: o.numericId, customer: o.customer, status: o.status })));
    return NextResponse.json(mapped);
  } catch (e) {
    console.error("Order fetch error:", e);
    return NextResponse.json(
      { error: "failed to fetch orders" },
      { status: 500 }
    );
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
      date?: string;
      time?: string;
      items?: Array<{ foodId?: string; foodItemId?: string; quantity: number; notes?: string }>;
      orderType?: 'DELIVERY' | 'PICKUP';
    };

    // Validate input
    const validation = validateOrderInput({ customer, contactNumber, email, address, items });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors.join("; ") }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "items required" }, { status: 400 });
    }

    const resolvedOrderItems = await resolveOrderItemsFromMenu(items);
    if (resolvedOrderItems.error) {
      return NextResponse.json({ error: resolvedOrderItems.error }, { status: 400 });
    }

    const resolvedOrderType = orderType === "PICKUP" ? "PICKUP" : "DELIVERY";
    const subtotal = resolvedOrderItems.items.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
    const total = getOrderTotal(subtotal, resolvedOrderType);

    let desiredAt: Date | null = null;
    try {
      if (date) {
        const iso = `${date}T${time ? time : "00:00"}:00`;
        const dt = new Date(iso);
        if (!isNaN(dt.getTime())) desiredAt = dt;
      }
    } catch {}

    const order = await createOrder({
      customer: customer ?? undefined,
      contactNumber: contactNumber ?? undefined,
      email: email ?? undefined,
      address: address ?? undefined,
      desiredAt,
      orderType: resolvedOrderType,
      total,
      items: resolvedOrderItems.items.map((it) => ({
        foodId: it.foodId,
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        notes: it.notes ?? undefined,
      })),
    });

    // Send confirmation email if email is provided
    if (email) {
      try {
        const common = {
          customerName: customer || "Guest",
          email: email,
          orderId: order.numericId || 0,
          items: resolvedOrderItems.items.map(it => ({
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
        const emailResult = resolvedOrderType === 'PICKUP'
          ? await sendOrderPickupConfirmationEmail({
              ...common,
              address: 'Pick up at: Hostel Restaurant, 123 Hostel Ave, Barangay Central, City, Province',
            })
          : await sendOrderConfirmationEmail({
              ...common,
              address: address || "N/A",
            });

        if (!emailResult.success) {
          console.error(`⚠️ Order #${order.numericId} created successfully, but email notification failed:`, emailResult.error);
        }
      } catch (emailError: unknown) {
        console.error(
          `⚠️ Order #${order.numericId} created successfully, but email notification failed:`,
          emailError instanceof Error ? emailError.message : emailError
        );
      }
    } else {
      console.log(`ℹ️ Order #${order.numericId} created without email notification (no email provided)`);
    }

    return NextResponse.json(order, { status: 201 });
  } catch (e) {
    console.error("Order creation error:", e);
    return NextResponse.json({ error: "failed to create order", details: String(e) }, { status: 500 });
  }
}
