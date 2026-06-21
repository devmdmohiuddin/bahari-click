import Link from "next/link";
import { ShoppingCart } from "lucide-react";

import { formatBdt, formatDate } from "@/lib/format";
import { ORDER_STATUSES, type OrderStatusValue } from "@/lib/orders";
import { listOrdersAdmin } from "@/server/services/order";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { OrderFilters } from "@/components/admin/orders/order-filters";
import { FraudBadge, OrderStatusBadge } from "@/components/admin/orders/status-badge";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function str(v: string | string[] | undefined): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const statusParam = str(sp.status);
  const status = ORDER_STATUSES.includes(statusParam as OrderStatusValue)
    ? (statusParam as OrderStatusValue)
    : undefined;
  const from = str(sp.from);
  const to = str(sp.to);
  const page = Math.max(1, Number(str(sp.page)) || 1);

  const result = await listOrdersAdmin({
    status,
    search: str(sp.q),
    from: from ? new Date(`${from}T00:00:00`) : undefined,
    to: to ? new Date(`${to}T23:59:59.999`) : undefined,
    page,
  });

  // Preserve current filters when paginating.
  const baseParams = new URLSearchParams();
  for (const k of ["q", "status", "from", "to"]) {
    const v = str(sp[k]);
    if (v) baseParams.set(k, v);
  }
  const pageHref = (p: number) => {
    const params = new URLSearchParams(baseParams);
    params.set("page", String(p));
    return `/admin/orders?${params.toString()}`;
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Orders"
        description={`${result.total} order${result.total === 1 ? "" : "s"} total`}
      />

      <OrderFilters />

      {result.items.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="No orders found"
          description="No orders match the current filters."
        />
      ) : (
        <>
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Fraud</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.items.map((o) => (
                  <TableRow key={o.id} className="cursor-pointer">
                    <TableCell>
                      <Link href={`/admin/orders/${o.id}`} className="hover:text-brand font-medium">
                        {o.orderNumber}
                      </Link>
                      <div className="text-muted-foreground text-xs">
                        {o._count.items} item{o._count.items === 1 ? "" : "s"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{o.custName}</div>
                      <div className="text-muted-foreground text-xs">{o.custPhone}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{o.zone.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatBdt(o.total)}</TableCell>
                    <TableCell>
                      <FraudBadge verdict={o.fraudVerdict} score={o.fraudScore} />
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={o.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      {formatDate(o.createdAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {result.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground text-sm">
                Page {result.page} of {result.totalPages}
              </p>
              <div className="flex gap-2">
                {result.page <= 1 ? (
                  <Button variant="outline" size="sm" disabled>
                    Previous
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={pageHref(result.page - 1)}>Previous</Link>
                  </Button>
                )}
                {result.page >= result.totalPages ? (
                  <Button variant="outline" size="sm" disabled>
                    Next
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={pageHref(result.page + 1)}>Next</Link>
                  </Button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
