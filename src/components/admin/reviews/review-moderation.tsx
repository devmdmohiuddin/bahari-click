"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Star, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/toast";
import { EmptyState } from "@/components/admin/empty-state";
import { PageHeader } from "@/components/admin/page-header";
import {
  bulkApproveReviewsAction,
  deleteReviewAction,
  setReviewApprovedAction,
} from "@/server/actions/review";
import type { PendingReview } from "@/server/services/review";

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "size-4",
            n <= rating ? "fill-warning text-warning" : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

export function ReviewModeration({ reviews }: { reviews: PendingReview[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  const allSelected = reviews.length > 0 && selected.size === reviews.length;

  function toggle(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(reviews.map((r) => r.id)));
  }

  async function approve(id: string) {
    setPendingId(id);
    const res = await setReviewApprovedAction(id, true);
    setPendingId(null);
    if (!res.ok) return toast.error("Could not approve", res.error.message);
    toast.success("Review approved");
    router.refresh();
  }

  async function reject(id: string) {
    setPendingId(id);
    const res = await deleteReviewAction(id);
    setPendingId(null);
    if (!res.ok) return toast.error("Could not reject", res.error.message);
    toast.success("Review rejected");
    router.refresh();
  }

  async function approveSelected() {
    if (selected.size === 0) return;
    setBulkBusy(true);
    const res = await bulkApproveReviewsAction([...selected]);
    setBulkBusy(false);
    if (!res.ok) return toast.error("Could not approve", res.error.message);
    toast.success(`Approved ${res.data.count} review${res.data.count === 1 ? "" : "s"}`);
    setSelected(new Set());
    router.refresh();
  }

  if (reviews.length === 0) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <PageHeader title="Reviews" description="Moderate customer reviews before they go live." />
        <EmptyState
          icon={Star}
          title="No pending reviews"
          description="You're all caught up. New submissions will appear here for approval."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Reviews"
        description={`${reviews.length} review${reviews.length === 1 ? "" : "s"} awaiting moderation.`}
      >
        <Button onClick={approveSelected} disabled={selected.size === 0 || bulkBusy}>
          <Check />
          Approve selected{selected.size > 0 ? ` (${selected.size})` : ""}
        </Button>
      </PageHeader>

      <div className="flex items-center gap-2 px-1">
        <Checkbox checked={allSelected} onCheckedChange={toggleAll} id="select-all" />
        <label htmlFor="select-all" className="text-muted-foreground text-sm select-none">
          Select all
        </label>
      </div>

      <div className="space-y-3">
        {reviews.map((review) => {
          const reviewer = review.customer?.name ?? review.guestName ?? "Guest";
          const busy = pendingId === review.id;
          return (
            <Card key={review.id} className="p-4">
              <div className="flex gap-3">
                <Checkbox
                  className="mt-1"
                  checked={selected.has(review.id)}
                  onCheckedChange={() => toggle(review.id)}
                  aria-label="Select review"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="font-medium">{reviewer}</span>
                    <Stars rating={review.rating} />
                    <span className="text-muted-foreground text-xs">
                      {formatDate(review.createdAt)}
                    </span>
                    <Link
                      href={`/admin/products/${review.product.id}/edit`}
                      className="ml-auto shrink-0"
                    >
                      <Badge variant="secondary" className="hover:bg-secondary/70">
                        {review.product.title}
                      </Badge>
                    </Link>
                  </div>

                  {review.comment && <p className="text-sm">{review.comment}</p>}

                  {review.imageUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {review.imageUrls.map((url) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={url}
                          src={url}
                          alt=""
                          className="size-16 rounded-lg border object-cover"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={busy}
                      onClick={() => approve(review.id)}
                    >
                      <Check />
                      Approve
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" disabled={busy}>
                          <X />
                          Reject
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Reject this review?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This permanently deletes the review from {reviewer}. This cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => reject(review.id)}
                          >
                            Reject
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
