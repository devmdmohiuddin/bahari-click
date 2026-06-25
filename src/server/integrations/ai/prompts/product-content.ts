import type { ProductContentInput } from "../types";

// Versioned prompt for AI-1 (product content) + AI-5 (SEO). Bump the version
// when the wording changes so cached outputs can be invalidated if needed.
export const PRODUCT_CONTENT_PROMPT_VERSION = "v1";

const LANGUAGE_INSTRUCTION: Record<ProductContentInput["language"], string> = {
  bn: "Write all text in clear, natural Bangla (Bengali).",
  en: "Write all text in clear, simple English.",
  both: "Write the description in Bangla followed by an English translation. Keep specs in English.",
};

export function buildProductContentSystemPrompt(): string {
  return [
    "You are a product copywriter for a Bangladeshi e-commerce store that sells",
    "China-sourced goods. Supplier text is often poor, machine-translated, or in",
    "Chinese. Rewrite it into clean, trustworthy listings for local shoppers.",
    "",
    "Rules:",
    "- Be accurate. Never invent prices, stock, delivery promises, brands, or",
    "  certifications that are not in the source.",
    "- Keep claims modest and factual; no hype, no fake guarantees.",
    "- description: 2-4 short paragraphs or a short intro + bullet list. Basic HTML",
    "  only (<p>, <ul>, <li>, <strong>). No images, scripts, or styles.",
    "- specs: concrete key/value attributes (Material, Size, Color options, etc.).",
    "- seo.title: <= 60 chars. seo.description: <= 155 chars.",
    "- imageAlt: one short descriptive alt text for the product photo (<= 120 chars).",
    "Respond with ONLY a JSON object, no markdown fences, matching:",
    '{"title": string, "description": string, "specs": [{"key": string, "value": string}], "seo": {"title": string, "description": string}, "imageAlt": string}',
  ].join("\n");
}

export function buildProductContentUserPrompt(input: ProductContentInput): string {
  const parts: string[] = [LANGUAGE_INSTRUCTION[input.language], ""];
  if (input.title) parts.push(`Product name / working title: ${input.title}`);
  if (input.category) parts.push(`Category: ${input.category}`);
  if (input.sourceText) {
    parts.push("", "Source text (supplier / Chinese / rough notes):", input.sourceText);
  }
  parts.push("", "Generate the cleaned listing JSON now.");
  return parts.join("\n");
}
