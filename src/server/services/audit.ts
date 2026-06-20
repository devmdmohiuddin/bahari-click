import { db } from "@/lib/db";

// Audit-log helper. Call from services whenever an admin mutates a sensitive
// entity (orders, stock, etc.). Best-effort: a logging failure must never break
// the underlying business operation.

export interface AuditEntry {
  adminId?: string | null;
  action: string; // e.g. "order.status_change"
  entity: string; // e.g. "Order"
  entityId?: string | null;
  diff?: unknown; // before/after or change payload
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        adminId: entry.adminId ?? null,
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId ?? null,
        diff: entry.diff === undefined ? undefined : (entry.diff as object),
      },
    });
  } catch (error) {
    console.error("[audit] failed to record entry", entry.action, error);
  }
}
