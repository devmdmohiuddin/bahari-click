"use server";

import { RATE_LIMITS } from "@/lib/rate-limits";
import { ok, toResult, type Result } from "@/lib/result";
import { requireAdmin } from "@/server/auth-session";
import { recordAudit } from "@/server/services/audit";
import { generateProductContent, regenerateReviewSummary } from "@/server/services/ai";
import { assistantReply } from "@/server/services/assistant";
import { clientIp, enforcePolicy } from "@/server/services/rate-limit";
import type { GeneratedProductContent, ReviewSummary } from "@/server/integrations/ai";
import {
  assistantChatSchema,
  type AssistantChatInput,
  type GenerateProductContentInput,
} from "@/server/validators/ai";

// AI-1: generate product copy for the editor. Admin-only, rate-limited per admin.
export async function generateProductContentAction(
  input: GenerateProductContentInput,
): Promise<Result<GeneratedProductContent>> {
  try {
    const session = await requireAdmin();
    await enforcePolicy(`ai:generate:${session.user.id}`, RATE_LIMITS.aiGenerate);
    const content = await generateProductContent(input);
    return ok(content);
  } catch (error) {
    return toResult(error);
  }
}

// AI-2: manually (re)generate a product's review summary from the admin UI.
export async function regenerateReviewSummaryAction(
  productId: string,
): Promise<Result<{ summary: ReviewSummary | null }>> {
  try {
    const session = await requireAdmin();
    await enforcePolicy(`ai:generate:${session.user.id}`, RATE_LIMITS.aiGenerate);
    const summary = await regenerateReviewSummary(productId);
    await recordAudit({
      adminId: session.user.id,
      action: "ai.review_summary",
      entity: "Product",
      entityId: productId,
    });
    return ok({ summary });
  } catch (error) {
    return toResult(error);
  }
}

// AI-4: grounded shopping assistant. Public; rate-limited per IP.
export async function assistantChatAction(
  input: AssistantChatInput,
): Promise<Result<{ reply: string }>> {
  try {
    const data = assistantChatSchema.parse(input);
    await enforcePolicy(`ai:chat:${await clientIp()}`, RATE_LIMITS.aiChat);
    return ok(await assistantReply(data));
  } catch (error) {
    return toResult(error);
  }
}
