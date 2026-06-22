import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

import { ContactForm } from "@/components/storefront/contact-form";

export const metadata: Metadata = {
  title: "Contact us",
  description: "Get in touch with Bahari Click — we’re here to help with orders and enquiries.",
  alternates: { canonical: "/contact" },
};

const INFO = [
  { icon: Phone, label: "Phone / WhatsApp", value: "+880 1XXX-XXXXXX" },
  { icon: Mail, label: "Email", value: "support@bahari.click" },
  { icon: MapPin, label: "Address", value: "Dhaka, Bangladesh" },
  { icon: Clock, label: "Hours", value: "Sat–Thu, 10am–8pm" },
];

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Contact us</h1>
      <p className="text-muted-foreground mt-2 text-balance">
        Questions about an order or a product? Send us a message and we’ll get back to you.
      </p>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_18rem]">
        <ContactForm />

        <aside className="h-fit space-y-5 rounded-2xl border p-5">
          <h2 className="font-semibold">Reach us directly</h2>
          <ul className="space-y-4">
            {INFO.map(({ icon: Icon, label, value }) => (
              <li key={label} className="flex items-start gap-3">
                <span className="bg-brand/10 text-brand flex size-9 shrink-0 items-center justify-center rounded-full">
                  <Icon className="size-[18px]" />
                </span>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-muted-foreground text-sm">{value}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
