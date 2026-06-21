"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ZonesManager, type ZoneRow } from "@/components/admin/settings/zones-manager";
import { UsersManager, type AdminUserRow } from "@/components/admin/settings/users-manager";
import { AuditViewer, type AuditRow } from "@/components/admin/settings/audit-viewer";

export function SettingsTabs({
  zones,
  users,
  currentUserId,
  logs,
}: {
  zones: ZoneRow[];
  users: AdminUserRow[];
  currentUserId: string;
  logs: AuditRow[];
}) {
  return (
    <Tabs defaultValue="zones">
      <TabsList>
        <TabsTrigger value="zones">Shipping zones</TabsTrigger>
        <TabsTrigger value="users">Users &amp; roles</TabsTrigger>
        <TabsTrigger value="audit">Audit log</TabsTrigger>
      </TabsList>
      <TabsContent value="zones">
        <ZonesManager zones={zones} />
      </TabsContent>
      <TabsContent value="users">
        <UsersManager users={users} currentUserId={currentUserId} />
      </TabsContent>
      <TabsContent value="audit">
        <AuditViewer logs={logs} />
      </TabsContent>
    </Tabs>
  );
}
