import { redirect } from "next/navigation";

import { getSession } from "@/server/auth-session";
import { AccountNav } from "@/components/storefront/account-nav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="heading-accent text-2xl sm:text-3xl">My account</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[14rem_1fr]">
        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <AccountNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
