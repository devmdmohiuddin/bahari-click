import { z } from "zod";

// AI-1 product content generation input. Admin-only; validated before the
// provider call. Either a working title or some source text must be present.
export const generateProductContentSchema = z
  .object({
    title: z.string().trim().max(300).optional(),
    sourceText: z.string().trim().max(8000).optional(),
    category: z.string().trim().max(300).optional(),
    language: z.enum(["bn", "en", "both"]).default("en"),
  })
  .refine((v) => Boolean(v.title?.length || v.sourceText?.length), {
    message: "Provide a product name or some source text to generate from",
    path: ["sourceText"],
  });

export type GenerateProductContentInput = z.infer<typeof generateProductContentSchema>;

// AI-4 shopping assistant chat. Public; the full short transcript is sent each
// turn (the API is stateless). Capped to bound prompt size / cost.
export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(2000),
});

export const assistantChatSchema = z.object({
  messages: z.array(chatMessageSchema).min(1).max(20),
});

export type AssistantChatInput = z.infer<typeof assistantChatSchema>;
