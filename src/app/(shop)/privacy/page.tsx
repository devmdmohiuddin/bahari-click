import type { Metadata } from "next";

import { InfoPage } from "@/components/storefront/info-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Bahari Click collects, uses, and protects your information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPage() {
  return (
    <InfoPage
      title="Privacy policy"
      intro="We respect your privacy. This policy explains what we collect and how we use it."
    >
      <h2>Information we collect</h2>
      <ul>
        <li>
          Contact details you provide at checkout or via our forms (name, phone, address, email)
        </li>
        <li>Order and delivery information needed to fulfil your purchase</li>
        <li>Basic usage analytics to improve the store</li>
      </ul>
      <h2>How we use it</h2>
      <p>
        We use your information to process and deliver orders, provide support, send order updates,
        and improve our products and service. We never sell your personal data.
      </p>
      <h2>Sharing</h2>
      <p>
        We share only what’s necessary with delivery partners (to ship your order) and SMS providers
        (to send order updates).
      </p>
      <h2>Your choices</h2>
      <p>
        You can request access to, correction of, or deletion of your information by contacting us.
      </p>
    </InfoPage>
  );
}
