import type { Prisma } from "@/generated/prisma/client";
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

export interface AuditLogFilters {
  entity?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** Searchable, paginated audit log for the admin viewer. */
export async function listAuditLogs(filters: AuditLogFilters = {}) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(500, Math.max(1, filters.pageSize ?? 100));
  const search = filters.search?.trim();

  const where: Prisma.AuditLogWhereInput = {
    ...(filters.entity ? { entity: filters.entity } : {}),
    ...(search
      ? {
          OR: [
            { action: { contains: search, mode: "insensitive" } },
            { entity: { contains: search, mode: "insensitive" } },
            { entityId: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { admin: { select: { name: true, email: true } } },
    }),
  ]);

  return { items, total, page, pageSize };
}

export type AuditLogRow = Awaited<ReturnType<typeof listAuditLogs>>["items"][number];
