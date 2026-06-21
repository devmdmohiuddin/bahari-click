import type { Metadata } from "next";

import { CheckoutSuccess } from "@/components/storefront/checkout-success";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ o?: string }>;
}) {
  const { o } = await searchParams;
  return <CheckoutSuccess orderNumber={o ?? null} />;
}
