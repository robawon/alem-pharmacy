"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, FileText } from "lucide-react";
import { useStore } from "@/lib/store";
import { relativeTime } from "@/lib/utils";

export default function AdminLogsPage() {
  const { auditLogs } = useStore();

  return (
    <AppShell requiredRole="admin">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Global System Audit Logs</h1>
          <p className="text-sm text-muted">Immutable, append-only security log records across all pharmacy actions.</p>
        </div>

        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            <CardTitle className="text-foreground">Audit Log Stream</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {auditLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-container-high/40 text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-teal-400 font-medium px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20">
                    {log.action_type}
                  </span>
                  <span className="text-foreground">{log.payload_delta}</span>
                </div>
                <span className="text-muted shrink-0 ml-2">{relativeTime(log.timestamp)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
