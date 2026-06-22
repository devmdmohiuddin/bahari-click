"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, RotateCcw, Undo2, X } from "lucide-react";

import { formatBdt, formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import {
  approveReturnAction,
  completeReturnAction,
  rejectReturnAction,
} from "@/server/actions/returns";
import type { listReturns } from "@/server/services/returns";

type ReturnRow = Awaited<ReturnType<typeof listReturns>>[number];
type StatusFilter = "all" | "requested" | "approved" | "rejected" | "completed";

const STATUS_BADGE: Record<string, "secondary" | "info" | "success" | "destructive"> = {
  requested: "secondary",
  approved: "info",
  completed: "success",
  rejected: "destructive",
};

// Approve dialog: lets the admin confirm the refund amount (defaults to order total).
function ApproveDialog({ ret, onClose }: { ret: ReturnRow; onClose: () => void }) {
  const router = useRouter();
  const [amount, setAmount] = useState(String(ret.refundAmount ?? ret.order.total));
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(amount);
    if (!Number.isInteger(n) || n < 0) return toast.error("Enter a valid refund amount");
    setSaving(true);
    const res = await approveReturnAction(ret.id, n);
    setSaving(false);
    if (!res.ok) return toast.error("Could not approve", res.error.message);
    toast.success("Return approved", "Complete it to restock and refund.");
    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Approve return</DialogTitle>
        <DialogDescription>
          Order #{ret.order.orderNumber} · total {formatBdt(ret.order.total)}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="refund">Refund amount (৳)</Label>
        <Input
          id="refund"
          type="number"
          min={0}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoFocus
        />
        <p className="text-muted-foreground text-xs">
          Charged back when the return is completed. Defaults to the order total.
        </p>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          Approve
        </Button>
      </DialogFooter>
    </form>
  );
}

// Reject dialog: optional note explaining the rejection.
function RejectDialog({ ret, onClose }: { ret: ReturnRow; onClose: () => void }) {
  const router = useRouter();
  const [note, setNote] = useState(ret.note ?? "");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await rejectReturnAction(ret.id, note.trim() || undefined);
    setSaving(false);
    if (!res.ok) return toast.error("Could not reject", res.error.message);
    toast.success("Return rejected");
    onClose();
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <DialogHeader>
        <DialogTitle>Reject return</DialogTitle>
        <DialogDescription>Order #{ret.order.orderNumber}</DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="note">Note (optional)</Label>
        <Textarea
          id="note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Reason for rejecting this return…"
          rows={3}
          autoFocus
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" disabled={saving}>
          {saving && <Loader2 className="animate-spin" />}
          Reject
        </Button>
      </DialogFooter>
    </form>
  );
}

export function ReturnsTable({ returns }: { returns: ReturnRow[] }) {
  const router = useRouter();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ ret: ReturnRow; mode: "approve" | "reject" } | null>(null);

  const counts = useMemo(() => {
    const c = { requested: 0, approved: 0 };
    for (const r of returns) {
      if (r.status === "requested") c.requested++;
      if (r.status === "approved") c.approved++;
    }
    return c;
  }, [returns]);

  const filtered = useMemo(
    () => (status === "all" ? returns : returns.filter((r) => r.status === status)),
    [returns, status],
  );

  async function complete(id: string) {
    setPendingId(id);
    const res = await completeReturnAction(id);
    setPendingId(null);
    if (!res.ok) return toast.error("Could not complete", res.error.message);
    toast.success("Return completed", "Items restocked and payment refunded.");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Returns"
        description={`${counts.requested} awaiting review · ${counts.approved} approved`}
      >
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="requested">Requested</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {returns.length === 0 ? (
        <EmptyState
          icon={RotateCcw}
          title="No returns yet"
          description="Return requests on delivered orders will appear here for review."
        />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Refund</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="w-px"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const busy = pendingId === r.id;
                return (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">#{r.order.orderNumber}</TableCell>
                    <TableCell className="text-muted-foreground">{r.order.custPhone}</TableCell>
                    <TableCell className="max-w-xs">
                      <span className="line-clamp-2">{r.reason}</span>
                      {r.note && (
                        <span className="text-muted-foreground block text-xs">Note: {r.note}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatBdt(r.refundAmount ?? r.order.total)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_BADGE[r.status]} className="capitalize">
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(r.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        {r.status === "requested" && (
                          <>
                            <Button
                              size="sm"
                              disabled={busy}
                              onClick={() => setDialog({ ret: r, mode: "approve" })}
                            >
                              <Check />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              onClick={() => setDialog({ ret: r, mode: "reject" })}
                            >
                              <X />
                              Reject
                            </Button>
                          </>
                        )}
                        {r.status === "approved" && (
                          <>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="sm" variant="secondary" disabled={busy}>
                                  <Undo2 />
                                  Complete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Complete this return?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This restocks the items, reverses the sale, and refunds{" "}
                                    {formatBdt(r.refundAmount ?? r.order.total)} for order #
                                    {r.order.orderNumber}. This cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => complete(r.id)}>
                                    Complete return
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={busy}
                              onClick={() => setDialog({ ret: r, mode: "reject" })}
                            >
                              <X />
                              Reject
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
                    No returns with this status.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={!!dialog} onOpenChange={(open) => !open && setDialog(null)}>
        <DialogContent>
          {dialog?.mode === "approve" && (
            <ApproveDialog key={dialog.ret.id} ret={dialog.ret} onClose={() => setDialog(null)} />
          )}
          {dialog?.mode === "reject" && (
            <RejectDialog key={dialog.ret.id} ret={dialog.ret} onClose={() => setDialog(null)} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
