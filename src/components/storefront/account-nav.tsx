"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Heart, LogOut, MapPin, Package } from "lucide-react";

import { cn } from "@/lib/utils";
import { authClient } from "@/lib/auth-client";

const LINKS = [
  { href: "/account", label: "My orders", icon: Package, exact: true },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
];

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
      {LINKS.map((l) => {
        const active = l.exact ? pathname === l.href : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active ? "bg-brand-tint text-brand" : "hover:bg-muted text-foreground",
            )}
          >
            <l.icon className="size-4" />
            {l.label}
          </Link>
        );
      })}
      <button
        type="button"
        onClick={signOut}
        className="text-muted-foreground hover:bg-muted hover:text-destructive flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
      >
        <LogOut className="size-4" />
        Sign out
      </button>
    </nav>
  );
}
