"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Lock, Tag, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatBdt } from "@/lib/format";
import { saveLastOrder } from "@/lib/last-order";
import { trackInitiateCheckout } from "@/lib/analytics";
import { useCartStore } from "@/lib/cart-store";
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
import { validateCouponAction } from "@/server/actions/coupon";

type Zone = { id: string; name: string; fee: number; freeShipThreshold: number | null };
type AppliedCoupon = { code: string; discount: number };

export function CheckoutForm({ zones }: { zones: Zone[] }) {
  const router = useRouter();
  const hydrated = useCartStore((s) => s.hydrated);
  const items = useCartStore((s) => s.items);
  const clear = useCartStore((s) => s.clear);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [zoneId, setZoneId] = useState("");

  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [applying, setApplying] = useState(false);

  const [placing, startPlacing] = useTransition();

  // Can't check out an empty cart — bounce back once we know the cart is empty.
  useEffect(() => {
    if (hydrated && items.length === 0) router.replace("/cart");
  }, [hydrated, items.length, router]);

  // InitiateCheckout once the cart is loaded (S5.2).
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (checkoutTracked.current || !hydrated || items.length === 0) return;
    checkoutTracked.current = true;
    trackInitiateCheckout(
      items.reduce((s, i) => s + i.price * i.qty, 0),
      items.reduce((n, i) => n + i.qty, 0),
    );
  }, [hydrated, items]);

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const zone = zones.find((z) => z.id === zoneId) ?? null;
  const shippingFee =
    zone == null
      ? 0
      : zone.freeShipThreshold != null && subtotal >= zone.freeShipThreshold
        ? 0
        : zone.fee;
  const discount = coupon?.discount ?? 0;
  const total = Math.max(0, subtotal - discount) + shippingFee;

  async function applyCoupon() {
    const code = couponInput.trim();
    if (!code) return;
    setApplying(true);
    const res = await validateCouponAction({ code, subtotal });
    setApplying(false);
    if (res.ok) {
      setCoupon({ code: res.data.code, discount: res.data.discount });
      toast.success("Coupon applied", `You saved ${formatBdt(res.data.discount)}`);
    } else {
      setCoupon(null);
      toast.error("Invalid coupon", res.error.message);
    }
  }

  function removeCoupon() {
    setCoupon(null);
    setCouponInput("");
  }

  function placeOrder(e: React.FormEvent) {
    e.preventDefault();
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
        items: items.map((i) => ({ variantId: i.variantId, qty: i.qty })),
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          area: area.trim() || undefined,
        },
        zoneId,
        couponCode: coupon?.code,
      });

      if (res.ok) {
        saveLastOrder({
          orderNumber: res.data.orderNumber,
          total: res.data.total,
          phone: phone.trim(),
          name: name.trim(),
          metaEventId: res.data.metaEventId,
        });
        clear();
        router.push(`/checkout/success?o=${encodeURIComponent(res.data.orderNumber)}`);
      } else {
        toast.error("Couldn’t place order", res.error.message);
      }
    });
  }

  if (!hydrated || items.length === 0) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="text-muted-foreground size-6 animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={placeOrder} className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
      {/* Left: details */}
      <div className="space-y-6">
        <section className="space-y-4 rounded-2xl border p-5">
          <h2 className="font-semibold">Contact</h2>
          <div className="space-y-1.5">
            <Label htmlFor="co-name">Full name</Label>
            <Input
              id="co-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="co-phone">Phone number</Label>
            <Input
              id="co-phone"
              type="tel"
              inputMode="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              autoComplete="tel"
            />
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border p-5">
          <h2 className="font-semibold">Delivery address</h2>
          <div className="space-y-1.5">
            <Label htmlFor="co-address">Address</Label>
            <Input
              id="co-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House, road, area"
              autoComplete="street-address"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="co-area">Area / Thana (optional)</Label>
              <Input id="co-area" value={area} onChange={(e) => setArea(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Delivery zone</Label>
              <Select value={zoneId} onValueChange={setZoneId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your area" />
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
          </div>
        </section>
      </div>

      {/* Right: order summary */}
      <div className="h-fit space-y-4 rounded-2xl border p-5 lg:sticky lg:top-24">
        <h2 className="font-semibold">Order summary</h2>

        <ul className="space-y-3">
          {items.map((i) => (
            <li key={i.variantId} className="flex justify-between gap-3 text-sm">
              <span className="min-w-0">
                <span className="line-clamp-1">{i.name}</span>
                <span className="text-muted-foreground text-xs">
                  {i.variantLabel ? `${i.variantLabel} · ` : ""}Qty {i.qty}
                </span>
              </span>
              <span className="font-medium whitespace-nowrap">{formatBdt(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>

        {/* Coupon */}
        <div className="border-t pt-4">
          {coupon ? (
            <div className="bg-success/5 border-success/30 flex items-center justify-between rounded-xl border px-3 py-2 text-sm">
              <span className="text-success flex items-center gap-1.5 font-medium">
                <Tag className="size-3.5" /> {coupon.code}
              </span>
              <button type="button" onClick={removeCoupon} aria-label="Remove coupon">
                <X className="text-muted-foreground hover:text-foreground size-4" />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="Coupon code"
                className="h-9"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applyCoupon}
                disabled={applying || !couponInput.trim()}
              >
                {applying ? "…" : "Apply"}
              </Button>
            </div>
          )}
        </div>

        {/* Totals */}
        <div className="space-y-2 border-t pt-4 text-sm">
          <Row label="Subtotal" value={formatBdt(subtotal)} />
          {discount > 0 && (
            <Row label="Discount" value={`− ${formatBdt(discount)}`} className="text-success" />
          )}
          <Row
            label="Delivery"
            value={zone == null ? "—" : shippingFee === 0 ? "Free" : formatBdt(shippingFee)}
          />
          <div className="flex items-center justify-between border-t pt-2 text-base font-bold">
            <span>Total</span>
            <span className="font-heading">{formatBdt(total)}</span>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={placing}>
          {placing ? <Loader2 className="animate-spin" /> : <Lock />}
          {placing ? "Placing order…" : "Place order"}
        </Button>

        <p className="text-muted-foreground flex items-center justify-center gap-1.5 text-xs">
          <CheckCircle2 className="text-success size-3.5" />
          Cash on delivery — pay when it arrives
        </p>
      </div>
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
