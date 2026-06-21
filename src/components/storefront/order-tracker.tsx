"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Loader2, PackageSearch, Search, Star } from "lucide-react";

import { formatBdt, formatDate } from "@/lib/format";
import { STATUS_BADGE, STATUS_LABEL, type OrderStatusValue } from "@/lib/orders";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackOrderAction } from "@/server/actions/order";
import { OrderTimeline } from "@/components/storefront/order-timeline";

type TrackResult = Extract<Awaited<ReturnType<typeof trackOrderAction>>, { ok: true }>["data"];

export function OrderTracker({
  initialOrderNumber,
  initialPhone,
}: {
  initialOrderNumber: string;
  initialPhone: string;
}) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState(initialPhone);
  const [result, setResult] = useState<TrackResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const autoRan = useRef(false);

  function lookup(num: string, ph: string) {
    startTransition(async () => {
      const res = await trackOrderAction({ orderNumber: num.trim(), phone: ph.trim() });
      if (res.ok) {
        setResult(res.data);
        setError(null);
      } else {
        setResult(null);
        setError(res.error.message);
      }
    });
  }

  // Auto-lookup when arriving from the confirmation page with both prefilled.
  useEffect(() => {
    if (!autoRan.current && initialOrderNumber && initialPhone) {
      autoRan.current = true;
      lookup(initialOrderNumber, initialPhone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orderNumber.trim() || !phone.trim()) {
      setError("Please enter both your order number and phone number.");
      return;
    }
    lookup(orderNumber, phone);
  }

  return (
    <div className="mt-6">
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border p-5">
        <div className="space-y-1.5">
          <Label htmlFor="track-order">Order number</Label>
          <Input
            id="track-order"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="e.g. BC-2026-0001"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="track-phone">Phone number</Label>
          <Input
            id="track-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
          />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Search />}
          {pending ? "Searching…" : "Track order"}
        </Button>
      </form>

      {error && (
        <div className="border-destructive/30 bg-destructive/5 text-destructive mt-4 rounded-xl border p-4 text-sm">
          {error}
        </div>
      )}

      {result && <ResultCard result={result} />}
    </div>
  );
}

function ResultCard({ result }: { result: TrackResult }) {
  const delivered = result.status === "delivered";
  return (
    <div className="mt-6">
      <div className="space-y-6 rounded-2xl border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-4">
          <div>
            <p className="font-heading font-bold">{result.orderNumber}</p>
            <p className="text-muted-foreground text-xs">Placed {formatDate(result.createdAt)}</p>
          </div>
          <Badge variant={STATUS_BADGE[result.status as OrderStatusValue]}>
            {STATUS_LABEL[result.status as OrderStatusValue] ?? result.status}
          </Badge>
        </div>

        <div>
          <h2 className="mb-3 text-sm font-semibold">Items</h2>
          <ul className="space-y-2">
            {result.items.map((it, i) => {
              const slug = it.variant?.product?.slug;
              return (
                <li key={i} className="flex justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    <span className="line-clamp-1">{it.productTitle}</span>
                    <span className="text-muted-foreground text-xs">
                      {it.variantLabel} · Qty {it.qty}
                    </span>
                    {/* Delivered → deep-link to the product's review form (S5.1). */}
                    {delivered && slug && (
                      <Link
                        href={`/p/${slug}?review=1`}
                        className="text-brand hover:text-brand-hover mt-1 flex w-fit items-center gap-1 text-xs font-medium"
                      >
                        <Star className="size-3" /> Write a review
                      </Link>
                    )}
                  </span>
                  <span className="font-medium whitespace-nowrap">{formatBdt(it.lineTotal)}</span>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 flex justify-between border-t pt-3 text-sm font-bold">
            <span>Total (COD)</span>
            <span className="font-heading">{formatBdt(result.total)}</span>
          </div>
        </div>

        {result.courierName && (
          <p className="text-muted-foreground text-sm">
            Courier: <span className="text-foreground font-medium">{result.courierName}</span>
            {result.trackingCode ? ` · ${result.trackingCode}` : ""}
          </p>
        )}

        <div>
          <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold">
            <PackageSearch className="text-brand size-4" /> Status timeline
          </h2>
          <OrderTimeline history={result.statusHistory} currentStatus={result.status} />
        </div>
      </div>
    </div>
  );
}
