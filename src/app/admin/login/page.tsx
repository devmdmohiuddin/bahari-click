"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brand } from "@/components/admin/brand";
import { authClient } from "@/lib/auth-client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    params.get("error") === "forbidden" ? "This account is not an admin." : null,
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await authClient.signIn.email({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message ?? "Sign in failed.");
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="w-full max-w-sm space-y-6">
      <div className="flex flex-col items-center gap-4 text-center">
        <Brand href="#" className="pointer-events-none" />
        <div className="space-y-1">
          <h1 className="text-xl font-semibold tracking-tight">Sign in to your dashboard</h1>
          <p className="text-muted-foreground text-sm">Bahari Click staff access only.</p>
        </div>
      </div>

      <div className="bg-card rounded-xl border p-6 shadow-sm">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@bahariclick.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive flex items-start gap-2 rounded-lg px-3 py-2 text-sm">
              <AlertCircle className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>

      <p className="text-muted-foreground text-center text-xs">
        Protected area · Cash-on-delivery commerce for Bangladesh
      </p>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="bg-muted/30 flex min-h-screen items-center justify-center px-4 py-12">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
