"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, ClipboardList } from "lucide-react";

import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { notifyPreOrderAction, setPreOrderStatusAction } from "@/server/actions/preorder";
import type { PreOrderListItem } from "@/server/services/preorder";

type StatusFilter = "all" | "pending" | "notified" | "fulfilled" | "cancelled";

const STATUS_BADGE: Record<string, "secondary" | "info" | "success" | "destructive"> = {
  pending: "secondary",
  notified: "info",
  fulfilled: "success",
  cancelled: "destructive",
};

function variantLabel(v: PreOrderListItem["variant"]): string {
  if (!v) return "Any variant";
  return [v.color, v.size].filter(Boolean).join(" · ") || v.sku;
}

export function PreOrdersTable({ requests }: { requests: PreOrderListItem[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const counts = useMemo(() => {
    const c = { pending: 0, notified: 0 };
    for (const r of requests) {
      if (r.status === "pending") c.pending++;
      if (r.status === "notified") c.notified++;
    }
    return c;
  }, [requests]);

  const filtered = useMemo(
    () => (status === "all" ? requests : requests.filter((r) => r.status === status)),
    [requests, status],
  );

  async function notify(id: string) {
    setPendingId(id);
    const res = await notifyPreOrderAction(id);
    setPendingId(null);
    if (!res.ok) return toast.error("Could not notify", res.error.message);
    toast.success("Marked restocked", "Customer notification queued.");
    router.refresh();
  }

  async function transition(id: string, next: "fulfilled" | "cancelled") {
    setPendingId(id);
    const res = await setPreOrderStatusAction(id, next);
    setPendingId(null);
    if (!res.ok) return toast.error("Could not update", res.error.message);
    toast.success(next === "fulfilled" ? "Marked fulfilled" : "Cancelled");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Pre-orders"
        description={`${counts.pending} pending · ${counts.notified} awaiting fulfilment`}
      >
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="notified">Notified</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {requests.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No pre-order requests"
          description="Notify-me requests for out-of-stock variants will appear here."
        />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-px"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const busy = pendingId === r.id;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.product.title}</TableCell>
                    <TableCell>{variantLabel(r.variant)}</TableCell>
                    <TableCell>
                      <div>{r.name ?? "—"}</div>
                      <div className="text-muted-foreground text-xs">{r.phone}</div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.qty}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(r.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[r.status]} className="capitalize">
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {r.status === "pending" && (
                          <>
                            <Button size="sm" disabled={busy} onClick={() => notify(r.id)}>
                              <BellRing />
                              Restocked
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              onClick={() => transition(r.id, "cancelled")}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                        {r.status === "notified" && (
                          <>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={busy}
                              onClick={() => transition(r.id, "fulfilled")}
                            >
                              Mark fulfilled
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              onClick={() => transition(r.id, "cancelled")}
                            >
                              Cancel
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-muted-foreground py-10 text-center">
                    No requests with this status.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
