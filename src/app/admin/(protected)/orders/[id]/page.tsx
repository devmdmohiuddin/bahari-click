import { notFound } from "next/navigation";

import { getOrderById } from "@/server/services/order";
import { OrderDetail } from "@/components/admin/orders/order-detail";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id).catch(() => null);
  if (!order) notFound();

  return <OrderDetail order={order} />;
}
