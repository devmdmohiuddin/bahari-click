"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/storefront/brand";
import { SearchBar } from "@/components/storefront/search-bar";
import { CartButton } from "@/components/storefront/cart-button";
import { MobileNav } from "@/components/storefront/mobile-nav";
import { PRIMARY_NAV } from "@/components/storefront/nav";

export function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Announcement bar — on-brand, reinforces the COD promise. */}
      <div className="bg-brand text-brand-foreground text-center text-xs font-medium tracking-wide">
        <p className="px-4 py-2">🚚 Free returns · Cash on delivery across Bangladesh</p>
      </div>

      <header className="bg-background/85 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </Button>

          <Brand href="/" />

          {/* Desktop primary nav */}
          <nav className="ml-2 hidden items-center gap-1 lg:flex">
            {PRIMARY_NAV.map((link) => {
              const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-full px-3 py-2 text-sm font-medium transition-colors",
                    active ? "text-brand" : "text-foreground hover:bg-muted",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop search slot */}
          <div className="ml-auto hidden max-w-md flex-1 md:block">
            <SearchBar />
          </div>

          <CartButton className="ml-auto md:ml-2" />
        </div>

        {/* Mobile search row */}
        <div className="border-t px-4 py-2.5 md:hidden">
          <SearchBar />
        </div>
      </header>

      <MobileNav open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}
