import { db } from "@/lib/db";

// Customer account: order history (a query on Order.customerId).

export async function getCustomerOrders(customerId: string) {
  return db.order.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      createdAt: true,
      trackingCode: true,
      _count: { select: { items: true } },
    },
  });
}

export async function getCustomerOrderDetail(customerId: string, orderNumber: string) {
  return db.order.findFirst({
    where: { customerId, orderNumber },
    include: {
      items: true,
      zone: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      payments: { select: { status: true, amount: true, provider: true, createdAt: true } },
    },
  });
}
