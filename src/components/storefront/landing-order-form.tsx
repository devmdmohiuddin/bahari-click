"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatBdt } from "@/lib/format";
import { saveLastOrder } from "@/lib/last-order";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { placeOrderAction } from "@/server/actions/order";

export type LandingVariant = { id: string; label: string; price: number; stock: number };
type Zone = { id: string; name: string; fee: number; freeShipThreshold: number | null };

// Minimal single-step COD form for FB-ad landing pages — one product, fast.
export function LandingOrderForm({
  variants,
  zones,
}: {
  variants: LandingVariant[];
  zones: Zone[];
}) {
  const router = useRouter();
  const inStock = variants.filter((v) => v.stock > 0);
  const [variantId, setVariantId] = useState(inStock[0]?.id ?? variants[0]?.id ?? "");
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [zoneId, setZoneId] = useState("");
  const [placing, startPlacing] = useTransition();

  const variant = useMemo(
    () => variants.find((v) => v.id === variantId) ?? null,
    [variants, variantId],
  );
  const zone = zones.find((z) => z.id === zoneId) ?? null;
  const subtotal = (variant?.price ?? 0) * qty;
  const shippingFee =
    zone == null
      ? 0
      : zone.freeShipThreshold != null && subtotal >= zone.freeShipThreshold
        ? 0
        : zone.fee;
  const total = subtotal + shippingFee;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!variant) return;
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast.error("Please fill in your name, phone and address");
      return;
    }
    if (!zoneId) {
      toast.error("Please select your delivery area");
      return;
    }
    startPlacing(async () => {
      const res = await placeOrderAction({
        items: [{ variantId: variant.id, qty }],
        customer: { name: name.trim(), phone: phone.trim(), address: address.trim() },
        zoneId,
      });
      if (res.ok) {
        saveLastOrder({
          orderNumber: res.data.orderNumber,
          total: res.data.total,
          phone: phone.trim(),
          name: name.trim(),
          metaEventId: res.data.metaEventId,
        });
        router.push(`/checkout/success?o=${encodeURIComponent(res.data.orderNumber)}`);
      } else {
        toast.error("Couldn’t place order", res.error.message);
      }
    });
  }

  return (
    <form onSubmit={submit} className="bg-card space-y-4 rounded-2xl border p-5 shadow-sm">
      <p className="font-heading text-lg font-bold">Order now — Cash on delivery</p>

      {variants.length > 1 && (
        <div className="space-y-1.5">
          <Label>Choose option</Label>
          <Select value={variantId} onValueChange={setVariantId}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {variants.map((v) => (
                <SelectItem key={v.id} value={v.id} disabled={v.stock <= 0}>
                  {v.label} — {formatBdt(v.price)}
                  {v.stock <= 0 ? " (out of stock)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Label className="shrink-0">Quantity</Label>
        <div className="flex items-center rounded-full border">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            disabled={qty <= 1}
            aria-label="Decrease quantity"
            className="hover:text-brand flex size-10 items-center justify-center disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <span className="w-8 text-center text-sm font-semibold tabular-nums">{qty}</span>
          <button
            type="button"
            onClick={() => setQty((q) => Math.min(variant?.stock || 1, q + 1))}
            disabled={!variant || qty >= variant.stock}
            aria-label="Increase quantity"
            className="hover:text-brand flex size-10 items-center justify-center disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
        />
        <Input
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (01XXXXXXXXX)"
          autoComplete="tel"
        />
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Full delivery address"
          autoComplete="street-address"
        />
        <Select value={zoneId} onValueChange={setZoneId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select delivery area" />
          </SelectTrigger>
          <SelectContent>
            {zones.map((z) => (
              <SelectItem key={z.id} value={z.id}>
                {z.name} — {z.fee === 0 ? "Free" : formatBdt(z.fee)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1 border-t pt-3 text-sm">
        <Row label="Subtotal" value={formatBdt(subtotal)} />
        <Row
          label="Delivery"
          value={zone == null ? "—" : shippingFee === 0 ? "Free" : formatBdt(shippingFee)}
        />
        <div className="flex justify-between pt-1 text-base font-bold">
          <span>Total (COD)</span>
          <span className="font-heading text-brand">{formatBdt(total)}</span>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={placing || !variant}>
        {placing ? <Loader2 className="animate-spin" /> : <Lock />}
        {placing ? "Placing order…" : "Confirm order (Cash on delivery)"}
      </Button>
    </form>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex justify-between", className)}>
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
