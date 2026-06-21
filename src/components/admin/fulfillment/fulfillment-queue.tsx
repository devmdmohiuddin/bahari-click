"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, RefreshCw, Truck } from "lucide-react";

import { formatBdt, formatDate } from "@/lib/format";
import { type OrderStatusValue } from "@/lib/orders";
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
import { toast } from "@/components/ui/toast";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { FraudBadge, OrderStatusBadge } from "@/components/admin/orders/status-badge";
import { dispatchOrderAction, syncOrderCourierAction } from "@/server/actions/dispatch";
import type { FulfillmentRow } from "@/server/services/dispatch";

export function FulfillmentQueue({
  ready,
  inTransit,
}: {
  ready: FulfillmentRow[];
  inTransit: FulfillmentRow[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function dispatch(id: string) {
    setPendingId(id);
    const res = await dispatchOrderAction(id);
    setPendingId(null);
    if (!res.ok) return toast.error("Could not dispatch", res.error.message);
    toast.success("Dispatched", `Tracking ${res.data.trackingCode}`);
    router.refresh();
  }

  async function sync(id: string) {
    setPendingId(id);
    const res = await syncOrderCourierAction(id);
    setPendingId(null);
    if (!res.ok) return toast.error("Could not sync", res.error.message);
    if (res.data.applied) toast.success("Status updated", `Courier: ${res.data.courierStatus}`);
    else toast.info("No change", `Courier status: ${res.data.courierStatus}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title="Fulfillment"
        description={`${ready.length} ready to dispatch · ${inTransit.length} in transit`}
      />

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Truck className="text-muted-foreground size-4" /> Ready to dispatch
        </h3>
        {ready.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Nothing waiting to ship"
            description="Confirmed and packed orders without a consignment appear here."
          />
        ) : (
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead className="text-right">COD</TableHead>
                  <TableHead>Fraud</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-px"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ready.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link href={`/admin/orders/${o.id}`} className="hover:text-brand font-medium">
                        {o.orderNumber}
                      </Link>
                      <div className="text-muted-foreground text-xs">
                        {o._count.items} item{o._count.items === 1 ? "" : "s"} ·{" "}
                        {formatDate(o.createdAt)}
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
                      <OrderStatusBadge status={o.status as OrderStatusValue} />
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        disabled={pendingId === o.id}
                        onClick={() => dispatch(o.id)}
                      >
                        <Truck />
                        Dispatch
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <RefreshCw className="text-muted-foreground size-4" /> In transit
        </h3>
        {inTransit.length === 0 ? (
          <EmptyState icon={Truck} title="No orders in transit" />
        ) : (
          <Card className="py-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead className="w-px"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inTransit.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>
                      <Link href={`/admin/orders/${o.id}`} className="hover:text-brand font-medium">
                        {o.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div>{o.custName}</div>
                      <div className="text-muted-foreground text-xs">{o.custPhone}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground capitalize">
                      {o.courierName ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{o.trackingCode}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pendingId === o.id}
                        onClick={() => sync(o.id)}
                      >
                        <RefreshCw />
                        Sync
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>
    </div>
  );
}
