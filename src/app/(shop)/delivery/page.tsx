import type { Metadata } from "next";

import { InfoPage } from "@/components/storefront/info-page";

export const metadata: Metadata = {
  title: "Delivery information",
  description: "Delivery times, charges, and cash-on-delivery details for Bahari Click orders.",
  alternates: { canonical: "/delivery" },
};

export default function DeliveryPage() {
  return (
    <InfoPage
      title="Delivery information"
      intro="We deliver nationwide with cash on delivery. Here’s what to expect."
    >
      <h2>Delivery time</h2>
      <ul>
        <li>Inside Dhaka: 1–2 business days</li>
        <li>Sub-Dhaka: 2–3 business days</li>
        <li>Outside Dhaka: 3–5 business days</li>
      </ul>
      <h2>Delivery charge</h2>
      <p>
        The exact delivery charge for your area is shown at checkout before you confirm your order.
        Some orders may qualify for free delivery above a minimum amount.
      </p>
      <h2>Cash on delivery</h2>
      <p>
        You pay the courier in cash when your order arrives — there’s no need to pay anything in
        advance. Please check your items at delivery.
      </p>
      <h2>Tracking</h2>
      <p>
        Once your order is placed you’ll receive an SMS, and you can follow its progress any time on
        our order-tracking page using your order number and phone.
      </p>
    </InfoPage>
  );
}
