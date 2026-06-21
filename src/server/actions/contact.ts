"use server";

import { RATE_LIMITS } from "@/lib/rate-limits";
import { ok, toResult, type Result } from "@/lib/result";
import { requireAdmin } from "@/server/auth-session";
import { recordAudit } from "@/server/services/audit";
import { createContactMessage, setContactRead } from "@/server/services/contact";
import { clientIp, enforcePolicy } from "@/server/services/rate-limit";
import { contactMessageSchema, type ContactMessageInput } from "@/server/validators/contact";

// Public: submit a contact-form message. Zod-validated + rate-limited per IP.
export async function submitContactMessageAction(
  input: ContactMessageInput,
): Promise<Result<{ id: string }>> {
  try {
    const data = contactMessageSchema.parse(input);
    await enforcePolicy(`contact:submit:${await clientIp()}`, RATE_LIMITS.contactSubmit);
    const message = await createContactMessage(data);
    return ok({ id: message.id });
  } catch (error) {
    return toResult(error);
  }
}

// Admin: mark a message read/unread.
export async function setContactReadAction(
  id: string,
  isRead = true,
): Promise<Result<{ id: string; isRead: boolean }>> {
  try {
    const session = await requireAdmin();
    const message = await setContactRead(id, isRead);
    await recordAudit({
      adminId: session.user.id,
      action: "contact.set_read",
      entity: "ContactMessage",
      entityId: id,
      diff: { isRead },
    });
    return ok({ id: message.id, isRead: message.isRead });
  } catch (error) {
    return toResult(error);
  }
}
