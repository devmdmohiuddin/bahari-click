"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, MessageSquareText, PackageSearch } from "lucide-react";

import { formatBdt } from "@/lib/format";
import { readLastOrder, type LastOrder } from "@/lib/last-order";
import { trackPurchase } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

export function CheckoutSuccess({ orderNumber }: { orderNumber: string | null }) {
  const [last, setLast] = useState<LastOrder | null>(null);

  // Read the sessionStorage handoff after mount (server renders null) to keep
  // hydration consistent, and fire the Purchase pixel once (deduped with the
  // server CAPI via metaEventId — S5.2).
  const purchaseFired = useRef(false);
  useEffect(() => {
    const stored = readLastOrder();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLast(stored);
    if (stored && !purchaseFired.current) {
      purchaseFired.current = true;
      trackPurchase({
        eventId: stored.metaEventId,
        orderNumber: stored.orderNumber,
        value: stored.total,
      });
    }
  }, []);

  // Prefer the live query param; fall back to the stored handoff.
  const number = orderNumber ?? last?.orderNumber ?? null;
  const trackHref = number
    ? `/track?order=${encodeURIComponent(number)}${last?.phone ? `&phone=${encodeURIComponent(last.phone)}` : ""}`
    : "/track";

  return (
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center px-4 py-16 text-center sm:py-24">
      <span className="bg-success/10 text-success flex size-16 items-center justify-center rounded-full">
        <CheckCircle2 className="size-9" />
      </span>

      <h1 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
        Thank you{last?.name ? `, ${last.name.split(" ")[0]}` : ""}!
      </h1>
      <p className="text-muted-foreground mt-2 text-balance">
        Your order has been placed. Pay cash on delivery when it arrives.
      </p>

      {number && (
        <div className="bg-muted/40 mt-6 w-full rounded-2xl border p-5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Order number</span>
            <span className="font-heading font-bold">{number}</span>
          </div>
          {last?.total != null && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Total (COD)</span>
              <span className="font-heading font-bold">{formatBdt(last.total)}</span>
            </div>
          )}
        </div>
      )}

      <p className="text-muted-foreground mt-5 flex items-center justify-center gap-2 text-sm">
        <MessageSquareText className="text-brand size-4" />
        You’ll get an SMS confirmation shortly.
      </p>

      <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Button asChild size="lg">
          <Link href={trackHref}>
            <PackageSearch />
            Track your order
          </Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    </div>
  );
}
