import type { Metadata } from "next";

import { listActiveZones } from "@/server/services/shipping";
import { CheckoutForm } from "@/components/storefront/checkout-form";

export const metadata: Metadata = {
  title: "Checkout · Bahari Click",
  robots: { index: false },
};

export default async function CheckoutPage() {
  const zones = await listActiveZones();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Checkout</h1>
      <CheckoutForm
        zones={zones.map((z) => ({
          id: z.id,
          name: z.name,
          fee: z.fee,
          freeShipThreshold: z.freeShipThreshold,
        }))}
      />
    </div>
  );
}
