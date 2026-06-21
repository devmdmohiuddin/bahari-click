"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AuditRow = {
  id: string;
  action: string;
  entity: string;
  entityId: string | null;
  adminName: string | null;
  createdAt: string;
};

export function AuditViewer({ logs }: { logs: AuditRow[] }) {
  const [query, setQuery] = useState("");
  const [entity, setEntity] = useState("all");

  const entities = useMemo(() => [...new Set(logs.map((l) => l.entity))].sort(), [logs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return logs.filter((l) => {
      if (entity !== "all" && l.entity !== entity) return false;
      if (!q) return true;
      return (
        l.action.toLowerCase().includes(q) ||
        l.entity.toLowerCase().includes(q) ||
        (l.entityId?.toLowerCase().includes(q) ?? false) ||
        (l.adminName?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [logs, query, entity]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search action, entity, id, admin…"
            className="pl-9"
          />
        </div>
        <Select value={entity} onValueChange={setEntity}>
          <SelectTrigger className="sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All entities</SelectItem>
            {entities.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((l) => (
              <TableRow key={l.id}>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {formatDate(l.createdAt)}
                </TableCell>
                <TableCell>{l.adminName ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="font-mono">
                    {l.action}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {l.entity}
                  {l.entityId ? <span className="font-mono text-xs"> · {l.entityId}</span> : ""}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground py-10 text-center">
                  No matching audit entries.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
