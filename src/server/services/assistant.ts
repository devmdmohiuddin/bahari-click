import { db } from "@/lib/db";
import { ai } from "@/server/integrations/ai";
import { productCardSelect, toProductCard, type ProductCard } from "@/server/services/listing";
import { trackOrder } from "@/server/services/order";
import { searchProducts } from "@/server/services/search";
import { assistantChatSchema, type AssistantChatInput } from "@/server/validators/ai";

// AI-4 shopping assistant. Grounding lives here, not in the model: we look up
// catalog/order data ourselves and pass it as the ONLY context the model may use
// (docs/08-ai-features.md → Guardrails). This keeps it from inventing prices,
// stock, or order details. Lives in its own service to avoid an import cycle
// (search.ts already imports the AI service for embeddings).

// Order number like "BC-25061-0042"; BD phone like "+8801..." / "01...".
const ORDER_RE = /\bBC-\d{4,6}-\d{2,6}\b/i;
const PHONE_RE = /(?:\+?880|0)1\d{9}/;
const MAX_PRODUCTS = 5;

export async function assistantReply(input: AssistantChatInput): Promise<{ reply: string }> {
  const { messages } = assistantChatSchema.parse(input);
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";

  const context = await buildContext(lastUser);
  try {
    return { reply: await ai.chat(messages, context) };
  } catch (error) {
    // Graceful fallback (docs/08-ai-features.md → Guardrails): if the AI provider
    // is down or over quota, still help with the grounded data we already have.
    console.warn("[ai] assistant chat failed:", (error as Error).message);
    return { reply: fallbackReply(context) };
  }
}

/** Non-AI reply built straight from the grounded context (provider unavailable). */
function fallbackReply(context: string): string {
  if (!context.trim()) {
    return "I couldn't reach the assistant just now. Please try the search bar, or track an order on /track.";
  }
  return `${context}\n\nLet me know if you'd like more details on any of these.`;
}

/** Retrieve the catalog/order facts relevant to the latest message. */
async function buildContext(text: string): Promise<string> {
  // "Where's my order?" — needs both an order number and the phone on the order.
  const order = text.match(ORDER_RE);
  const phone = text.match(PHONE_RE);
  if (order && phone) {
    try {
      const o = await trackOrder(order[0].toUpperCase(), phone[0]);
      const items = o.items
        .map((i) => `${i.qty}× ${i.productTitle}${i.variantLabel ? ` (${i.variantLabel})` : ""}`)
        .join(", ");
      return [
        `Order ${o.orderNumber}:`,
        `- Status: ${o.status}`,
        `- Placed: ${o.createdAt.toISOString().slice(0, 10)}`,
        `- Items: ${items}`,
        `- Total: ৳${o.total}`,
        o.trackingCode
          ? `- Courier: ${o.courierName ?? "courier"} (tracking ${o.trackingCode})`
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    } catch {
      return "No order matches that order number and phone. Ask the customer to re-check both, or point them to the Track Order page (/track).";
    }
  }

  // Otherwise treat it as product discovery.
  const result = await searchProducts({ q: text, pageSize: MAX_PRODUCTS, sort: "relevance" });
  if (result.items.length > 0) {
    return formatProducts("Matching products:", result.items);
  }

  // No direct match (browse/vague question like "what's popular?", "trendy",
  // "what do you sell?") — fall back to featured + best-selling products so the
  // assistant still has real data to recommend from.
  const popular = await topProducts();
  if (popular.length === 0) return "";
  return formatProducts("Popular products in the store:", popular);
}

function formatProducts(heading: string, items: ProductCard[]): string {
  return [
    heading,
    ...items.map(
      (p) => `- ${p.title} — ৳${p.priceFrom}${p.inStock ? "" : " (out of stock)"} — /p/${p.slug}`,
    ),
  ].join("\n");
}

/** Featured first, then best-selling — the store's "what's good right now". */
async function topProducts(): Promise<ProductCard[]> {
  const rows = await db.product.findMany({
    where: { isPublished: true },
    orderBy: [{ isFeatured: "desc" }, { soldCountReal: "desc" }, { createdAt: "desc" }],
    take: MAX_PRODUCTS,
    select: productCardSelect,
  });
  return rows.map(toProductCard);
}
