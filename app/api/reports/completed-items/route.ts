import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause on the related order
    const orderWhere: any = { status: 'COMPLETED', archived: false };
    if (dateFrom) {
      const from = new Date(dateFrom);
      if (!isNaN(from.getTime())) orderWhere.createdAt = { ...(orderWhere.createdAt || {}), gte: from };
    }
    if (dateTo) {
      const to = new Date(dateTo);
      if (!isNaN(to.getTime())) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
          to.setHours(23, 59, 59, 999);
        }
        orderWhere.createdAt = { ...(orderWhere.createdAt || {}), lte: to };
      }
    }

    // First, get all completed orders in the range for summary stats
    const completedOrders = await prisma.order.findMany({
      where: orderWhere,
      include: { items: true }
    });

    // Use Prisma groupBy to aggregate by item name using DB-calculated sums
    const groups = await prisma.orderItem.groupBy({
      by: ['name'],
      where: {
        order: orderWhere,
      },
      _sum: {
        quantity: true,
        lineTotal: true,
      },
      _count: {
        name: true,
      },
      orderBy: { _sum: { lineTotal: 'desc' } },
    });

    const items = groups.map(g => ({
      name: g.name,
      qty: g._sum.quantity ?? 0,
      total: Number(g._sum.lineTotal ?? 0),
      timesOrdered: g._count.name ?? 0,
    }));

    const grandTotal = items.reduce((s, x) => s + x.total, 0);

    return NextResponse.json({
      items,
      grandTotal,
      orderCount: completedOrders.length,
      uniqueCustomers: new Set(completedOrders.map(o => o.customer).filter(Boolean)).size,
    });
  } catch (e) {
    console.error('Failed to aggregate completed items:', e);
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}

