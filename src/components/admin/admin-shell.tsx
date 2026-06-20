"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/admin/brand";
import { SidebarNav } from "@/components/admin/sidebar-nav";
import { UserMenu, type AdminUser } from "@/components/admin/user-menu";
import { NAV_GROUPS, type AdminRole } from "@/components/admin/nav";

function pageTitle(pathname: string): string {
  for (const group of NAV_GROUPS) {
    for (const item of group.items) {
      if (item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href)) {
        return item.label;
      }
    }
  }
  return "Admin";
}

export function AdminShell({ user, children }: { user: AdminUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const role = user.role as AdminRole;
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="bg-muted/30 flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="bg-sidebar text-sidebar-foreground sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r lg:flex">
        <div className="flex h-16 items-center border-b px-4">
          <Brand />
        </div>
        <SidebarNav role={role} />
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/40 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "bg-sidebar text-sidebar-foreground absolute inset-y-0 left-0 flex w-64 flex-col border-r shadow-xl transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-16 items-center justify-between border-b px-4">
            <Brand />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X />
            </Button>
          </div>
          <SidebarNav role={role} onNavigate={() => setMobileOpen(false)} />
        </aside>
      </div>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/80 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </Button>
          <h1 className="flex-1 truncate text-base font-semibold tracking-tight">
            {pageTitle(pathname)}
          </h1>
          <UserMenu user={user} />
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
