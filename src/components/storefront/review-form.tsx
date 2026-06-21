"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitReviewAction } from "@/server/actions/review";

export function ReviewForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Please select a rating");
      return;
    }
    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    startTransition(async () => {
      const res = await submitReviewAction({
        productId,
        rating,
        guestName: name.trim(),
        comment: comment.trim() || undefined,
      });
      if (res.ok) {
        toast.success("Thanks for your review!", "It will appear once approved.");
        setRating(0);
        setName("");
        setComment("");
        setOpen(false);
      } else {
        toast.error("Couldn’t submit review", res.error.message);
      }
    });
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        Write a review
      </Button>
    );
  }

  return (
    <form onSubmit={submit} className="bg-muted/40 space-y-4 rounded-2xl border p-4 sm:p-6">
      <div className="space-y-1.5">
        <Label>Your rating</Label>
        <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHover(n)}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "size-7 transition-colors",
                  (hover || rating) >= n
                    ? "fill-warning text-warning"
                    : "text-muted-foreground/30 fill-current",
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="review-name">Your name</Label>
        <Input
          id="review-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Rahim Ahmed"
          maxLength={80}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="review-comment">Review (optional)</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience with this product…"
          maxLength={2000}
          className="min-h-24"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Submitting…" : "Submit review"}
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
