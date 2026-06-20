"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, LogOut } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type AdminUser = {
  name: string;
  email: string;
  role: string;
};

function initials(name: string, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function UserMenu({ user }: { user: AdminUser }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function onSignOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="hover:bg-accent focus-visible:ring-ring/50 flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors outline-none focus-visible:ring-3">
        <Avatar>
          <AvatarFallback>{initials(user.name, user.email)}</AvatarFallback>
        </Avatar>
        <div className="hidden text-left leading-tight sm:block">
          <p className="max-w-[10rem] truncate text-sm font-medium">{user.name || user.email}</p>
          <p className="text-muted-foreground text-xs capitalize">{user.role.toLowerCase()}</p>
        </div>
        <ChevronsUpDown className="text-muted-foreground size-4 shrink-0" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[14rem]">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-medium">{user.name || "Admin"}</span>
          <span className="text-muted-foreground truncate text-xs font-normal">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={signingOut}
          onSelect={(e) => {
            e.preventDefault();
            void onSignOut();
          }}
        >
          <LogOut />
          {signingOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
