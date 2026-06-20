import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin, phoneNumber } from "better-auth/plugins";
import { nextCookies } from "better-auth/next-js";

import { db } from "@/lib/db";
import { normalizeBdPhone } from "@/lib/phone";
import { ac, roles } from "@/lib/permissions";
import { RATE_LIMITS } from "@/lib/rate-limits";
import { sms } from "@/server/integrations/sms";
import { enforcePolicy } from "@/server/services/rate-limit";

// Admin roles (must match the UserRole enum in prisma/schema.prisma).
export const ADMIN_ROLES = ["OWNER", "MANAGER", "STAFF"] as const;
export const CUSTOMER_ROLE = "CUSTOMER" as const;
export type AppRole = (typeof ADMIN_ROLES)[number] | typeof CUSTOMER_ROLE;

export const auth = betterAuth({
  appName: "Bahari Click",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,

  database: prismaAdapter(db, { provider: "postgresql" }),

  // Admin staff sign in with email + password.
  emailAndPassword: {
    enabled: true,
    // Admins are provisioned (seed / invite), not self-service email verified.
    requireEmailVerification: false,
  },

  user: {
    modelName: "User",
  },

  plugins: [
    // Customer identity: phone + OTP. In dev the OTP is logged by the mock SMS
    // adapter (free). Switch SMS_PROVIDER to go live (docs/06-cost-and-free-tiers.md).
    phoneNumber({
      otpLength: 6,
      expiresIn: 5 * 60, // 5 minutes
      allowedAttempts: 3,
      async sendOTP({ phoneNumber: phone, code }) {
        const to = normalizeBdPhone(phone) ?? phone;
        // Throttle OTP sends per phone to deter SMS-cost abuse.
        await enforcePolicy(`otp:send:${to}`, RATE_LIMITS.otpSend);
        await sms.send({
          to,
          template: "otp",
          text: `Your Bahari Click code is ${code}. It expires in 5 minutes.`,
        });
      },
      signUpOnVerification: {
        // Email is required+unique in the schema; synthesize one for phone users.
        getTempEmail: (phone) => `${phone}@phone.bahari.local`,
        getTempName: (phone) => phone,
      },
    }),

    // Admin roles + management endpoints.
    admin({
      ac,
      roles,
      defaultRole: CUSTOMER_ROLE,
      adminRoles: [...ADMIN_ROLES],
    }),

    // Must stay last: lets Server Actions set auth cookies.
    nextCookies(),
  ],
});

export type Session = typeof auth.$Infer.Session;
