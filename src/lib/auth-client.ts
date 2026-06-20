"use client";

import { createAuthClient } from "better-auth/react";
import { adminClient, phoneNumberClient } from "better-auth/client/plugins";

import { ac, roles } from "@/lib/permissions";

// Browser-side auth client. Mirrors the server plugins in src/lib/auth.ts.
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  plugins: [phoneNumberClient(), adminClient({ ac, roles })],
});

export const { signIn, signOut, signUp, useSession } = authClient;
