import type { Metadata } from "next";

import { OrderTracker } from "@/components/storefront/order-tracker";

export const metadata: Metadata = {
  title: "Track your order",
  description: "Check the status of your Bahari Click order with your order number and phone.",
};

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; phone?: string }>;
}) {
  const { order, phone } = await searchParams;

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Track your order</h1>
      <p className="text-muted-foreground mt-2 text-sm">
        Enter your order number and the phone number you used at checkout.
      </p>
      <OrderTracker initialOrderNumber={order ?? ""} initialPhone={phone ?? ""} />
    </div>
  );
}
