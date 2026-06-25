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

// Prod default: Google Gemini Flash free tier (docs/08-ai-features.md). No SDK —
// plain REST so the dependency tree stays light. Set AI_PROVIDER=gemini + GEMINI_API_KEY.
const BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";

function integrationError(message: string): AppError {
  return new AppError("INTEGRATION", message);
}

/** One grounded call: system + user prompt in, parsed JSON object out. */
async function callGemini<T>(system: string, user: string): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw integrationError("Gemini not configured (GEMINI_API_KEY missing)");
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
      }),
    });
  } catch (error) {
    throw integrationError(`Gemini request failed: ${(error as Error).message}`);
  }

  if (!res.ok) {
    throw integrationError(`Gemini returned ${res.status}`);
  }

  const data = (await res.json().catch(() => null)) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  } | null;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw integrationError("Gemini returned an empty response");

  try {
    return JSON.parse(text) as T;
  } catch {
    throw integrationError("Gemini returned malformed JSON");
  }
}

/** Free text generation (no JSON constraint) — used by the chat assistant. */
async function callGeminiText(system: string, user: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw integrationError("Gemini not configured (GEMINI_API_KEY missing)");
  const model = process.env.GEMINI_MODEL ?? "gemini-2.5-flash-lite";

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: user }] }],
        generationConfig: { temperature: 0.5 },
      }),
    });
  } catch (error) {
    throw integrationError(`Gemini request failed: ${(error as Error).message}`);
  }
  if (!res.ok) throw integrationError(`Gemini returned ${res.status}`);

  const data = (await res.json().catch(() => null)) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  } | null;
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw integrationError("Gemini returned an empty response");
  return text;
}

export const geminiAiAdapter: AiAdapter = {
  name: "gemini",

  async generateProductContent(input: ProductContentInput): Promise<GeneratedProductContent> {
    return callGemini<GeneratedProductContent>(
      buildProductContentSystemPrompt(),
      buildProductContentUserPrompt(input),
    );
  },

  async summarizeReviews(reviews: ReviewInput[]): Promise<ReviewSummary> {
    return callGemini<ReviewSummary>(
      buildReviewSummarySystemPrompt(),
      buildReviewSummaryUserPrompt(reviews),
    );
  },

  async embed(texts: string[]): Promise<number[][]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw integrationError("Gemini not configured (GEMINI_API_KEY missing)");
    const model = process.env.GEMINI_EMBED_MODEL ?? "gemini-embedding-001";

    let res: Response;
    try {
      res = await fetch(`${BASE_URL}/${model}:batchEmbedContents?key=${apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: texts.map((text) => ({
            model: `models/${model}`,
            content: { parts: [{ text }] },
          })),
        }),
      });
    } catch (error) {
      throw integrationError(`Gemini embed failed: ${(error as Error).message}`);
    }
    if (!res.ok) throw integrationError(`Gemini embed returned ${res.status}`);

    const data = (await res.json().catch(() => null)) as {
      embeddings?: { values?: number[] }[];
    } | null;
    const vectors = data?.embeddings?.map((e) => e.values ?? []);
    if (!vectors || vectors.length !== texts.length) {
      throw integrationError("Gemini embed returned an unexpected response");
    }
    return vectors;
  },

  async chat(messages: ChatMessage[], context: string): Promise<string> {
    const transcript = messages
      .map((m) => `${m.role === "user" ? "Customer" : "Assistant"}: ${m.content}`)
      .join("\n");
    return callGeminiText(buildAssistantSystemPrompt(context), transcript);
  },
};
