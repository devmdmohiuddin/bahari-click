"use client";

import { useState } from "react";
import Link from "next/link";
import { Headset, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { MESSENGER_URL, WHATSAPP_NUMBER } from "@/lib/site";

// Floating support FAB (S7). Expands to WhatsApp / Messenger when configured,
// always offering the on-site contact form as a fallback.
export function SupportButton() {
  const [open, setOpen] = useState(false);

  const channels: { label: string; href: string; external?: boolean; className: string }[] = [];
  if (WHATSAPP_NUMBER) {
    channels.push({
      label: "WhatsApp",
      href: `https://wa.me/${WHATSAPP_NUMBER}`,
      external: true,
      className: "bg-[#25D366] text-white",
    });
  }
  if (MESSENGER_URL) {
    channels.push({
      label: "Messenger",
      href: MESSENGER_URL,
      external: true,
      className: "bg-[#0084FF] text-white",
    });
  }
  channels.push({ label: "Contact form", href: "/contact", className: "bg-card border" });

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2 sm:right-6 sm:bottom-6">
      {open && (
        <div className="animate-in slide-in-from-bottom-2 fade-in flex flex-col items-end gap-2">
          {channels.map((c) =>
            c.external ? (
              <a
                key={c.label}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold shadow-md transition-transform hover:scale-105",
                  c.className,
                )}
              >
                {c.label}
              </a>
            ) : (
              <Link
                key={c.label}
                href={c.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold shadow-md transition-transform hover:scale-105",
                  c.className,
                )}
              >
                {c.label}
              </Link>
            ),
          )}
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close support menu" : "Need help?"}
        aria-expanded={open}
        className="bg-brand text-brand-foreground hover:bg-brand-hover flex size-14 items-center justify-center rounded-full shadow-lg transition-all active:scale-95"
      >
        {open ? <X className="size-6" /> : <Headset className="size-6" />}
      </button>
    </div>
  );
}
