import { sendOrderCancellationWarningEmail, sendOrderCancelledEmail } from "./email";
import { getAllOrders, updateOrder } from "./firebase-db";
import { toDate, type Order, type OrderItem } from "./firebase";

const WARNING_AFTER_HOURS = 12;
const CANCEL_AFTER_HOURS = 24;
const MS_PER_HOUR = 60 * 60 * 1000;
const SYSTEM_CANCELLATION_REASON = "Automatically cancelled because it stayed pending for 24 hours.";

export interface PendingOrderExpirationSummary {
  checked: number;
  warningsSent: number;
  warningFailures: number;
  autoCancelled: number;
  cancellationEmailsSent: number;
  cancellationEmailFailures: number;
  skippedNoEmail: number;
  skippedInvalidDate: number;
}

function getOrderItemsForEmail(items: OrderItem[] = []) {
  return items.map((item) => ({
    name: item.name,
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice || 0),
    notes: item.notes || undefined,
  }));
}

function formatManilaDateTime(date: Date): string {
  return date.toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getEmailPayload(order: Order, deadline: Date, hoursUntilCancellation?: number) {
  const desiredDate = order.desiredAt ? toDate(order.desiredAt) : null;

  return {
    customerName: order.customer || "Guest",
    email: order.email || "",
    orderId: order.numericId || 0,
    items: getOrderItemsForEmail(order.items || []),
    total: Number(order.total || 0),
    address: order.address || "N/A",
    contactNumber: order.contactNumber || "N/A",
    date: desiredDate ? desiredDate.toLocaleDateString("en-PH", { timeZone: "Asia/Manila" }) : undefined,
    time: desiredDate ? desiredDate.toLocaleTimeString("en-PH", { timeZone: "Asia/Manila" }) : undefined,
    hoursUntilCancellation,
    cancellationDeadline: formatManilaDateTime(deadline),
  };
}

export async function processPendingOrderExpirations(now = new Date()): Promise<PendingOrderExpirationSummary> {
  const summary: PendingOrderExpirationSummary = {
    checked: 0,
    warningsSent: 0,
    warningFailures: 0,
    autoCancelled: 0,
    cancellationEmailsSent: 0,
    cancellationEmailFailures: 0,
    skippedNoEmail: 0,
    skippedInvalidDate: 0,
  };

  const orders = await getAllOrders(false);
  const pendingOrders = orders.filter((order) => order.status === "PENDING");
  summary.checked = pendingOrders.length;

  for (const order of pendingOrders) {
    if (!order.id) {
      summary.skippedInvalidDate += 1;
      continue;
    }

    const createdAt = toDate(order.createdAt);
    if (!createdAt || Number.isNaN(createdAt.getTime())) {
      summary.skippedInvalidDate += 1;
      continue;
    }

    const ageHours = (now.getTime() - createdAt.getTime()) / MS_PER_HOUR;
    const cancellationDeadline = new Date(createdAt.getTime() + CANCEL_AFTER_HOURS * MS_PER_HOUR);

    if (ageHours >= CANCEL_AFTER_HOURS) {
      await updateOrder(order.id, {
        status: "CANCELLED",
        archived: true,
        archivedAt: now,
        autoCancelledAt: now,
        cancellationReason: SYSTEM_CANCELLATION_REASON,
      });
      summary.autoCancelled += 1;

      if (!order.email) {
        summary.skippedNoEmail += 1;
        continue;
      }

      const result = await sendOrderCancelledEmail({
        ...getEmailPayload(order, cancellationDeadline),
        cancellationReason: "It was automatically cancelled because it stayed pending for 24 hours.",
      });

      if (result.success) {
        summary.cancellationEmailsSent += 1;
      } else {
        summary.cancellationEmailFailures += 1;
      }

      continue;
    }

    if (ageHours >= WARNING_AFTER_HOURS && !order.pendingCancellationWarningSentAt) {
      if (!order.email) {
        summary.skippedNoEmail += 1;
        continue;
      }

      const hoursUntilCancellation = Math.max(1, Math.ceil(CANCEL_AFTER_HOURS - ageHours));
      const result = await sendOrderCancellationWarningEmail(
        getEmailPayload(order, cancellationDeadline, hoursUntilCancellation)
      );

      if (result.success) {
        await updateOrder(order.id, {
          pendingCancellationWarningSentAt: now,
        });
        summary.warningsSent += 1;
      } else {
        summary.warningFailures += 1;
      }
    }
  }

  return summary;
}
