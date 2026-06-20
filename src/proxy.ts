import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Optimistic edge guard for /admin: redirect unauthenticated users to login.
// This only checks for a session cookie's presence (fast, no DB on edge).
// The authoritative role check (OWNER/MANAGER/STAFF vs CUSTOMER) happens in the
// admin layout via requireAdmin(), which can read the DB.
export default function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Guard everything under /admin except the login page itself.
  matcher: ["/admin/((?!login).*)"],
};
