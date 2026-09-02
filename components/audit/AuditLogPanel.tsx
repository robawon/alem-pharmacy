"use client";

import { ScrollText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuditLogEntry } from "@/lib/types";
import { relativeTime } from "@/lib/utils";

function actionColor(actionType: string): "default" | "success" | "destructive" | "warning" | "primary" {
  if (actionType.includes("REJECTED") || actionType.includes("SUSPENDED") || actionType.includes("DISPOSED") || actionType.includes("QUARANTINED")) {
    return "destructive";
  }
  if (actionType.includes("VERIFIED") || actionType.includes("COMPLETED") || actionType.includes("RECEIVED") || actionType.includes("ACTIVATED")) {
    return "success";
  }
  if (actionType.includes("EXPORTED") || actionType.includes("LOGIN")) {
    return "primary";
  }
  return "warning";
}

export function AuditLogPanel({
  logs,
  title = "Live System Audit Log",
  maxHeightClass = "max-h-[520px]",
  limit,
}: {
  logs: AuditLogEntry[];
  title?: string;
  maxHeightClass?: string;
  limit?: number;
}) {
  const shown = limit ? logs.slice(0, limit) : logs;
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <ScrollText className="h-4 w-4 text-primary-fixed-dim" />
          <CardTitle className="text-foreground">{title}</CardTitle>
        </div>
        <Badge variant="primary">{logs.length} events</Badge>
      </CardHeader>
      <CardContent>
        <div className={`flex flex-col gap-2 overflow-y-auto pr-1 ${maxHeightClass}`}>
          {shown.length === 0 && (
            <p className="py-6 text-center text-sm text-muted">No audit events yet.</p>
          )}
          {shown.map((log) => (
            <div
              key={log.id}
              className="rounded-md border border-border/60 bg-surface-container-high/40 p-3 text-sm"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <Badge variant={actionColor(log.action_type)} className="font-mono text-[10px]">
                  {log.action_type}
                </Badge>
                <span className="whitespace-nowrap text-xs text-muted">{relativeTime(log.timestamp)}</span>
              </div>
              <p className="text-foreground/90">{log.payload_delta}</p>
              <p className="mt-1 text-xs text-muted">
                by {log.user_id} &middot; {log.user_role}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
