"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Inbox, Mail, MailOpen, Phone } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import type { ContactMessage } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import { setContactReadAction } from "@/server/actions/contact";

type Filter = "all" | "unread";

const FILTERS: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "unread", label: "Unread" },
];

export function ContactInbox({ messages }: { messages: ContactMessage[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const unreadCount = useMemo(() => messages.filter((m) => !m.isRead).length, [messages]);
  const visible = filter === "unread" ? messages.filter((m) => !m.isRead) : messages;

  async function setRead(id: string, isRead: boolean) {
    setPendingId(id);
    const res = await setContactReadAction(id, isRead);
    setPendingId(null);
    if (!res.ok) return toast.error("Could not update", res.error.message);
    toast.success(isRead ? "Marked as read" : "Marked as unread");
    router.refresh();
  }

  if (messages.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader
          title="Inbox"
          description="Customer enquiries from the storefront contact form."
        />
        <EmptyState
          icon={Inbox}
          title="No messages yet"
          description="Enquiries submitted from the storefront contact form will appear here."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Inbox"
        description={
          unreadCount > 0
            ? `${unreadCount} unread of ${messages.length} message${messages.length === 1 ? "" : "s"}.`
            : `All ${messages.length} message${messages.length === 1 ? "" : "s"} read.`
        }
      >
        <div className="bg-muted flex w-fit items-center gap-1 rounded-full p-1">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant="ghost"
              className={cn("rounded-full", filter === f.value && "bg-background shadow-sm")}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
              {f.value === "unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
            </Button>
          ))}
        </div>
      </PageHeader>

      {visible.length === 0 ? (
        <EmptyState
          icon={MailOpen}
          title="Nothing unread"
          description="You're all caught up on customer enquiries."
        />
      ) : (
        <div className="space-y-3">
          {visible.map((m) => {
            const busy = pendingId === m.id;
            return (
              <Card
                key={m.id}
                className={cn("p-4", !m.isRead && "border-primary/40 bg-primary/[0.03]")}
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {!m.isRead && (
                      <span
                        className="bg-primary size-2 shrink-0 rounded-full"
                        aria-label="Unread"
                      />
                    )}
                    <span className="font-medium">{m.subject}</span>
                    {!m.isRead && (
                      <Badge variant="secondary" className="text-[10px]">
                        New
                      </Badge>
                    )}
                    <span className="text-muted-foreground ml-auto shrink-0 text-xs">
                      {formatDateTime(m.createdAt)}
                    </span>
                  </div>

                  <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                    <span className="text-foreground font-medium">{m.name}</span>
                    <a
                      href={`tel:${m.phone}`}
                      className="hover:text-foreground inline-flex items-center gap-1"
                    >
                      <Phone className="size-3.5" />
                      {m.phone}
                    </a>
                    {m.email && (
                      <a
                        href={`mailto:${m.email}`}
                        className="hover:text-foreground inline-flex items-center gap-1"
                      >
                        <Mail className="size-3.5" />
                        {m.email}
                      </a>
                    )}
                  </div>

                  <p className="text-sm whitespace-pre-wrap">{m.message}</p>

                  <div className="flex gap-2 pt-1">
                    {m.isRead ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => setRead(m.id, false)}
                      >
                        <Mail />
                        Mark unread
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={busy}
                        onClick={() => setRead(m.id, true)}
                      >
                        <MailOpen />
                        Mark read
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
