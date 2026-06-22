"use client";

import { useMemo, useState } from "react";
import { CreditCard } from "lucide-react";

import { formatBdt, formatDateTime } from "@/lib/format";
import type { PaymentSummary } from "@/server/services/payment";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
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
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";

type PaymentStatus = PaymentSummary["status"];

type PaymentRow = {
  id: string;
  transactionId: string;
  provider: string;
  amount: number;
  status: PaymentStatus;
  cardType: string | null;
  createdAt: string;
  orderNumber: string;
  custPhone: string;
};

type StatusFilter = "all" | PaymentStatus;

const STATUS_BADGE: Record<
  PaymentStatus,
  "secondary" | "info" | "success" | "destructive" | "warning"
> = {
  pending: "warning",
  success: "success",
  failed: "destructive",
  cancelled: "secondary",
  refunded: "info",
};

const STATUSES: PaymentStatus[] = ["pending", "success", "failed", "cancelled", "refunded"];

export function PaymentsView({
  payments,
  summary,
}: {
  payments: PaymentRow[];
  summary: PaymentSummary[];
}) {
  const [status, setStatus] = useState<StatusFilter>("all");

  const byStatus = useMemo(() => {
    const map = new Map<PaymentStatus, PaymentSummary>();
    for (const s of summary) map.set(s.status, s);
    return map;
  }, [summary]);

  const filtered = useMemo(
    () => (status === "all" ? payments : payments.filter((p) => p.status === status)),
    [payments, status],
  );

  const kpis = [
    { label: "Collected", value: formatBdt(byStatus.get("success")?.amount ?? 0), accent: true },
    { label: "Pending", value: formatBdt(byStatus.get("pending")?.amount ?? 0) },
    { label: "Refunded", value: formatBdt(byStatus.get("refunded")?.amount ?? 0) },
    {
      label: "Failed / cancelled",
      value: String((byStatus.get("failed")?.count ?? 0) + (byStatus.get("cancelled")?.count ?? 0)),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader title="Payments" description="Online payment reconciliation across all orders.">
        <Select value={status} onValueChange={(v) => setStatus(v as StatusFilter)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardHeader>
              <CardDescription>{k.label}</CardDescription>
            </CardHeader>
            <CardContent>
              <p
                className={
                  "text-2xl font-bold tracking-tight tabular-nums" +
                  (k.accent ? " text-success" : "")
                }
              >
                {k.value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {payments.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No payments yet"
          description="Online payments (SSLCommerz) will appear here for reconciliation. COD orders are not charged online."
        />
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Transaction</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-xs">{p.transactionId}</TableCell>
                  <TableCell>
                    <div className="font-medium">#{p.orderNumber}</div>
                    <div className="text-muted-foreground text-xs">{p.custPhone}</div>
                  </TableCell>
                  <TableCell className="capitalize">
                    {p.provider}
                    {p.cardType && (
                      <span className="text-muted-foreground block text-xs">{p.cardType}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatBdt(p.amount)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[p.status]} className="capitalize">
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">
                    {formatDateTime(p.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground py-10 text-center">
                    No payments with this status.
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
