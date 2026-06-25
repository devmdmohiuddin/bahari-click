// AI adapter contract. Mirrors the SMS/courier/payment adapters: one interface,
// many providers, mocked in dev (৳0). Swap provider in ./index.ts via AI_PROVIDER.
// See docs/08-ai-features.md.

/** Output language for generated copy. */
export type AiLanguage = "bn" | "en" | "both";

export interface ProductContentInput {
  /** Working title or product name (may be rough / Chinese supplier text). */
  title?: string;
  /** Raw source text: pasted supplier description, Chinese copy, bullet notes. */
  sourceText?: string;
  /** Category/subcategory label for context (e.g. "Bags > Office bags"). */
  category?: string;
  language: AiLanguage;
}

export interface GeneratedSpec {
  key: string;
  value: string;
}

export interface ProductSeo {
  title: string;
  description: string;
}

export interface GeneratedProductContent {
  title: string;
  /** Clean storefront description. Basic HTML (paragraphs, lists) allowed. */
  description: string;
  specs: GeneratedSpec[];
  seo: ProductSeo;
  /** AI-5: a descriptive alt text for the product images (accessibility/SEO). */
  imageAlt: string;
}

/** A single approved review, the only grounding the summarizer is given. */
export interface ReviewInput {
  rating: number; // 1..5
  comment: string;
}

export interface ReviewSummary {
  /** One-line overall sentiment, customer-facing. */
  sentiment: string;
  /** "What buyers love." */
  pros: string[];
  /** "What to note." */
  cons: string[];
}

/** One chat turn. The assistant is grounded on catalog/order data only. */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** Whether this provider can produce embeddings (only Gemini, for now). */
export interface AiAdapter {
  readonly name: string;
  /** AI-1 / AI-5: one-shot product copy + SEO + alt text. Reviewed before publish. */
  generateProductContent(input: ProductContentInput): Promise<GeneratedProductContent>;
  /** AI-2: summarize approved reviews into pros/cons. Grounded on the reviews only. */
  summarizeReviews(reviews: ReviewInput[]): Promise<ReviewSummary>;
  /** AI-3 / AI-6: embed text for semantic search + recommendations. */
  embed(texts: string[]): Promise<number[][]>;
  /**
   * AI-4: grounded assistant reply. `context` is the only catalog/order data the
   * model may use — it must never invent prices, stock, or order details.
   */
  chat(messages: ChatMessage[], context: string): Promise<string>;
}
