import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getSession } from "@/server/auth-session";
import { listAllZones } from "@/server/services/shipping";
import { listAuditLogs } from "@/server/services/audit";
import { PageHeader } from "@/components/admin/page-header";
import { SettingsTabs } from "@/components/admin/settings/settings-tabs";
import type { AdminUserRow } from "@/components/admin/settings/users-manager";
import type { AuditRow } from "@/components/admin/settings/audit-viewer";
import type { ZoneRow } from "@/components/admin/settings/zones-manager";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();

  const [zonesRaw, usersRes, logsRes] = await Promise.all([
    listAllZones(),
    auth.api.listUsers({ query: { limit: 200, sortBy: "createdAt" }, headers: await headers() }),
    listAuditLogs({ pageSize: 200 }),
  ]);

  const zones: ZoneRow[] = zonesRaw.map((z) => ({
    id: z.id,
    name: z.name,
    fee: z.fee,
    freeShipThreshold: z.freeShipThreshold,
    sortOrder: z.sortOrder,
    isActive: z.isActive,
  }));

  const users: AdminUserRow[] = ("users" in usersRes ? usersRes.users : []).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: (u.role as string) ?? "CUSTOMER",
  }));

  const logs: AuditRow[] = logsRes.items.map((l) => ({
    id: l.id,
    action: l.action,
    entity: l.entity,
    entityId: l.entityId,
    adminName: l.admin?.name ?? null,
    createdAt: l.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Settings"
        description="Shipping zones, admin access, and the audit trail."
      />
      <SettingsTabs
        zones={zones}
        users={users}
        currentUserId={session?.user.id ?? ""}
        logs={logs}
      />
    </div>
  );
}
