"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Ticket } from "lucide-react";

import { formatBdt, formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
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
import { CouponDialog, type CouponDialogState } from "@/components/admin/coupons/coupon-dialog";
import { updateCouponAction } from "@/server/actions/coupon";

export type CouponRow = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  minOrder: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startsAt: string | null;
  endsAt: string | null;
  isActive: boolean;
};

function windowLabel(c: CouponRow): string {
  if (!c.startsAt && !c.endsAt) return "Always";
  const f = (s: string | null) => (s ? formatDate(s) : "—");
  return `${f(c.startsAt)} → ${f(c.endsAt)}`;
}

export function CouponsManager({ coupons }: { coupons: CouponRow[] }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<CouponDialogState | null>(null);

  async function toggleActive(c: CouponRow, isActive: boolean) {
    const res = await updateCouponAction(c.id, { isActive });
    if (!res.ok) return toast.error("Could not update", res.error.message);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Coupons" description="Discount codes applied to the order subtotal.">
        <Button onClick={() => setDialog({ mode: "create" })}>
          <Plus />
          New coupon
        </Button>
      </PageHeader>

      {coupons.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title="No coupons yet"
          description="Create a percent or fixed-amount discount code."
        >
          <Button onClick={() => setDialog({ mode: "create" })}>
            <Plus />
            New coupon
          </Button>
        </EmptyState>
      ) : (
        <Card className="py-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Min order</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Window</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="w-px"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-mono font-medium">{c.code}</TableCell>
                  <TableCell>
                    {c.type === "percent" ? (
                      <span>
                        {c.value}%{c.maxDiscount ? ` (max ${formatBdt(c.maxDiscount)})` : ""}
                      </span>
                    ) : (
                      formatBdt(c.value)
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.minOrder ? formatBdt(c.minOrder) : "—"}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {c.usedCount}
                    {c.usageLimit ? ` / ${c.usageLimit}` : " / ∞"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs whitespace-nowrap">
                    {windowLabel(c)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex justify-center">
                      <Switch
                        checked={c.isActive}
                        onCheckedChange={(v) => toggleActive(c, v)}
                        aria-label="Toggle active"
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label="Edit coupon"
                      onClick={() => setDialog({ mode: "edit", coupon: c })}
                    >
                      <Pencil />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <CouponDialog state={dialog} onClose={() => setDialog(null)} />
    </div>
  );
}
