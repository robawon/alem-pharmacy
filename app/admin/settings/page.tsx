"use client";

import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, ShieldCheck, Database, Server } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AdminSettingsPage() {
  return (
    <AppShell requiredRole="admin">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Settings</h1>
          <p className="text-sm text-muted">Platform configuration, security controls, and audit rules.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-teal-400" />
              <CardTitle className="text-foreground">Security &amp; Audit Engine</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted">Append-Only Audit Policy</span>
                <Badge variant="success">ENFORCED</Badge>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted">Role-Based Access Control (RBAC)</span>
                <Badge variant="success">ACTIVE</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Drug Interaction Checks</span>
                <Badge variant="success">ENABLED</Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center gap-2">
              <Server className="h-5 w-5 text-purple-400" />
              <CardTitle className="text-foreground">System Environment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted">Database Engine</span>
                <span className="font-mono text-xs">PostgreSQL / Supabase</span>
              </div>
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <span className="text-muted">Framework</span>
                <span className="font-mono text-xs">Next.js App Router</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Pharmacy Branch</span>
                <span className="font-medium text-foreground">Alem Pharmacy Main</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
