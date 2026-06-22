# 08 — AI Features

How AI is used in Bahari Click, where each feature lives, the user benefit, and — critically — the cost shape (we stay within the [free-only dev constraint](./06-cost-and-free-tiers.md)). AI is treated like any other paid integration: **behind a swappable adapter, mocked in dev, free-tier in production, upgradeable later.**

---

## Guiding principles

1. **Adapter, not lock-in.** All AI calls go through `server/integrations/ai/` with one interface, mirroring the SMS/courier adapters ([03-architecture.md](./03-architecture.md)). Swap provider in one file.
2. **Mock in dev = ৳0.** The dev adapter returns canned output. No API key, no cost, while building.
3. **Free in production where possible.** Default live provider = **Google Gemini Flash free tier** (generous, rate-limited). **Groq** is a backup free tier. Upgrade to **Claude Haiku** (cheap) or **Claude Sonnet/Opus** (premium quality) only if output quality demands it — a launch decision, not a dev cost.
4. **Prefer one-shot + cached over live.** Generate once, store the result. This makes most features effectively free and removes per-visitor cost.
5. **Ground everything.** Customer-facing AI only answers from our own catalog/order data — never free-form — to avoid hallucinated prices, stock, or promises.

### Two cost shapes (decide per feature)

| Shape | Meaning | Cost | Examples |
|---|---|---|---|
| **One-shot + cached** | Run once, store output in DB | Near-free (pennies / free tier) | Description gen, review summary, SEO meta, alt-text |
| **Per-interaction** | Runs on every user request | Adds up with traffic | Live chatbot, real-time semantic search |

> Rule: ship the one-shot features first (free), defer per-interaction features (chatbot) to post-launch.

---

## Feature catalog

### AI-1 — Product content generator  ⭐ start here
- **What:** From a few inputs (or pasted/Chinese supplier text + image), generate a clean **title, description, specifications, and SEO meta** in **Bangla and/or English**.
- **Where:** Admin product editor (`A1.2`). A "✨ Generate" button beside description/specs.
- **User benefit:** China-sourced products arrive with poor or Chinese descriptions. Shoppers get clear, consistent, trustworthy listings — better understanding, fewer wrong-expectation returns.
- **Cost shape:** One-shot + cached (stored on the product). **~Free.**
- **Notes:** Admin reviews/edits before publish (human-in-the-loop). Translate-from-Chinese is the same call.

### AI-2 — Review summary (pros & cons)  ⭐ start here
- **What:** Summarize all approved reviews into an overall sentiment + short **"What buyers love / What to note"** list.
- **Where:** PDP reviews section (`S2.2`). Regenerated on a schedule or every N new approved reviews.
- **User benefit:** Shoppers grasp consensus in seconds instead of reading 50 reviews.
- **Cost shape:** Cached per product (`Product.reviewSummary` field). **~Free.**

### AI-3 — Natural-language / semantic search
- **What:** Understand queries like *"office bag under ৳1000"* or *"gift for wife"* and return relevant products, not just keyword matches.
- **Where:** Search (`S6.1` / `F6.1`) — augments Postgres FTS with embeddings.
- **User benefit:** Buyers find products the way they actually talk; fewer dead-end "no results".
- **Cost shape:** Embeddings generated **once per product** (cached as vectors); query embedding is per-search but tiny/cheap. Embedding free tiers exist (Gemini). **Low.**
- **Notes:** Store vectors in Postgres via `pgvector`. Build only after keyword search works.

### AI-4 — Shopping assistant chatbot  (post-launch)
- **What:** Floating chat that answers product questions, recommends items, and handles **"where's my order?"** (by phone) — in Bangla/English. **Grounded** on catalog + order data via tool/function calling.
- **Where:** Storefront widget; new task in Phase 7+.
- **User benefit:** Instant help and guided discovery without waiting for a human; reduces support load.
- **Cost shape:** **Per-interaction** — the one feature with real ongoing cost. Use a cheap model + free tier; rate-limit per session.
- **Notes:** Must call internal functions (`searchProducts`, `getOrderStatus`) — never invent answers. Defer until after launch since it's the costliest.

### AI-5 — SEO meta & image alt-text generator
- **What:** Auto-draft meta title/description and image alt text for products/pages.
- **Where:** Admin (`A1.2` / part of AI-1). Feeds storefront SEO (`S6.2`).
- **User benefit:** Indirect — better organic ranking = more free traffic; alt-text improves accessibility.
- **Cost shape:** One-shot + cached. **~Free.**

### AI-6 — Smart recommendations (optional, later)
- **What:** "You may also like" beyond same-category — based on attributes/behavior.
- **Where:** PDP / cart / home.
- **User benefit:** Better discovery, higher basket size.
- **Cost shape:** Start with **rules/embeddings (free)**; add LLM ranking only if worth it.

---

## Provider & adapter design

```
server/integrations/ai/
  index.ts          # AiAdapter interface
  mock.ts           # dev: canned responses (৳0)
  gemini.ts         # prod default: Gemini Flash free tier
  claude.ts         # optional upgrade: Claude Haiku/Sonnet
  prompts/          # versioned prompt templates (BN/EN)
```

```ts
interface AiAdapter {
  generateProductContent(input): { title, description, specs[], seo }
  summarizeReviews(reviews[]): { sentiment, pros[], cons[] }
  embed(text): number[]                     // for semantic search
  chat(messages, tools): ChatResult         // grounded assistant (post-launch)
}
```

- Provider chosen by env (`AI_PROVIDER=mock|gemini|claude`). Dev defaults to `mock`.
- **Prompt caching** + storing outputs keeps repeat cost near zero.
- Keep prompts in version control; support Bangla + English output.

---

## Guardrails

- **Grounding:** customer-facing AI answers only from catalog/order data (tool calling / retrieval). No open-ended generation about price, stock, or delivery promises.
- **Human-in-the-loop:** admin reviews AI-generated listings before publish.
- **Rate-limit** AI endpoints (reuse the Postgres rate-limit from `F6.3`) to cap cost/abuse.
- **Moderation:** filter user input to the chatbot; never expose internal data (costs, fraud scores, other customers).
- **Graceful fallback:** if the AI provider is down/over quota, features degrade silently (manual description, plain review list, keyword search).

---

## Sprint placement (summary)

| Feature | Phase | Hook |
|---|---|---|
| AI-1 Product content gen | 1 (catalog) — *enhancement* | Admin `A1.2` |
| AI-5 SEO/alt-text | 1 / 6 | `A1.2`, `S6.2` |
| AI-2 Review summary | 2 (PDP) — *enhancement* | `S2.2`, new field on `Product` |
| AI-3 Semantic search | 6 (after keyword search) | `F6.1` + `pgvector` |
| AI-4 Chatbot | 7+ (post-launch) | new storefront widget |
| AI-6 Recommendations | 7+ | PDP/cart/home |

**Recommended first build:** AI-1 + AI-2 — highest user value, one-shot + cached, runs essentially free. Defer AI-4 (the only per-interaction cost) to post-launch.
