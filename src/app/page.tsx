import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center gap-6 px-4 text-center">
      <span className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
        Phase 0 · Foundation
      </span>
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Bahari Click</h1>
      <p className="text-muted-foreground text-balance">
        Quality products, delivered across Bangladesh. Cash on delivery. The storefront lands in
        Phase 1 — this is the deployable skeleton.
      </p>
      <Button asChild>
        <Link href="/admin">Go to admin</Link>
      </Button>
    </main>
  );
}
