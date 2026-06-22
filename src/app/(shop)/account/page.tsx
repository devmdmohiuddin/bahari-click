import Link from "next/link";
import { Package } from "lucide-react";

import { getSession } from "@/server/auth-session";
import { getCustomerOrders } from "@/server/services/account";
import { formatBdt, formatDate } from "@/lib/format";
import { STATUS_BADGE, STATUS_LABEL, type OrderStatusValue } from "@/lib/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AccountOrdersPage() {
  const session = await getSession();
  const orders = session ? await getCustomerOrders(session.user.id) : [];

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border py-16 text-center">
        <Package className="text-muted-foreground/40 size-12" />
        <p className="text-muted-foreground">You haven’t placed any orders yet.</p>
        <Button asChild>
          <Link href="/products">Start shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <div
          key={o.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold">{o.orderNumber}</span>
              <Badge variant={STATUS_BADGE[o.status as OrderStatusValue]}>
                {STATUS_LABEL[o.status as OrderStatusValue] ?? o.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-xs">
              {formatDate(o.createdAt)} · {o._count.items} item{o._count.items === 1 ? "" : "s"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-heading font-bold">{formatBdt(o.total)}</span>
            <Button asChild variant="outline" size="sm">
              <Link href={`/track?order=${encodeURIComponent(o.orderNumber)}`}>Track</Link>
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
