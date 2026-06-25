"use client";

import { useEffect, useRef } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { RatingBreakdown } from "@/server/services/review";
import type { ReviewSummary as ReviewSummaryData } from "@/server/integrations/ai";
import { RatingSummary } from "@/components/storefront/rating-summary";
import { ReviewForm } from "@/components/storefront/review-form";
import { ReviewList, type StorefrontReview } from "@/components/storefront/review-list";
import { ReviewSummary } from "@/components/storefront/review-summary";

type Spec = { id: string; key: string; value: string };

export function ProductInfoTabs({
  productId,
  description,
  specs,
  reviews,
  breakdown,
  reviewSummary = null,
  openReview = false,
}: {
  productId: string;
  description: string;
  specs: Spec[];
  reviews: StorefrontReview[];
  breakdown: RatingBreakdown;
  /** AI-2 cached pros/cons summary; null when there aren't enough reviews. */
  reviewSummary?: ReviewSummaryData | null;
  /** Arrived via ?review=1 (e.g. delivered-order SMS) — focus the reviews tab. */
  openReview?: boolean;
}) {
  const hasDescription = description.trim().length > 0;
  const rootRef = useRef<HTMLDivElement>(null);

  // Deep-link from the delivered SMS: scroll the reviews into view (S5.1).
  useEffect(() => {
    if (openReview) rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [openReview]);

  const defaultValue = openReview || !hasDescription ? "reviews" : "description";

  return (
    <div ref={rootRef} className="scroll-mt-24">
      <Tabs defaultValue={defaultValue} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto">
          {hasDescription && <TabsTrigger value="description">Description</TabsTrigger>}
          {specs.length > 0 && <TabsTrigger value="specs">Specifications</TabsTrigger>}
          <TabsTrigger value="reviews">Reviews ({breakdown.count})</TabsTrigger>
        </TabsList>

        {hasDescription && (
          <TabsContent value="description" className="pt-6">
            {/* Admin-authored rich text (basic HTML). Authors are trusted staff. */}
            <div
              className="[&_a]:text-brand max-w-none text-sm leading-relaxed [&_a]:underline [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:font-semibold [&_li]:mb-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_strong]:font-semibold [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: description }}
            />
          </TabsContent>
        )}

        {specs.length > 0 && (
          <TabsContent value="specs" className="pt-6">
            <dl className="divide-y overflow-hidden rounded-xl border">
              {specs.map((s, i) => (
                <div key={s.id} className={i % 2 ? "bg-muted/40" : ""}>
                  <div className="flex gap-4 px-4 py-3 text-sm">
                    <dt className="text-muted-foreground w-40 shrink-0 font-medium">{s.key}</dt>
                    <dd className="flex-1">{s.value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </TabsContent>
        )}

        <TabsContent value="reviews" className="space-y-6 pt-6">
          <RatingSummary breakdown={breakdown} />
          {reviewSummary && <ReviewSummary summary={reviewSummary} />}
          <ReviewForm productId={productId} defaultOpen={openReview} />
          <ReviewList reviews={reviews} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
