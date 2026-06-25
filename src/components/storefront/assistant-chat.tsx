"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bot, Loader2, Send, Sparkles, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { assistantChatAction } from "@/server/actions/ai";
import type { ChatMessage } from "@/server/integrations/ai";

const GREETING =
  "Hi! I'm the Bahari Click assistant. Ask me to find a product, or check your order with your order number and phone.";

// AI-4 floating shopping assistant (bottom-left, so it doesn't clash with the
// support button bottom-right). Grounded server-side on catalog/order data.
export function AssistantChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const res = await assistantChatAction({ messages: next });
      setMessages([
        ...next,
        {
          role: "assistant",
          content: res.ok
            ? res.data.reply
            : "Sorry, I couldn't process that right now. Please try again or use the support options.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-4 left-4 z-40 flex flex-col items-start gap-2 sm:bottom-6 sm:left-6">
      {open && (
        <div className="bg-card animate-in slide-in-from-bottom-2 fade-in flex h-[28rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border shadow-xl">
          <div className="bg-brand text-brand-foreground flex items-center gap-2 px-4 py-3">
            <Sparkles className="size-4" />
            <span className="text-sm font-semibold">Shopping assistant</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="ml-auto opacity-90 hover:opacity-100"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm">
            <Bubble role="assistant" content={GREETING} />
            {messages.map((m, i) => (
              <Bubble key={i} role={m.role} content={m.content} />
            ))}
            {loading && (
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <Loader2 className="size-3.5 animate-spin" />
                Thinking…
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
            className="flex items-center gap-2 border-t p-2"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a product or order…"
              className="h-9"
            />
            <Button type="submit" size="icon-sm" disabled={loading || !input.trim()}>
              <Send className="size-4" />
            </Button>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Ask the AI assistant"}
        aria-expanded={open}
        className="bg-card hover:bg-muted flex size-14 items-center justify-center rounded-full border shadow-lg transition-all active:scale-95"
      >
        {open ? <X className="size-6" /> : <Bot className="text-brand size-6" />}
      </button>
    </div>
  );
}

function Bubble({ role, content }: { role: ChatMessage["role"]; content: string }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3 py-2 leading-relaxed whitespace-pre-wrap",
          isUser ? "bg-brand text-brand-foreground" : "bg-muted",
        )}
      >
        {renderWithLinks(content)}
      </div>
    </div>
  );
}

// Turn relative paths (/p/slug, /track, /contact) in the reply into links.
function renderWithLinks(text: string) {
  const parts = text.split(/(\/(?:p\/[a-z0-9-]+|track|contact))/gi);
  return parts.map((part, i) =>
    /^\/(?:p\/[a-z0-9-]+|track|contact)$/i.test(part) ? (
      <Link key={i} href={part} className="text-brand underline">
        {part}
      </Link>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}
