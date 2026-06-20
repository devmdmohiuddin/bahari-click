"use client";

import { useEffect } from "react";
import { create } from "zustand";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type ToastVariant = "success" | "error" | "info";

type Toast = {
  id: number;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastStore = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => void;
  dismiss: (id: number) => void;
};

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  push: (t) => set((s) => ({ toasts: [...s.toasts, { ...t, id: Date.now() + Math.random() }] })),
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

// Imperative helper usable from anywhere (event handlers, after server actions).
export const toast = {
  success: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: "success" }),
  error: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: "error" }),
  info: (title: string, description?: string) =>
    useToastStore.getState().push({ title, description, variant: "info" }),
};

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
} as const;

const ACCENT = {
  success: "text-success",
  error: "text-destructive",
  info: "text-info",
} as const;

function ToastCard({ t }: { t: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const Icon = ICONS[t.variant];

  useEffect(() => {
    const timer = setTimeout(() => dismiss(t.id), 4000);
    return () => clearTimeout(timer);
  }, [t.id, dismiss]);

  return (
    <div className="bg-popover text-popover-foreground animate-in slide-in-from-right-4 fade-in pointer-events-auto flex w-80 items-start gap-3 rounded-xl border p-3 shadow-lg">
      <Icon className={cn("mt-0.5 size-5 shrink-0", ACCENT[t.variant])} />
      <div className="flex-1 space-y-0.5">
        <p className="text-sm font-medium">{t.title}</p>
        {t.description && <p className="text-muted-foreground text-sm">{t.description}</p>}
      </div>
      <button
        onClick={() => dismiss(t.id)}
        className="text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Dismiss"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  return (
    <div className="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastCard key={t.id} t={t} />
      ))}
    </div>
  );
}
