import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/storefront/login-form";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Bahari Click with your phone number.",
  robots: { index: false },
};

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-16 sm:py-24">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Sign in</h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Enter your phone number and we’ll text you a verification code.
        </p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
