"use client";

import { useState, useTransition } from "react";
import { BellRing, CheckCircle2, Minus, Plus } from "lucide-react";

import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPreOrderAction } from "@/server/actions/preorder";

// Shown in place of Add-to-cart when the selected variant is out of stock.
// Collects a phone (+ optional name/qty) and registers a PreOrderRequest so the
// shopper is texted on restock (S3.1).
export function NotifyMeForm({
  productId,
  variantId,
  variantLabel,
}: {
  productId: string;
  variantId: string | null;
  variantLabel: string;
}) {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    startTransition(async () => {
      const res = await createPreOrderAction({
        productId,
        variantId,
        phone: phone.trim(),
        name: name.trim() || undefined,
        qty,
      });
      if (res.ok) {
        setDone(true);
        toast.success("You're on the list!", "We'll text you when it's back in stock.");
      } else {
        toast.error("Couldn’t register", res.error.message);
      }
    });
  }

  if (done) {
    return (
      <div className="border-success/30 bg-success/5 flex items-start gap-3 rounded-2xl border p-4">
        <CheckCircle2 className="text-success mt-0.5 size-5 shrink-0" />
        <div className="text-sm">
          <p className="font-medium">You’re on the notify list</p>
          <p className="text-muted-foreground mt-0.5">
            We’ll send an SMS to {phone} as soon as
            {variantLabel ? ` ${variantLabel}` : " this item"} is back in stock.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-muted/40 space-y-4 rounded-2xl border p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <BellRing className="text-brand size-5" />
        <p className="text-sm font-medium">Out of stock — get notified when it’s back</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="notify-phone">Phone number</Label>
          <Input
            id="notify-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            autoComplete="tel"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Qty</Label>
          <div className="flex h-9 items-center rounded-full border">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label="Decrease quantity"
              className="hover:text-brand flex size-9 items-center justify-center disabled:opacity-40"
            >
              <Minus className="size-4" />
            </button>
            <span className="w-7 text-center text-sm font-semibold tabular-nums">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(99, q + 1))}
              disabled={qty >= 99}
              aria-label="Increase quantity"
              className="hover:text-brand flex size-9 items-center justify-center disabled:opacity-40"
            >
              <Plus className="size-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notify-name">Name (optional)</Label>
        <Input
          id="notify-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={80}
        />
      </div>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        <BellRing />
        {pending ? "Submitting…" : "Notify me"}
      </Button>
    </form>
  );
}
