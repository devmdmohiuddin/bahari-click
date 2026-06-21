import Link from "next/link";
import { MousePointerClick } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col items-center justify-center gap-5 px-4 py-24 text-center">
      <span className="bg-brand-tint text-brand flex size-16 items-center justify-center rounded-2xl">
        <MousePointerClick className="size-8" />
      </span>
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
        <p className="text-muted-foreground text-balance">
          The page you’re looking for doesn’t exist or may have moved.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
