import { redirect } from "next/navigation";

import { getSession, isAdminRole } from "@/server/auth-session";
import { AdminShell } from "@/components/admin/admin-shell";

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
    <AdminShell
      user={{
        name: session.user.name ?? "",
        email: session.user.email,
        role: session.user.role ?? "STAFF",
      }}
    >
      {children}
    </AdminShell>
  );
}
