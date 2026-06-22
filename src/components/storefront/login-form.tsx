"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { requestOtpAction } from "@/server/actions/auth";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/account";

  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phoneInput, setPhoneInput] = useState("");
  const [phone, setPhone] = useState(""); // normalized, returned by the server
  const [code, setCode] = useState("");
  const [sending, startSending] = useTransition();
  const [verifying, startVerifying] = useTransition();

  function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (!phoneInput.trim()) return;
    startSending(async () => {
      const res = await requestOtpAction({ phone: phoneInput.trim() });
      if (res.ok) {
        setPhone(res.data.phone);
        setStep("code");
        toast.success("Code sent", `We texted a code to ${res.data.phone}`);
      } else {
        toast.error("Couldn’t send code", res.error.message);
      }
    });
  }

  function verify(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().length < 4) {
      toast.error("Enter the code we sent you");
      return;
    }
    startVerifying(async () => {
      const { error } = await authClient.phoneNumber.verify({
        phoneNumber: phone,
        code: code.trim(),
      });
      if (error) {
        toast.error("Invalid or expired code", error.message ?? undefined);
        return;
      }
      toast.success("Signed in!");
      router.push(next);
      router.refresh();
    });
  }

  return (
    <div className="mt-8 rounded-2xl border p-5 shadow-sm sm:p-6">
      {step === "phone" ? (
        <form onSubmit={sendCode} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login-phone">Phone number</Label>
            <Input
              id="login-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              autoFocus
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="01XXXXXXXXX"
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={sending}>
            {sending ? <Loader2 className="animate-spin" /> : null}
            {sending ? "Sending…" : "Send code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={verify} className="space-y-4">
          <button
            type="button"
            onClick={() => setStep("phone")}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm"
          >
            <ArrowLeft className="size-4" /> Change number
          </button>
          <div className="space-y-1.5">
            <Label htmlFor="login-code">Verification code</Label>
            <Input
              id="login-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
              className="text-center text-lg tracking-[0.4em]"
            />
            <p className="text-muted-foreground text-xs">Sent to {phone}</p>
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={verifying}>
            {verifying ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
            {verifying ? "Verifying…" : "Verify & sign in"}
          </Button>
          <button
            type="button"
            onClick={sendCode}
            disabled={sending}
            className="text-brand mx-auto block text-sm hover:underline disabled:opacity-50"
          >
            Resend code
          </button>
        </form>
      )}
    </div>
  );
}
