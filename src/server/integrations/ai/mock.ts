import type {
  AiAdapter,
  ChatMessage,
  GeneratedProductContent,
  ProductContentInput,
  ReviewInput,
  ReviewSummary,
} from "./types";

/** Dimension of the mock embedding vectors. */
const MOCK_EMBED_DIM = 64;

// Deterministic pseudo-embedding: hashes whitespace tokens into a fixed-size
// bag-of-words vector, then L2-normalizes. Good enough for offline cosine
// similarity in dev (semantically related text shares tokens → higher score).
function mockEmbed(text: string): number[] {
  const vec = new Array<number>(MOCK_EMBED_DIM).fill(0);
  for (const token of text.toLowerCase().split(/[^a-z0-9ঀ-৿]+/i)) {
    if (!token) continue;
    let h = 0;
    for (let i = 0; i < token.length; i++) h = (h * 31 + token.charCodeAt(i)) >>> 0;
    vec[h % MOCK_EMBED_DIM] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, x) => s + x * x, 0)) || 1;
  return vec.map((x) => x / norm);
}

// Free dev adapter (৳0): deterministic canned output, no API key, no network.
// Lets the whole AI flow be built and demoed offline (docs/06-cost-and-free-tiers.md).

function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

export const mockAiAdapter: AiAdapter = {
  name: "mock",

  async generateProductContent(input: ProductContentInput): Promise<GeneratedProductContent> {
    const name = input.title?.trim() || "This product";
    const hint = input.sourceText?.trim();

    const description = [
      `<p><strong>${name}</strong> — a quality pick for everyday use.</p>`,
      "<ul>",
      "<li>Durable, practical design</li>",
      "<li>Easy to use and maintain</li>",
      "<li>Backed by reliable cash-on-delivery service across Bangladesh</li>",
      "</ul>",
      hint ? `<p>${clip(hint, 240)}</p>` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return {
      title: clip(name, 80),
      description,
      specs: [
        { key: "Material", value: "Premium quality" },
        { key: "Origin", value: "Imported" },
        { key: "Warranty", value: "Replacement on delivery defects" },
      ],
      seo: {
        title: clip(`${name} | Bahari Click`, 60),
        description: clip(
          `Buy ${name} online in Bangladesh. Cash on delivery, fast shipping.`,
          155,
        ),
      },
      imageAlt: clip(`${name} product photo`, 120),
    };
  },

  async summarizeReviews(reviews: ReviewInput[]): Promise<ReviewSummary> {
    const count = reviews.length;
    const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
    const positive = avg >= 4;

    return {
      sentiment: count
        ? `Based on ${count} review${count > 1 ? "s" : ""}, buyers are ${positive ? "happy with" : "mixed about"} this product (avg ${avg.toFixed(1)}/5).`
        : "No reviews yet.",
      pros: positive
        ? ["Good value for money", "Matches the description", "Quick delivery"]
        : ["Affordable"],
      cons: positive ? [] : ["Some buyers wanted better quality"],
    };
  },

  async embed(texts: string[]): Promise<number[][]> {
    return texts.map(mockEmbed);
  },

  async chat(messages: ChatMessage[], context: string): Promise<string> {
    const last = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    if (!context.trim()) {
      return "I'm not sure about that one. You can search the store, track an order on the Track page, or use the support options below for help.";
    }
    // Canned but grounded: echoes that it found relevant info (dev, ৳0).
    return [
      `Here's what I found for "${clip(last, 80)}":`,
      "",
      context,
      "",
      "Anything else I can help you find?",
    ].join("\n");
  },
};
