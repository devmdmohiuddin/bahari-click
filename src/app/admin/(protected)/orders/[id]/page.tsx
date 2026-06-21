import { notFound } from "next/navigation";

import { courierTrackingUrl } from "@/lib/courier";
import { getOrderById } from "@/server/services/order";
import { listSmsForPhone } from "@/server/services/notifications";
import { OrderDetail } from "@/components/admin/orders/order-detail";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id).catch(() => null);
  if (!order) notFound();

  const smsLog = await listSmsForPhone(order.custPhone);
  const trackingUrl = courierTrackingUrl(order.courierName, order.trackingCode);

  return <OrderDetail order={order} smsLog={smsLog} trackingUrl={trackingUrl} />;
}
