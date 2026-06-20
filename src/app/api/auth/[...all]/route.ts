import { toNextJsHandler } from "better-auth/next-js";

import { auth } from "@/lib/auth";

// Better Auth mounts all auth endpoints (OTP, sign-in, admin, session) here.
export const { GET, POST } = toNextJsHandler(auth);
