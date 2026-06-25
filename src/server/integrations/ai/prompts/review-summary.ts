import type { ReviewInput } from "../types";

// Versioned prompt for AI-2 (review summary). Bump when wording changes.
export const REVIEW_SUMMARY_PROMPT_VERSION = "v1";

export function buildReviewSummarySystemPrompt(): string {
  return [
    "You summarize customer product reviews for a Bangladeshi e-commerce store.",
    "You are given ONLY the reviews below — ground every statement in them.",
    "",
    "Rules:",
    "- Never invent feedback, numbers, or claims not present in the reviews.",
    "- sentiment: one short, neutral sentence capturing the overall consensus.",
    "- pros: short phrases buyers praised (max 5). cons: short phrases buyers noted",
    "  or complained about (max 5). Leave a list empty if there is nothing to report.",
    "- Match the language buyers mostly used (Bangla or English).",
    "Respond with ONLY a JSON object, no markdown fences, matching:",
    '{"sentiment": string, "pros": [string], "cons": [string]}',
  ].join("\n");
}

export function buildReviewSummaryUserPrompt(reviews: ReviewInput[]): string {
  const lines = reviews.map((r, i) => `${i + 1}. [${r.rating}/5] ${r.comment}`);
  return ["Reviews:", ...lines, "", "Summarize them as JSON now."].join("\n");
}
