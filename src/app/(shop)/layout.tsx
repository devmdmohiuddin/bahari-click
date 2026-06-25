import { SiteHeader } from "@/components/storefront/site-header";
import { SiteFooter } from "@/components/storefront/site-footer";
import { AnalyticsScripts } from "@/components/storefront/analytics-scripts";
import { SupportButton } from "@/components/storefront/support-button";
import { AssistantChat } from "@/components/storefront/assistant-chat";
import { Toaster } from "@/components/ui/toast";

// Storefront shell: brand header (logo, nav, search, cart) + footer. Wraps all
// public shop routes; admin has its own shell.
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <SupportButton />
      <AssistantChat />
      <Toaster />
      <AnalyticsScripts />
    </>
  );
}
