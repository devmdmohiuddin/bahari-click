import type { Metadata } from "next";

import { InfoPage } from "@/components/storefront/info-page";

export const metadata: Metadata = {
  title: "About",
  description: "About Bahari Click — quality products delivered across Bangladesh.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <InfoPage
      title="About Bahari Click"
      intro="Bahari Click brings you a carefully picked selection of quality products, delivered to your door anywhere in Bangladesh."
    >
      <p>
        We started Bahari Click with a simple idea: make online shopping in Bangladesh easy and
        trustworthy. Browse, click, and pay cash when your order arrives — no upfront payment, no
        hassle.
      </p>
      <h2>What we stand for</h2>
      <ul>
        <li>Honest pricing and genuine products</li>
        <li>Fast, nationwide cash-on-delivery shipping</li>
        <li>Friendly support before and after you buy</li>
        <li>Easy 7-day returns if something isn’t right</li>
      </ul>
      <p>
        Have a question or feedback? We’d love to hear from you — visit our contact page any time.
      </p>
    </InfoPage>
  );
}
