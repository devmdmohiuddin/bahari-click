"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Send } from "lucide-react";

import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitContactMessageAction } from "@/server/actions/contact";

// Storefront enquiry form → admin contact inbox (submitContactMessageAction).
export function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !subject.trim() || !message.trim()) {
      toast.error("Please fill in your name, phone, subject and message");
      return;
    }
    startTransition(async () => {
      const res = await submitContactMessageAction({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
      });
      if (res.ok) {
        setDone(true);
        toast.success("Message sent!", "We’ll get back to you soon.");
      } else {
        toast.error("Couldn’t send message", res.error.message);
      }
    });
  }

  if (done) {
    return (
      <div className="border-success/30 bg-success/5 flex items-start gap-3 rounded-2xl border p-5">
        <CheckCircle2 className="text-success mt-0.5 size-6 shrink-0" />
        <div>
          <p className="font-medium">Thanks for reaching out!</p>
          <p className="text-muted-foreground mt-0.5 text-sm">
            We’ve received your message and will contact you on {phone} soon.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border p-5 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="c-name">Name</Label>
          <Input
            id="c-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="c-phone">Phone number</Label>
          <Input
            id="c-phone"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            autoComplete="tel"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-email">Email (optional)</Label>
        <Input
          id="c-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-subject">Subject</Label>
        <Input
          id="c-subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          maxLength={160}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="c-message">Message</Label>
        <Textarea
          id="c-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={4000}
          className="min-h-32"
          placeholder="How can we help?"
        />
      </div>

      <Button type="submit" size="lg" disabled={pending} className="w-full sm:w-auto">
        <Send />
        {pending ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
