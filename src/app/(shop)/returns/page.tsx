import type { Metadata } from "next";

import { InfoPage } from "@/components/storefront/info-page";

export const metadata: Metadata = {
  title: "Returns & refunds",
  description: "Bahari Click’s 7-day return and refund policy.",
  alternates: { canonical: "/returns" },
};

export default function ReturnsPage() {
  return (
    <InfoPage
      title="Returns & refunds"
      intro="Not happy with your order? We offer easy returns within 7 days of delivery."
    >
      <h2>Eligibility</h2>
      <ul>
        <li>Request a return within 7 days of receiving your order</li>
        <li>Items must be unused and in their original packaging</li>
        <li>Proof of order (order number + phone) is required</li>
      </ul>
      <h2>How to return</h2>
      <p>
        Contact us with your order number and the reason for the return. Our team will guide you
        through the next steps and arrange pickup or drop-off.
      </p>
      <h2>Refunds</h2>
      <p>
        Once your returned item is received and checked, we’ll process your refund or replacement.
        For cash-on-delivery orders, refunds are issued via bKash/Nagad or as a replacement, as
        agreed.
      </p>
      <h2>Damaged or wrong items</h2>
      <p>
        If you received a damaged or incorrect item, let us know within 48 hours and we’ll make it
        right at no extra cost.
      </p>
    </InfoPage>
  );
}
