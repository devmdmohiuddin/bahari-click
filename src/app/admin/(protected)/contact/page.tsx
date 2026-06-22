import { listContactMessages } from "@/server/services/contact";
import { ContactInbox } from "@/components/admin/contact/contact-inbox";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
  const messages = await listContactMessages();
  return <ContactInbox messages={messages} />;
}
