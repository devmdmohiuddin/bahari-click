"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

// Storefront error boundary (S6.3). Catches unexpected runtime errors in shop
// routes and offers a retry, keeping the brand chrome intact.
export default function ShopError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-5 px-4 py-24 text-center">
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
        <p className="text-muted-foreground text-balance">
          We hit an unexpected error. Please try again in a moment.
        </p>
      </div>
      <Button onClick={reset} size="lg">
        <RotateCcw />
        Try again
      </Button>
    </div>
  );
}
