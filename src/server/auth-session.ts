import { headers } from "next/headers";

import { auth, ADMIN_ROLES, type AppRole } from "@/lib/auth";
import { forbidden, unauthorized } from "@/lib/errors";

// Server-side session helpers for RSC, Server Actions, and Route Handlers.

export async function getSession() {
  return auth.api.getSession({ headers: await headers() });
}

export function isAdminRole(role: string | null | undefined): boolean {
  return !!role && (ADMIN_ROLES as readonly string[]).includes(role);
}

/** Require any authenticated user; throws AppError otherwise. */
export async function requireUser() {
  const session = await getSession();
  if (!session) throw unauthorized("You must be signed in.");
  return session;
}

/** Require an admin staff member (OWNER/MANAGER/STAFF). */
export async function requireAdmin(roles: readonly AppRole[] = ADMIN_ROLES) {
  const session = await requireUser();
  const role = session.user.role ?? "";
  if (!isAdminRole(role) || !(roles as readonly string[]).includes(role)) {
    throw forbidden("Admin access required.");
  }
  return session;
}
