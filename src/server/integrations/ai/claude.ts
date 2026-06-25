import { AppError } from "@/lib/errors";
import { buildAssistantSystemPrompt } from "./prompts/assistant";
import {
  buildProductContentSystemPrompt,
  buildProductContentUserPrompt,
} from "./prompts/product-content";
import {
  buildReviewSummarySystemPrompt,
  buildReviewSummaryUserPrompt,
} from "./prompts/review-summary";
import type {
  AiAdapter,
  ChatMessage,
  GeneratedProductContent,
  ProductContentInput,
  ReviewInput,
  ReviewSummary,
} from "./types";

// Optional premium upgrade (docs/08-ai-features.md): Anthropic Claude. Set
// AI_PROVIDER=claude + ANTHROPIC_API_KEY. The SDK is loaded lazily so it is only
// needed when this provider is actually selected — dev defaults to the free mock.
//
// Model defaults to the cheap Haiku tier the spec names; bump ANTHROPIC_MODEL to
// claude-opus-4-8 for premium-quality copy when output demands it.
const DEFAULT_MODEL = "claude-haiku-4-5";

function integrationError(message: string): AppError {
  return new AppError("INTEGRATION", message);
}

// JSON schemas for structured outputs — the API constrains the response to these.
const PRODUCT_CONTENT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    description: { type: "string" },
    specs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { key: { type: "string" }, value: { type: "string" } },
        required: ["key", "value"],
      },
    },
    seo: {
      type: "object",
      additionalProperties: false,
      properties: { title: { type: "string" }, description: { type: "string" } },
      required: ["title", "description"],
    },
    imageAlt: { type: "string" },
  },
  required: ["title", "description", "specs", "seo", "imageAlt"],
} as const;

const REVIEW_SUMMARY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    sentiment: { type: "string" },
    pros: { type: "array", items: { type: "string" } },
    cons: { type: "array", items: { type: "string" } },
  },
  required: ["sentiment", "pros", "cons"],
} as const;

interface AnthropicClient {
  messages: {
    create(args: unknown): Promise<{ content: { type: string; text?: string }[] }>;
  };
}

async function getClient(): Promise<AnthropicClient> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw integrationError("Claude not configured (ANTHROPIC_API_KEY missing)");

  // Build the specifier at runtime + tell the bundler to skip it, so the package
  // is only required when this provider is actually selected (dev uses the mock).
  const specifier = ["@anthropic-ai", "sdk"].join("/");
  let mod: { default: new (opts: { apiKey: string }) => AnthropicClient };
  try {
    mod = (await import(
      /* webpackIgnore: true */ /* turbopackIgnore: true */ specifier
    )) as typeof mod;
  } catch {
    throw integrationError("Claude provider selected but @anthropic-ai/sdk is not installed");
  }
  return new mod.default({ apiKey });
}

async function callClaude<T>(system: string, user: string, schema: unknown): Promise<T> {
  const client = await getClient();
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

  let response: { content: { type: string; text?: string }[] };
  try {
    response = await client.messages.create({
      model,
      max_tokens: 2048,
      system,
      messages: [{ role: "user", content: user }],
      output_config: { format: { type: "json_schema", schema } },
    });
  } catch (error) {
    throw integrationError(`Claude request failed: ${(error as Error).message}`);
  }

  const text = response.content.find((b) => b.type === "text")?.text;
  if (!text) throw integrationError("Claude returned an empty response");

  try {
    return JSON.parse(text) as T;
  } catch {
    throw integrationError("Claude returned malformed JSON");
  }
}

/** Plain text completion (no JSON schema) — used by the chat assistant. */
async function callClaudeText(system: string, user: string): Promise<string> {
  const client = await getClient();
  const model = process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL;

  let response: { content: { type: string; text?: string }[] };
  try {
    response = await client.messages.create({
      model,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: user }],
    });
  } catch (error) {
    throw integrationError(`Claude request failed: ${(error as Error).message}`);
  }
  const text = response.content.find((b) => b.type === "text")?.text;
  if (!text) throw integrationError("Claude returned an empty response");
  return text;
}

export const claudeAiAdapter: AiAdapter = {
  name: "claude",

  async generateProductContent(input: ProductContentInput): Promise<GeneratedProductContent> {
    return callClaude<GeneratedProductContent>(
      buildProductContentSystemPrompt(),
      buildProductContentUserPrompt(input),
      PRODUCT_CONTENT_SCHEMA,
    );
  },

  async summarizeReviews(reviews: ReviewInput[]): Promise<ReviewSummary> {
    return callClaude<ReviewSummary>(
      buildReviewSummarySystemPrompt(),
      buildReviewSummaryUserPrompt(reviews),
      REVIEW_SUMMARY_SCHEMA,
    );
  },

  async embed(): Promise<number[][]> {
    // Anthropic has no embeddings API. Semantic search / recommendations need
    // AI_PROVIDER=gemini; callers treat this as a graceful no-op (keyword/category).
    throw integrationError("Claude has no embeddings API — use AI_PROVIDER=gemini for embeddings");
  },

  async chat(messages: ChatMessage[], context: string): Promise<string> {
    const transcript = messages
      .map((m) => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.content}`)
      .join("\n");
    return callClaudeText(buildAssistantSystemPrompt(context), transcript);
  },
};
