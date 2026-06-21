"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, MapPin, Pencil, ShieldAlert, Trash2 } from "lucide-react";

import { formatBdt, formatDate } from "@/lib/format";
import {
  EDITABLE_STATUSES,
  ORDER_TRANSITIONS,
  STATUS_LABEL,
  type OrderStatusValue,
} from "@/lib/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { PageHeader } from "@/components/admin/page-header";
import { FraudBadge, OrderStatusBadge } from "@/components/admin/orders/status-badge";
import {
  editOrderItemsAction,
  setOrderNoteAction,
  updateOrderStatusAction,
} from "@/server/actions/order";
import type { AdminOrderDetail } from "@/server/services/order";

const DESTRUCTIVE: OrderStatusValue[] = ["cancelled", "returned"];

function actionLabel(next: OrderStatusValue): string {
  if (next === "confirmed") return "Confirm order";
  if (next === "cancelled") return "Cancel order";
  return `Mark ${STATUS_LABEL[next].toLowerCase()}`;
}

export function OrderDetail({ order }: { order: AdminOrderDetail }) {
  const router = useRouter();
  const status = order.status as OrderStatusValue;
  const transitions = ORDER_TRANSITIONS[status];
  const canEdit = EDITABLE_STATUSES.includes(status);

  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [qty, setQty] = useState<Record<string, number>>(
    Object.fromEntries(order.items.map((i) => [i.id, i.qty])),
  );
  const [note, setNote] = useState(order.internalNote ?? "");

  async function changeStatus(next: OrderStatusValue) {
    setBusy(true);
    const res = await updateOrderStatusAction(order.id, next);
    setBusy(false);
    if (!res.ok) return toast.error("Could not update status", res.error.message);
    toast.success(`Order ${STATUS_LABEL[next].toLowerCase()}`);
    router.refresh();
  }

  async function saveItems() {
    const edits = order.items
      .filter((i) => qty[i.id] !== i.qty)
      .map((i) => ({ orderItemId: i.id, qty: qty[i.id] }));
    if (edits.length === 0) {
      setEditing(false);
      return;
    }
    setBusy(true);
    const res = await editOrderItemsAction(order.id, edits);
    setBusy(false);
    if (!res.ok) return toast.error("Could not save items", res.error.message);
    toast.success("Order items updated");
    setEditing(false);
    router.refresh();
  }

  async function saveNote() {
    setBusy(true);
    const res = await setOrderNoteAction(order.id, note);
    setBusy(false);
    if (!res.ok) return toast.error("Could not save note", res.error.message);
    toast.success("Note saved");
    router.refresh();
  }

  // Live preview of subtotal while editing.
  const previewSubtotal = order.items.reduce(
    (sum, i) => sum + i.unitPrice * (editing ? (qty[i.id] ?? 0) : i.qty),
    0,
  );
  const previewDiscount = Math.min(order.discount, previewSubtotal);
  const previewTotal = previewSubtotal - previewDiscount + order.shippingFee;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title={order.orderNumber} description={`Placed ${formatDate(order.createdAt)}`}>
        <Button variant="outline" asChild>
          <Link href="/admin/orders">
            <ArrowLeft />
            Back
          </Link>
        </Button>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Items */}
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Items</CardTitle>
              {canEdit &&
                (editing ? (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={busy}
                      onClick={() => {
                        setQty(Object.fromEntries(order.items.map((i) => [i.id, i.qty])));
                        setEditing(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" disabled={busy} onClick={saveItems}>
                      {busy && <Loader2 className="animate-spin" />}
                      Save
                    </Button>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                    <Pencil />
                    Edit items
                  </Button>
                ))}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Unit</TableHead>
                    <TableHead className="text-center">Qty</TableHead>
                    <TableHead className="text-right">Line total</TableHead>
                    {editing && <TableHead className="w-10"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item) => {
                    const q = editing ? (qty[item.id] ?? 0) : item.qty;
                    return (
                      <TableRow key={item.id} className={editing && q === 0 ? "opacity-50" : ""}>
                        <TableCell>
                          <div className="font-medium">{item.productTitle}</div>
                          <div className="text-muted-foreground text-xs">{item.variantLabel}</div>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatBdt(item.unitPrice)}
                        </TableCell>
                        <TableCell className="text-center">
                          {editing ? (
                            <Input
                              type="number"
                              min={0}
                              value={qty[item.id] ?? 0}
                              onChange={(e) =>
                                setQty((m) => ({
                                  ...m,
                                  [item.id]: Math.max(0, Number(e.target.value) || 0),
                                }))
                              }
                              className="mx-auto h-8 w-20 text-center"
                            />
                          ) : (
                            <span className="tabular-nums">{item.qty}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatBdt(item.unitPrice * q)}
                        </TableCell>
                        {editing && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setQty((m) => ({ ...m, [item.id]: 0 }))}
                              aria-label="Remove item"
                            >
                              <Trash2 />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <Separator className="my-4" />

              <dl className="ml-auto max-w-xs space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="tabular-nums">{formatBdt(previewSubtotal)}</dd>
                </div>
                {previewDiscount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">
                      Discount{order.coupon ? ` (${order.coupon.code})` : ""}
                    </dt>
                    <dd className="text-success tabular-nums">−{formatBdt(previewDiscount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Shipping ({order.zone.name})</dt>
                  <dd className="tabular-nums">{formatBdt(order.shippingFee)}</dd>
                </div>
                <Separator className="my-1" />
                <div className="flex justify-between text-base font-semibold">
                  <dt>Total</dt>
                  <dd className="tabular-nums">{formatBdt(previewTotal)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Status history */}
          <Card>
            <CardHeader>
              <CardTitle>Status history</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-4">
                {order.statusHistory.map((h) => (
                  <li key={h.id} className="flex gap-3">
                    <div className="bg-brand mt-1.5 size-2 shrink-0 rounded-full" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <OrderStatusBadge status={h.status as OrderStatusValue} />
                        <span className="text-muted-foreground text-xs">
                          {formatDate(h.createdAt)}
                        </span>
                      </div>
                      {h.note && <p className="text-muted-foreground mt-1 text-sm">{h.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle>Status</CardTitle>
              <OrderStatusBadge status={status} />
            </CardHeader>
            <CardContent className="space-y-2">
              {transitions.length === 0 ? (
                <p className="text-muted-foreground text-sm">This order is in a final state.</p>
              ) : (
                transitions.map((next) =>
                  DESTRUCTIVE.includes(next) ? (
                    <AlertDialog key={next}>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="w-full" disabled={busy}>
                          {actionLabel(next)}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{actionLabel(next)}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            {next === "cancelled"
                              ? "This cancels the order and returns reserved stock to inventory."
                              : "This marks the order returned and restocks the items."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Keep order</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => changeStatus(next)}
                          >
                            {actionLabel(next)}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button
                      key={next}
                      className="w-full"
                      disabled={busy}
                      onClick={() => changeStatus(next)}
                    >
                      {actionLabel(next)}
                    </Button>
                  ),
                )
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldAlert className="size-4" /> Fraud check
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FraudBadge verdict={order.fraudVerdict} score={order.fraudScore} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="size-4" /> Customer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{order.custName}</p>
              <p className="text-muted-foreground">{order.custPhone}</p>
              <p className="text-muted-foreground">{order.custAddress}</p>
              <p className="text-muted-foreground">
                {[order.custArea, order.custCity].filter(Boolean).join(", ")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internal note</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Staff-only note about this order…"
                className="min-h-24"
              />
              <Button
                size="sm"
                variant="outline"
                disabled={busy || note === (order.internalNote ?? "")}
                onClick={saveNote}
              >
                Save note
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
