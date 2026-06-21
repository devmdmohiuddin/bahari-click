import Link from "next/link";
import { Banknote, ShieldCheck, Truck } from "lucide-react";

import { Brand } from "@/components/storefront/brand";

const FOOTER_COLS: { heading: string; links: { label: string; href: string }[] }[] = [
  {
    heading: "Shop",
    links: [
      { label: "All products", href: "/products" },
      { label: "Track order", href: "/track" },
    ],
  },
  {
    heading: "Help",
    links: [
      { label: "Contact us", href: "/contact" },
      { label: "Returns & refunds", href: "/returns" },
      { label: "Delivery info", href: "/delivery" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Privacy policy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

const TRUST = [
  { icon: Banknote, label: "Cash on delivery" },
  { icon: Truck, label: "Nationwide delivery" },
  { icon: ShieldCheck, label: "Easy returns" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t">
      {/* Trust strip */}
      <div className="bg-brand-tint/60">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-4 px-4 py-6 sm:grid-cols-3 sm:px-6 lg:px-8">
          {TRUST.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center justify-center gap-2.5 sm:justify-start">
              <span className="bg-brand/10 text-brand flex size-9 shrink-0 items-center justify-center rounded-full">
                <Icon className="size-[18px]" />
              </span>
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-1">
            <Brand href="/" />
            <p className="text-muted-foreground mt-4 max-w-xs text-sm">
              Quality products, delivered across Bangladesh. Order now — pay cash on delivery.
            </p>
          </div>

          {FOOTER_COLS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold">{col.heading}</h3>
              <ul className="mt-3 space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground hover:text-brand text-sm transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="text-muted-foreground mt-10 border-t pt-6 text-xs">
          © {new Date().getFullYear()} Bahari Click. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
