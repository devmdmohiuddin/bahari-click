"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/storefront/brand";
import { SearchBar } from "@/components/storefront/search-bar";
import { PRIMARY_NAV } from "@/components/storefront/nav";

// Slide-in nav drawer for mobile/tablet. Controlled by the site header.
export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/40 transition-opacity",
          open ? "opacity-100" : "opacity-0",
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "bg-background absolute inset-y-0 left-0 flex w-[18rem] max-w-[85vw] flex-col shadow-xl transition-transform duration-200",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Brand href="/" />
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
            <X />
          </Button>
        </div>

        <div className="border-b p-4">
          <SearchBar onSubmitted={onClose} />
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {PRIMARY_NAV.map((link) => {
            const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={cn(
                  "rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-brand-tint text-brand" : "text-foreground hover:bg-muted",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <p className="text-muted-foreground mt-auto border-t p-4 text-xs">
          Cash on delivery across Bangladesh 🇧🇩
        </p>
      </aside>
    </div>
  );
}
