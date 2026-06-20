import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/server/auth-session";

// Authoritative admin guard. Middleware does the fast cookie check; here we read
// the real session and enforce the role (customers are sent to login).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  if (!session) {
    redirect("/admin/login");
  }
  if (!isAdminRole(session.user.role)) {
    redirect("/admin/login?error=forbidden");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <span className="font-semibold">Bahari Click · Admin</span>
        <span className="text-muted-foreground text-sm">
          {session.user.name} · {session.user.role}
        </span>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
