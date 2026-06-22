import type { Metadata } from "next";

import { InfoPage } from "@/components/storefront/info-page";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description: "The terms that apply when you shop with Bahari Click.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <InfoPage
      title="Terms & conditions"
      intro="By using Bahari Click and placing an order, you agree to the following terms."
    >
      <h2>Orders</h2>
      <p>
        Placing an order is an offer to buy. We may confirm or decline an order (for example, if an
        item is out of stock or the delivery address can’t be served). Prices and availability may
        change without notice.
      </p>
      <h2>Pricing & payment</h2>
      <p>
        All prices are in Bangladeshi Taka (৳) and include applicable charges shown at checkout.
        Orders are payable by cash on delivery unless stated otherwise.
      </p>
      <h2>Delivery</h2>
      <p>
        Delivery times are estimates and may vary due to courier or location factors. Please ensure
        someone is available to receive and pay for the order.
      </p>
      <h2>Returns</h2>
      <p>Returns are handled per our returns &amp; refunds policy.</p>
      <h2>Contact</h2>
      <p>For any questions about these terms, please contact us.</p>
    </InfoPage>
  );
}
