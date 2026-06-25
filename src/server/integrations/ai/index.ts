import { claudeAiAdapter } from "./claude";
import { geminiAiAdapter } from "./gemini";
import { mockAiAdapter } from "./mock";
import type { AiAdapter } from "./types";

export type {
  AiAdapter,
  AiLanguage,
  ChatMessage,
  GeneratedProductContent,
  GeneratedSpec,
  ProductContentInput,
  ProductSeo,
  ReviewInput,
  ReviewSummary,
} from "./types";

// Provider selection. Dev defaults to the free mock (৳0). Set AI_PROVIDER=gemini
// (+ GEMINI_API_KEY) for the prod free tier, or AI_PROVIDER=claude (+ ANTHROPIC_API_KEY)
// for the premium upgrade. See docs/08-ai-features.md.
function resolveAiAdapter(): AiAdapter {
  const provider = process.env.AI_PROVIDER ?? "mock";

  switch (provider) {
    case "mock":
      return mockAiAdapter;
    case "gemini":
      return geminiAiAdapter;
    case "claude":
      return claudeAiAdapter;
    default:
      console.warn(`[ai] unknown AI_PROVIDER "${provider}", falling back to mock`);
      return mockAiAdapter;
  }
}

export const ai = resolveAiAdapter();
